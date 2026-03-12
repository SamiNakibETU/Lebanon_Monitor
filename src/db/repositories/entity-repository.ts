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
