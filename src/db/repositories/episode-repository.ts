/**
 * Episode repository — CRUD operations for episode and episode_event tables.
 */

import type { PoolClient } from 'pg';
import type { EpisodeRow, EpisodeEventRow, EpisodeStatus } from '../types';

export interface CreateEpisodeInput {
  label?: string | null;
  summary?: string | null;
  status?: EpisodeStatus;
  first_event_at?: Date | null;
  last_event_at?: Date | null;
  event_count?: number;
  footprint_geojson?: unknown | null;
  metadata?: Record<string, unknown> | null;
}

export async function createEpisode(
  client: PoolClient,
  input: CreateEpisodeInput
): Promise<EpisodeRow> {
  const now = new Date();
  const status = input.status ?? 'open';
  const { rows } = await client.query<EpisodeRow>(
    `INSERT INTO episode (label, summary, status, first_event_at, last_event_at, event_count, footprint_geojson, metadata, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      input.label ?? null,
      input.summary ?? null,
      status,
      input.first_event_at ?? null,
      input.last_event_at ?? null,
      input.event_count ?? 0,
      input.footprint_geojson ?? null,
      input.metadata ?? null,
      now,
      now,
    ]
  );
  return rows[0]!;
}

export async function updateEpisodeStatus(
  client: PoolClient,
  episodeId: string,
  status: EpisodeStatus
): Promise<void> {
  await client.query(
    'UPDATE episode SET status = $1, updated_at = now() WHERE id = $2',
    [status, episodeId]
  );
}

export async function closeStaleEpisodes(
  client: PoolClient,
  olderThan: Date
): Promise<number> {
  const { rows } = await client.query<{ count: number }>(
    `WITH updated AS (
       UPDATE episode SET status = 'closed', updated_at = now()
       WHERE status = 'open' AND last_event_at < $1
       RETURNING 1
     )
     SELECT COUNT(*)::int as count FROM updated`,
    [olderThan]
  );
  return rows[0]?.count ?? 0;
}

export async function linkEventToEpisode(
  client: PoolClient,
  episodeId: string,
  eventId: string,
  order = 0
): Promise<EpisodeEventRow> {
  const { rows } = await client.query<EpisodeEventRow>(
    `INSERT INTO episode_event (episode_id, event_id, "order")
     VALUES ($1, $2, $3)
     ON CONFLICT (episode_id, event_id) DO UPDATE SET "order" = EXCLUDED."order"
     RETURNING *`,
    [episodeId, eventId, order]
  );
  return rows[0]!;
}

export async function getEpisodeById(
  client: PoolClient,
  id: string
): Promise<EpisodeRow | null> {
  const { rows } = await client.query<EpisodeRow>(
    'SELECT * FROM episode WHERE id = $1',
    [id]
  );
  return rows[0] ?? null;
}

export async function listEpisodes(
  client: PoolClient,
  opts: { limit?: number; offset?: number; fromDate?: Date; openOnly?: boolean } = {}
): Promise<{ episodes: EpisodeRow[]; total: number }> {
  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;
  const params: unknown[] = [];
  let paramIndex = 1;
  const conditions: string[] = [];

  if (opts.fromDate) {
    conditions.push(`last_event_at >= $${paramIndex++}`);
    params.push(opts.fromDate);
  }
  if (opts.openOnly) {
    conditions.push(`status = $${paramIndex++}`);
    params.push('open');
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(limit, offset);

  const { rows } = await client.query<EpisodeRow>(
    `SELECT * FROM episode ${whereClause}
     ORDER BY last_event_at DESC NULLS LAST
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    params
  );

  const countResult = await client.query<{ total: number }>(
    `SELECT COUNT(*)::int as total FROM episode ${whereClause}`,
    params.slice(0, -2)
  );
  const total = countResult.rows[0]?.total ?? 0;

  return { episodes: rows, total };
}

export async function getEpisodeEventIds(
  client: PoolClient,
  episodeId: string
): Promise<string[]> {
  const { rows } = await client.query<{ event_id: string }>(
    `SELECT event_id FROM episode_event WHERE episode_id = $1 ORDER BY "order" ASC`,
    [episodeId]
  );
  return rows.map((r) => r.event_id);
}

export async function updateEpisodeTimes(
  client: PoolClient,
  episodeId: string,
  firstEventAt: Date,
  lastEventAt: Date,
  eventCount: number
): Promise<void> {
  await client.query(
    `UPDATE episode SET first_event_at = $1, last_event_at = $2, event_count = $3, updated_at = now()
     WHERE id = $4`,
    [firstEventAt, lastEventAt, eventCount, episodeId]
  );
}
