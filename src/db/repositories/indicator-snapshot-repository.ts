/**
 * Indicator snapshot repository — persist and query indicator_snapshot.
 * Phase F — analytics persistence.
 */

import type { PoolClient } from 'pg';
import type { IndicatorSnapshotRow } from '../types';

export interface CreateSnapshotInput {
  indicator_key: string;
  period_start: Date;
  period_end: Date;
  payload: Record<string, unknown>;
}

/**
 * Insert an indicator snapshot.
 */
export async function createSnapshot(
  client: PoolClient,
  input: CreateSnapshotInput
): Promise<IndicatorSnapshotRow> {
  const now = new Date();
  const { rows } = await client.query<IndicatorSnapshotRow>(
    `INSERT INTO indicator_snapshot (indicator_key, period_start, period_end, payload, computed_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [input.indicator_key, input.period_start, input.period_end, input.payload, now]
  );
  return rows[0]!;
}

/**
 * Get latest snapshot(s) for an indicator key, optionally limiting count.
 */
export async function getLatestSnapshots(
  client: PoolClient,
  indicatorKey: string,
  limit = 24
): Promise<IndicatorSnapshotRow[]> {
  const { rows } = await client.query<IndicatorSnapshotRow>(
    `SELECT * FROM indicator_snapshot
     WHERE indicator_key = $1
     ORDER BY computed_at DESC
     LIMIT $2`,
    [indicatorKey, limit]
  );
  return rows;
}
