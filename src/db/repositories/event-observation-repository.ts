/**
 * Event observation repository — links source_item to event.
 */

import type { PoolClient } from 'pg';
import type { EventObservationRow } from '../types';

export interface CreateEventObservationInput {
  source_item_id: string;
  event_id: string;
  observed_title?: string | null;
  observed_summary?: string | null;
  observed_at?: Date | null;
  source_reliability_score?: number | null;
  extraction_confidence?: number | null;
  matching_confidence?: number | null;
  dedup_reason?: string | null;
  translation_status?: string | null;
  geocode_status?: string | null;
}

/**
 * Create an event_observation (insert or no-op on conflict).
 */
export async function createEventObservation(
  client: PoolClient,
  input: CreateEventObservationInput
): Promise<EventObservationRow | null> {
  const { rows } = await client.query<EventObservationRow>(
    `INSERT INTO event_observation (
      source_item_id, event_id, observed_title, observed_summary,
      observed_at, source_reliability_score, extraction_confidence,
      matching_confidence, dedup_reason, translation_status, geocode_status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (source_item_id, event_id) DO NOTHING
    RETURNING *`,
    [
      input.source_item_id,
      input.event_id,
      input.observed_title ?? null,
      input.observed_summary ?? null,
      input.observed_at ?? null,
      input.source_reliability_score ?? null,
      input.extraction_confidence ?? null,
      input.matching_confidence ?? null,
      input.dedup_reason ?? null,
      input.translation_status ?? null,
      input.geocode_status ?? null,
    ]
  );
  return rows[0] ?? null;
}

/**
 * Get source diversity (count of distinct source_name) for a set of event IDs.
 */
export async function getSourceDiversityForEventIds(
  client: PoolClient,
  eventIds: string[]
): Promise<number> {
  if (eventIds.length === 0) return 0;
  const { rows } = await client.query<{ count: string }>(
    `SELECT COUNT(DISTINCT si.source_name)::int as count
     FROM event_observation eo
     JOIN source_item si ON si.id = eo.source_item_id
     WHERE eo.event_id = ANY($1::uuid[])`,
    [eventIds]
  );
  return parseInt(rows[0]?.count ?? '0', 10);
}

/**
 * Get observation counts for a list of event IDs.
 * Returns a map of event_id -> count.
 */
export async function getObservationCountByEventIds(
  client: PoolClient,
  eventIds: string[]
): Promise<Map<string, number>> {
  if (eventIds.length === 0) return new Map();
  const { rows } = await client.query<{ event_id: string; cnt: string }>(
    `SELECT event_id, COUNT(*)::int as cnt
     FROM event_observation
     WHERE event_id = ANY($1::uuid[])
     GROUP BY event_id`,
    [eventIds]
  );
  return new Map(rows.map((r) => [r.event_id, parseInt(r.cnt, 10) || 0]));
}

/**
 * Get events with their source observations for dedup matching.
 */
export async function getRecentEventTitles(
  client: PoolClient,
  since: Date,
  limit = 500
): Promise<{ id: string; canonical_title: string; occurred_at: Date }[]> {
  const { rows } = await client.query<{ id: string; canonical_title: string; occurred_at: Date }>(
    `SELECT id, canonical_title, occurred_at FROM event
     WHERE is_active = true AND occurred_at >= $1
     ORDER BY occurred_at DESC LIMIT $2`,
    [since, limit]
  );
  return rows;
}
