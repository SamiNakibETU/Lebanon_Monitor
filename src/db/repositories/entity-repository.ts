/**
 * Entity repository — upsert entities and link to events.
 */

import type { PoolClient } from 'pg';
import type { EntityRow } from '../types';

export type EntityType = 'person' | 'organization' | 'place';

/**
 * Find or create entity by name and type. Returns existing or newly created.
 */
export async function upsertEntity(
  client: PoolClient,
  name: string,
  entityType: EntityType
): Promise<EntityRow> {
  const key = name.slice(0, 255);
  const existing = await client.query<EntityRow>(
    `SELECT * FROM entity WHERE name = $1 AND entity_type = $2 LIMIT 1`,
    [key, entityType]
  );
  if (existing.rows[0]) return existing.rows[0];
  const inserted = await client.query<EntityRow>(
    `INSERT INTO entity (name, entity_type) VALUES ($1, $2) RETURNING *`,
    [key, entityType]
  );
  return inserted.rows[0]!;
}

/**
 * Get entities linked to an event.
 */
export async function getEntitiesByEventId(
  client: PoolClient,
  eventId: string
): Promise<Array<EntityRow & { role: string | null }>> {
  const { rows } = await client.query<EntityRow & { role: string | null }>(
    `SELECT e.id, e.name, e.entity_type, e.metadata, e.created_at, ee.role
     FROM entity e
     JOIN event_entity ee ON ee.entity_id = e.id
     WHERE ee.event_id = $1`,
    [eventId]
  );
  return rows;
}

/**
 * Link event to entity with optional role.
 */
export async function linkEventToEntity(
  client: PoolClient,
  eventId: string,
  entityId: string,
  role: string
): Promise<void> {
  await client.query(
    `INSERT INTO event_entity (event_id, entity_id, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (event_id, entity_id, role) DO NOTHING`,
    [eventId, entityId, role]
  );
}

/**
 * Get entity by ID.
 */
export async function getEntityById(
  client: PoolClient,
  id: string
): Promise<EntityRow | null> {
  const { rows } = await client.query<EntityRow>(
    'SELECT * FROM entity WHERE id = $1',
    [id]
  );
  return rows[0] ?? null;
}

export interface SearchEntitiesFilter {
  q?: string;
  entity_type?: EntityType;
  limit?: number;
  offset?: number;
}

/**
 * Search entities by name, optionally filter by type.
 */
export async function searchEntities(
  client: PoolClient,
  filter: SearchEntitiesFilter = {}
): Promise<{ entities: EntityRow[]; total: number }> {
  const limit = filter.limit ?? 50;
  const offset = filter.offset ?? 0;
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filter.q?.trim()) {
    conditions.push(`name ILIKE $${paramIndex++}`);
    params.push(`%${filter.q.trim()}%`);
  }
  if (filter.entity_type) {
    conditions.push(`entity_type = $${paramIndex++}`);
    params.push(filter.entity_type);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(limit, offset);

  const { rows } = await client.query<EntityRow>(
    `SELECT * FROM entity ${whereClause} ORDER BY name ASC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    params
  );
  const countResult = await client.query<{ total: number }>(
    `SELECT COUNT(*)::int as total FROM entity ${whereClause}`,
    params.slice(0, -2)
  );
  const total = countResult.rows[0]?.total ?? 0;
  return { entities: rows, total };
}

/**
 * Get events linked to an entity, ordered by occurred_at.
 */
export async function getEventsByEntity(
  client: PoolClient,
  entityId: string,
  opts: { limit?: number; offset?: number } = {}
): Promise<{ eventIds: string[]; total: number }> {
  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;
  const countResult = await client.query<{ total: number }>(
    `SELECT COUNT(*)::int as total FROM event_entity WHERE entity_id = $1`,
    [entityId]
  );
  const total = countResult.rows[0]?.total ?? 0;
  const { rows } = await client.query<{ event_id: string }>(
    `SELECT e.event_id
     FROM event_entity e
     JOIN event ev ON ev.id = e.event_id AND ev.is_active = true
     WHERE e.entity_id = $1
     ORDER BY ev.occurred_at DESC
     LIMIT $2 OFFSET $3`,
    [entityId, limit, offset]
  );
  return { eventIds: rows.map((r) => r.event_id), total };
}

/**
 * Get episodes that contain at least one event linked to this entity.
 */
export async function getEpisodesByEntity(
  client: PoolClient,
  entityId: string,
  opts: { limit?: number } = {}
): Promise<Array<{ episodeId: string; eventCount: number }>> {
  const limit = opts.limit ?? 20;
  const { rows } = await client.query<{ episode_id: string; event_count: number }>(
    `SELECT ee.episode_id, COUNT(*)::int as event_count
     FROM episode_event ee
     JOIN event_entity ev ON ev.event_id = ee.event_id
     WHERE ev.entity_id = $1
     GROUP BY ee.episode_id
     ORDER BY event_count DESC
     LIMIT $2`,
    [entityId, limit]
  );
  return rows.map((r) => ({ episodeId: r.episode_id, eventCount: r.event_count }));
}
