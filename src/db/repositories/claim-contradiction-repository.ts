/**
 * Claim contradiction repository — record contradictions between claims.
 */

import type { PoolClient } from 'pg';
import type { ClaimContradictionRow } from '../types';

export type ContradictionType = 'direct' | 'partial';

export interface CreateClaimContradictionInput {
  claim_id_a: string;
  claim_id_b: string;
  contradiction_type?: ContradictionType;
}

export async function createClaimContradiction(
  client: PoolClient,
  input: CreateClaimContradictionInput
): Promise<ClaimContradictionRow> {
  const { rows } = await client.query<ClaimContradictionRow>(
    `INSERT INTO claim_contradiction (claim_id_a, claim_id_b, contradiction_type)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [input.claim_id_a, input.claim_id_b, input.contradiction_type ?? 'direct']
  );
  return rows[0]!;
}

export async function getContradictionsByClaimId(
  client: PoolClient,
  claimId: string
): Promise<ClaimContradictionRow[]> {
  const { rows } = await client.query<ClaimContradictionRow>(
    `SELECT * FROM claim_contradiction
     WHERE claim_id_a = $1 OR claim_id_b = $1
     ORDER BY created_at DESC`,
    [claimId]
  );
  return rows;
}

/**
 * Get all contradictions for claims belonging to an event.
 */
export async function getContradictionsByEventId(
  client: PoolClient,
  eventId: string
): Promise<ClaimContradictionRow[]> {
  const { rows } = await client.query<ClaimContradictionRow>(
    `SELECT cc.* FROM claim_contradiction cc
     JOIN claim ca ON ca.id = cc.claim_id_a
     JOIN claim cb ON cb.id = cc.claim_id_b
     WHERE ca.event_id = $1 AND cb.event_id = $1
     ORDER BY cc.created_at DESC`,
    [eventId]
  );
  return rows;
}
