/**
 * Event cluster repository — CRUD for event_cluster table.
 */

import type { PoolClient } from 'pg';
import type { EventClusterRow } from '../types';

export interface CreateEventClusterInput {
  label?: string | null;
  summary?: string | null;
  first_event_at?: Date | null;
  last_event_at?: Date | null;
  event_count?: number;
  metadata?: Record<string, unknown> | null;
}

/**
 * Create an event cluster.
 */
export async function createEventCluster(
  client: PoolClient,
  input: CreateEventClusterInput
): Promise<EventClusterRow> {
  const { rows } = await client.query<EventClusterRow>(
    `INSERT INTO event_cluster (label, summary, first_event_at, last_event_at, event_count, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      input.label ?? null,
      input.summary ?? null,
      input.first_event_at ?? null,
      input.last_event_at ?? null,
      input.event_count ?? 0,
      input.metadata ?? null,
    ]
  );
  return rows[0]!;
}
