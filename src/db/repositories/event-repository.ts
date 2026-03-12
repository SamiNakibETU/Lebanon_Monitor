/**
 * Event repository — CRUD operations for event table.
 */

import type { PoolClient } from "pg";
import type {
  EventRow,
  PolarityUi,
  VerificationStatus,
  GeoPrecision,
  GeoMethod,
} from "../types";

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
  geo_method?: GeoMethod | null;
  uncertainty_radius_m?: number | null;
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
  event_type?: string; // single category
  event_types?: readonly string[]; // multiple categories (e.g. political feed)
  min_confidence?: number;
  geo_precision?: GeoPrecision;
  multi_source_only?: boolean;
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
      place_id, geo_precision, geo_method, uncertainty_radius_m, primary_cluster_id, canonical_source_item_id,
      is_active, metadata, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, true, $20, $21, $22)
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
      input.verification_status ?? "unverified",
      input.occurred_at,
      now,
      now,
      input.place_id ?? null,
      input.geo_precision ?? null,
      input.geo_method ?? null,
      input.uncertainty_radius_m ?? null,
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
    "SELECT * FROM event WHERE id = $1 AND is_active = true",
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
  const conditions: string[] = ["is_active = true"];
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
  if (filter.event_type) {
    conditions.push(`event_type = $${paramIndex++}`);
    params.push(filter.event_type);
  }
  if (filter.event_types && filter.event_types.length > 0) {
    conditions.push(`event_type = ANY($${paramIndex++}::text[])`);
    params.push(filter.event_types);
  }
  if (typeof filter.min_confidence === 'number') {
    conditions.push(`COALESCE(confidence_score, 0) >= $${paramIndex++}`);
    params.push(filter.min_confidence);
  }
  if (filter.geo_precision) {
    conditions.push(`COALESCE(geo_precision, 'unknown') = $${paramIndex++}`);
    params.push(filter.geo_precision);
  }
  if (filter.multi_source_only) {
    conditions.push(`(
      SELECT COUNT(DISTINCT si2.source_name)
      FROM event_observation eo2
      JOIN source_item si2 ON si2.id = eo2.source_item_id
      WHERE eo2.event_id = event.id
    ) >= 2`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  if (filter.source) {
    params.push(filter.source);
    const countResult = await client.query(
      `SELECT COUNT(*)::int as total FROM event e
       JOIN event_observation eo ON eo.event_id = e.id
       JOIN source_item si ON si.id = eo.source_item_id
       ${whereClause.replaceAll('event.', 'e.')} AND si.source_name = $${paramIndex}`,
      [...params]
    );
    const total = countResult.rows[0]?.total ?? 0;

    params.push(filter.limit ?? 50, filter.offset ?? 0);
    const { rows } = await client.query<EventRow>(
      `SELECT DISTINCT e.* FROM event e
       JOIN event_observation eo ON eo.event_id = e.id
       JOIN source_item si ON si.id = eo.source_item_id
       ${whereClause.replaceAll('event.', 'e.')} AND si.source_name = $${paramIndex++}
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
    `SELECT * FROM event ${whereClause.replaceAll('event.', 'event.')}
     ORDER BY occurred_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    params
  );
  return { events: rows, total };
}

/**
 * Full-text search on canonical_title and canonical_summary.
 */
export async function searchEvents(
  client: PoolClient,
  q: string,
  limit = 20
): Promise<{ events: EventRow[]; total: number }> {
  const query = q.trim();
  if (!query) {
    return { events: [], total: 0 };
  }

  const safeQuery = query.replace(/'/g, "''").replace(/[^\w\s-]/g, " ");
  const likePattern = `%${safeQuery}%`;
  const searchSql = `
    SELECT e.*, ts_rank(
      to_tsvector('simple', COALESCE(e.canonical_title, '') || ' ' || COALESCE(e.canonical_summary, '')),
      plainto_tsquery('simple', $1)
    ) AS rank
    FROM event e
    WHERE e.is_active = true
      AND (
        to_tsvector('simple', COALESCE(e.canonical_title, '') || ' ' || COALESCE(e.canonical_summary, ''))
        @@ plainto_tsquery('simple', $1)
        OR e.canonical_title ILIKE $2
        OR e.canonical_summary ILIKE $2
      )
    ORDER BY rank DESC NULLS LAST, e.occurred_at DESC
    LIMIT $3
  `;
  const { rows } = await client.query<EventRow & { rank?: number }>(searchSql, [
    query,
    likePattern,
    limit,
  ]);

  const events = rows.map(({ rank: _rank, ...e }) => e) as EventRow[];

  const countResult = await client.query<{ total: number }>(
    `SELECT COUNT(*)::int as total FROM event e
     WHERE e.is_active = true
       AND (
         to_tsvector('simple', COALESCE(e.canonical_title, '') || ' ' || COALESCE(e.canonical_summary, ''))
         @@ plainto_tsquery('simple', $1)
         OR e.canonical_title ILIKE $2
         OR e.canonical_summary ILIKE $2
       )`,
    [query, likePattern]
  );

  const total = countResult.rows[0]?.total ?? 0;
  return { events, total };
}

/**
 * Get recent events without primary_cluster_id for clustering.
 */
export async function getRecentUnclusteredEvents(
  client: PoolClient,
  fromDate: Date,
  limit = 500
): Promise<EventRow[]> {
  const { rows } = await client.query<EventRow>(
    `SELECT * FROM event
     WHERE is_active = true AND primary_cluster_id IS NULL AND occurred_at >= $1
     ORDER BY occurred_at DESC
     LIMIT $2`,
    [fromDate, limit]
  );
  return rows;
}

/**
 * Update event confidence and verification_status based on multi-source convergence.
 * Called when a new observation is linked to an existing event.
 */
export async function updateEventConvergence(
  client: PoolClient,
  eventId: string,
  observationCount: number,
  baseConfidence: number | null
): Promise<void> {
  const boost = Math.min(0.2, (observationCount - 1) * 0.05);
  const safeBase = typeof baseConfidence === 'number' && !Number.isNaN(baseConfidence)
    ? Math.max(0, Math.min(1, baseConfidence))
    : 0.5;
  let newConfidence = Math.min(1, safeBase + boost);
  if (!Number.isFinite(newConfidence)) newConfidence = 0.5;
  const verificationStatus: VerificationStatus =
    observationCount >= 3 ? 'verified' : observationCount >= 2 ? 'partially_verified' : 'unverified';

  await client.query(
    `UPDATE event SET confidence_score = $1, verification_status = $2, updated_at = now()
     WHERE id = $3`,
    [newConfidence, verificationStatus, eventId]
  );
}

/**
 * Update event's primary_cluster_id.
 */
export async function updateEventPrimaryCluster(
  client: PoolClient,
  eventId: string,
  clusterId: string
): Promise<void> {
  await client.query(
    `UPDATE event SET primary_cluster_id = $1, updated_at = now() WHERE id = $2`,
    [clusterId, eventId]
  );
}
/**
 * Get recent events without primary_episode_id for episode linking.
 */
export async function getRecentUnepisodedEvents(
  client: PoolClient,
  fromDate: Date,
  limit = 500
): Promise<EventRow[]> {
  const { rows } = await client.query<EventRow>(
    `SELECT * FROM event
     WHERE is_active = true AND primary_episode_id IS NULL AND occurred_at >= $1
     ORDER BY occurred_at ASC
     LIMIT $2`,
    [fromDate, limit]
  );
  return rows;
}

/**
 * Update event's primary_episode_id.
 */
export async function updateEventPrimaryEpisode(
  client: PoolClient,
  eventId: string,
  episodeId: string
): Promise<void> {
  await client.query(
    `UPDATE event SET primary_episode_id = $1, updated_at = now() WHERE id = $2`,
    [episodeId, eventId]
  );
}

