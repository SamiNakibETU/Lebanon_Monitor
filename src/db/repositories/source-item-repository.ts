/**
 * Source item repository — CRUD for source_item and raw_ingest.
 */

import type { PoolClient } from 'pg';
import type { RawIngestRow, SourceItemRow } from '../types';

export interface CreateRawIngestInput {
  source_name: string;
  source_url?: string | null;
  raw_content_type?: string | null;
  raw_storage_path?: string | null;
  hash?: string | null;
  request_metadata?: Record<string, unknown> | null;
  response_metadata?: Record<string, unknown> | null;
  ingest_status?: 'pending' | 'processed' | 'failed';
}

export interface CreateSourceItemInput {
  raw_ingest_id?: string | null;
  source_name: string;
  external_id: string;
  observed_title?: string | null;
  observed_summary?: string | null;
  observed_at?: Date | null;
  source_url?: string | null;
  raw_data?: Record<string, unknown> | null;
}

/**
 * Create a raw_ingest record.
 */
export async function createRawIngest(
  client: PoolClient,
  input: CreateRawIngestInput
): Promise<RawIngestRow> {
  const { rows } = await client.query<RawIngestRow>(
    `INSERT INTO raw_ingest (
      source_name, source_url, raw_content_type, raw_storage_path,
      hash, request_metadata, response_metadata, ingest_status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      input.source_name,
      input.source_url ?? null,
      input.raw_content_type ?? null,
      input.raw_storage_path ?? null,
      input.hash ?? null,
      input.request_metadata ?? null,
      input.response_metadata ?? null,
      input.ingest_status ?? 'pending',
    ]
  );
  return rows[0]!;
}

/**
 * Upsert source_item (insert or update last_seen_at on conflict).
 */
export async function upsertSourceItem(
  client: PoolClient,
  input: CreateSourceItemInput
): Promise<SourceItemRow> {
  const now = new Date();
  const { rows } = await client.query<SourceItemRow>(
    `INSERT INTO source_item (
      raw_ingest_id, source_name, external_id, observed_title, observed_summary,
      observed_at, source_url, raw_data, first_seen_at, last_seen_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
    ON CONFLICT (source_name, external_id)
    DO UPDATE SET
      observed_title = COALESCE(EXCLUDED.observed_title, source_item.observed_title),
      observed_summary = COALESCE(EXCLUDED.observed_summary, source_item.observed_summary),
      observed_at = COALESCE(EXCLUDED.observed_at, source_item.observed_at),
      source_url = COALESCE(EXCLUDED.source_url, source_item.source_url),
      raw_data = COALESCE(EXCLUDED.raw_data, source_item.raw_data),
      last_seen_at = $9
    RETURNING *`,
    [
      input.raw_ingest_id ?? null,
      input.source_name,
      input.external_id,
      input.observed_title ?? null,
      input.observed_summary ?? null,
      input.observed_at ?? null,
      input.source_url ?? null,
      input.raw_data ?? null,
      now,
    ]
  );
  return rows[0]!;
}

/**
 * Find source_item by source_name and external_id.
 */
export async function findSourceItem(
  client: PoolClient,
  sourceName: string,
  externalId: string
): Promise<SourceItemRow | null> {
  const { rows } = await client.query<SourceItemRow>(
    'SELECT * FROM source_item WHERE source_name = $1 AND external_id = $2',
    [sourceName, externalId]
  );
  return rows[0] ?? null;
}
