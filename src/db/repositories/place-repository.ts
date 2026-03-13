/**
 * Place repository — CRUD and queries for place table.
 * Phase 6 — read models for lieu/place pages.
 */

import type { PoolClient } from 'pg';
import type { PlaceRow } from '../types';

export interface ListPlacesFilter {
  place_type?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

export async function getPlaceById(
  client: PoolClient,
  id: string
): Promise<PlaceRow | null> {
  const { rows } = await client.query<PlaceRow>(
    'SELECT * FROM place WHERE id = $1',
    [id]
  );
  return rows[0] ?? null;
}

export async function listPlaces(
  client: PoolClient,
  filter: ListPlacesFilter = {}
): Promise<{ places: PlaceRow[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filter.place_type) {
    conditions.push(`place_type = $${paramIndex++}`);
    params.push(filter.place_type);
  }

  if (filter.q && filter.q.trim()) {
    const qPattern = `%${filter.q.trim()}%`;
    conditions.push(
      `(LOWER(name_primary) LIKE LOWER($${paramIndex}) OR
        LOWER(COALESCE(name_en, '')) LIKE LOWER($${paramIndex}) OR
        LOWER(COALESCE(name_fr, '')) LIKE LOWER($${paramIndex}) OR
        LOWER(COALESCE(name_ar, '')) LIKE LOWER($${paramIndex}))`
    );
    params.push(qPattern);
    paramIndex += 1;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const limit = filter.limit ?? 50;
  const offset = filter.offset ?? 0;
  params.push(limit, offset);

  const { rows } = await client.query<PlaceRow>(
    `SELECT * FROM place ${whereClause}
     ORDER BY name_primary ASC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    params
  );

  const countResult = await client.query<{ total: number }>(
    `SELECT COUNT(*)::int as total FROM place ${whereClause}`,
    params.slice(0, -2)
  );
  const total = countResult.rows[0]?.total ?? 0;

  return { places: rows, total };
}

/**
 * Find place by normalized name (primary or alias).
 */
export async function findPlaceByName(
  client: PoolClient,
  name: string
): Promise<PlaceRow | null> {
  const norm = name.trim().toLowerCase();
  if (!norm) return null;

  const { rows } = await client.query<PlaceRow>(
    `SELECT p.* FROM place p
     WHERE LOWER(p.name_primary) = $1
        OR LOWER(COALESCE(p.name_en, '')) = $1
        OR LOWER(COALESCE(p.name_fr, '')) = $1
        OR LOWER(COALESCE(p.name_ar, '')) = $1
     LIMIT 1`,
    [norm]
  );
  if (rows[0]) return rows[0];

  const { rows: aliasRows } = await client.query<{ place_id: string }>(
    `SELECT place_id FROM place_alias WHERE LOWER(alias) = $1 LIMIT 1`,
    [norm]
  );
  if (!aliasRows[0]) return null;

  return getPlaceById(client, aliasRows[0].place_id);
}

/**
 * Get events with place_id = placeId, ordered by occurred_at.
 */
export async function getEventsByPlace(
  client: PoolClient,
  placeId: string,
  opts: { limit?: number; offset?: number } = {}
): Promise<{ eventIds: string[]; total: number }> {
  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;
  const countResult = await client.query<{ total: number }>(
    `SELECT COUNT(*)::int as total FROM event WHERE place_id = $1 AND is_active = true`,
    [placeId]
  );
  const total = countResult.rows[0]?.total ?? 0;
  const { rows } = await client.query<{ id: string }>(
    `SELECT id FROM event WHERE place_id = $1 AND is_active = true
     ORDER BY occurred_at DESC LIMIT $2 OFFSET $3`,
    [placeId, limit, offset]
  );
  return { eventIds: rows.map((r) => r.id), total };
}

/**
 * Get episodes that contain at least one event with place_id = placeId.
 */
export async function getEpisodesByPlace(
  client: PoolClient,
  placeId: string,
  opts: { limit?: number } = {}
): Promise<Array<{ episodeId: string; eventCount: number }>> {
  const limit = opts.limit ?? 20;
  const { rows } = await client.query<{ episode_id: string; event_count: number }>(
    `SELECT ee.episode_id, COUNT(*)::int as event_count
     FROM episode_event ee
     JOIN event e ON e.id = ee.event_id AND e.is_active = true
     WHERE e.place_id = $1
     GROUP BY ee.episode_id
     ORDER BY event_count DESC
     LIMIT $2`,
    [placeId, limit]
  );
  return rows.map((r) => ({ episodeId: r.episode_id, eventCount: r.event_count }));
}
