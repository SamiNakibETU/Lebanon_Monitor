/**
 * Event repository — CRUD operations for event table.
 */

import type { PoolClient } from 'pg';
import type { EventRow, PolarityUi, VerificationStatus, GeoPrecision } from '../types';

export interface CreateEventInput {
  canonical_title: string;
  canonical_summary?: string | null;
  original_language?: string | null;
  event_type?: string | null;
  sub_type?: string | null;
  polarity_ui: PolarityUi;
  impact_score?: number | null;
  severity_score?: number | null;
  confidence_score?: number | null;
  verification_status?: VerificationStatus;
  occurred_at: Date;
  place_id?: string | null;
  geo_precision?: GeoPrecision | null;
  primary_cluster_id?: string | null;
  canonical_source_item_id?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface ListEventsFilter {
  source?: string;
  polarity?: PolarityUi;
  verification_status?: VerificationStatus;
  place_id?: string;
  from_date?: Date;
  to_date?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Create a new event.
 */
export async function createEvent(
  client: PoolClient,
  input: CreateEventInput
): Promise<EventRow> {
  const now = new Date();
  const { rows } = await client.query<EventRow>(
    `INSERT INTO event (
      canonical_title, canonical_summary, original_language,
      event_type, sub_type, polarity_ui, impact_score, severity_score, confidence_score,
      verification_status, occurred_at, first_seen_at, last_seen_at,
      place_id, geo_precision, primary_cluster_id, canonical_source_item_id,
      is_active, metadata, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, true, $18, $19, $20)
    RETURNING *`,
    [
      input.canonical_title,
      input.canonical_summary ?? null,
      input.original_language ?? null,
      input.event_type ?? null,
      input.sub_type ?? null,
      input.polarity_ui,
      input.impact_score ?? null,
      input.severity_score ?? null,
      input.confidence_score ?? null,
      input.verification_status ?? 'unverified',
      input.occurred_at,
      now,
      now,
      input.place_id ?? null,
      input.geo_precision ?? null,
      input.primary_cluster_id ?? null,
      input.canonical_source_item_id ?? null,
      input.metadata ?? null,
      now,
      now,
    ]
  );
  return rows[0]!;
}

/**
 * Get event by ID.
 */
export async function getEventById(
  client: PoolClient,
  id: string
): Promise<EventRow | null> {
  const { rows } = await client.query<EventRow>(
    'SELECT * FROM event WHERE id = $1 AND is_active = true',
    [id]
  );
  return rows[0] ?? null;
}

/**
 * List events with filters and pagination.
 */
export async function listEvents(
  client: PoolClient,
  filter: ListEventsFilter = {}
): Promise<{ events: EventRow[]; total: number }> {
  const conditions: string[] = ['is_active = true'];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filter.polarity) {
    conditions.push(`polarity_ui = $${paramIndex++}`);
    params.push(filter.polarity);
  }
  if (filter.verification_status) {
    conditions.push(`verification_status = $${paramIndex++}`);
    params.push(filter.verification_status);
  }
  if (filter.place_id) {
    conditions.push(`place_id = $${paramIndex++}`);
    params.push(filter.place_id);
  }
  if (filter.from_date) {
    conditions.push(`occurred_at >= $${paramIndex++}`);
    params.push(filter.from_date);
  }
  if (filter.to_date) {
    conditions.push(`occurred_at <= $${paramIndex++}`);
    params.push(filter.to_date);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  if (filter.source) {
    params.push(filter.source);
    const countResult = await client.query(
      `SELECT COUNT(*)::int as total FROM event e
       JOIN event_observation eo ON eo.event_id = e.id
       JOIN source_item si ON si.id = eo.source_item_id
       ${whereClause} AND si.source_name = $${paramIndex}`,
      [...params]
    );
    const total = countResult.rows[0]?.total ?? 0;

    params.push(filter.limit ?? 50, filter.offset ?? 0);
    const { rows } = await client.query<EventRow>(
      `SELECT DISTINCT e.* FROM event e
       JOIN event_observation eo ON eo.event_id = e.id
       JOIN source_item si ON si.id = eo.source_item_id
       ${whereClause} AND si.source_name = $${paramIndex++}
       ORDER BY e.occurred_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      params
    );
    return { events: rows, total };
  }

  const countResult = await client.query<{ total: number }>(
    `SELECT COUNT(*)::int as total FROM event ${whereClause}`,
    params
  );
  const total = countResult.rows[0]?.total ?? 0;

  params.push(filter.limit ?? 50, filter.offset ?? 0);
  const { rows } = await client.query<EventRow>(
    `SELECT * FROM event ${whereClause}
     ORDER BY occurred_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    params
  );
  return { events: rows, total };
}
