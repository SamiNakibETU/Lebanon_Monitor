/**
 * Claim repository — CRUD operations for claim table.
 */

import type { PoolClient } from 'pg';
import type { ClaimRow, ClaimStatus } from '../types';

export interface CreateClaimInput {
  event_id: string;
  source_item_id?: string | null;
  text: string;
  claim_type?: string | null;
  confidence?: number | null;
  status?: ClaimStatus;
}

export async function createClaim(
  client: PoolClient,
  input: CreateClaimInput
): Promise<ClaimRow> {
  const { rows } = await client.query<ClaimRow>(
    `INSERT INTO claim (event_id, source_item_id, text, claim_type, confidence, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      input.event_id,
      input.source_item_id ?? null,
      input.text,
      input.claim_type ?? null,
      input.confidence ?? null,
      input.status ?? 'asserted',
    ]
  );
  return rows[0]!;
}

export async function getClaimsByEventId(
  client: PoolClient,
  eventId: string
): Promise<ClaimRow[]> {
  const { rows } = await client.query<ClaimRow>(
    `SELECT * FROM claim WHERE event_id = $1 ORDER BY created_at DESC`,
    [eventId]
  );
  return rows;
}

/**
 * Get claims for any of the given event IDs.
 */
export async function getClaimsByEventIds(
  client: PoolClient,
  eventIds: string[]
): Promise<ClaimRow[]> {
  if (eventIds.length === 0) return [];
  const { rows } = await client.query<ClaimRow>(
    `SELECT * FROM claim WHERE event_id = ANY($1::uuid[]) ORDER BY created_at DESC`,
    [eventIds]
  );
  return rows;
}

export async function getClaimById(
  client: PoolClient,
  id: string
): Promise<ClaimRow | null> {
  const { rows } = await client.query<ClaimRow>(
    'SELECT * FROM claim WHERE id = $1',
    [id]
  );
  return rows[0] ?? null;
}
