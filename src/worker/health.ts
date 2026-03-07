/**
 * Worker health — log source_health_log and pipeline_run.
 */

import type { PoolClient } from 'pg';
import { withClient } from '@/db/client';
import type { SourceStatus } from '@/sources/registry';

export async function logSourceHealth(statuses: SourceStatus[]): Promise<void> {
  await withClient(async (client) => {
    for (const s of statuses) {
      await client.query(
        `INSERT INTO source_health_log (source_name, status, response_time_ms, item_count, error_message)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          s.source,
          s.status,
          s.responseTimeMs ?? null,
          s.eventCount ?? 0,
          s.error ?? null,
        ]
      );
    }
  });
}

export async function logPipelineRun(
  params: {
    status: 'running' | 'success' | 'partial_failure' | 'failure';
    sourcesRun: string[];
    rawCount: number;
    eventsCreated: number;
    eventsUpdated: number;
    startedAt?: Date;
    errorDetails?: Record<string, unknown>;
  }
): Promise<void> {
  await withClient(async (client) => {
    await client.query(
      `INSERT INTO pipeline_run (status, sources_run, raw_count, events_created, events_updated, started_at, finished_at, error_details)
       VALUES ($1, $2, $3, $4, $5, $6, now(), $7)`,
      [
        params.status,
        params.sourcesRun,
        params.rawCount,
        params.eventsCreated,
        params.eventsUpdated,
        params.startedAt ?? new Date(),
        params.errorDetails ?? null,
      ]
    );
  });
}

export async function startPipelineRun(sourcesRun: string[]): Promise<string> {
  let runId = '';
  await withClient(async (client) => {
    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO pipeline_run (status, sources_run, raw_count, events_created, events_updated)
       VALUES ('running', $1, 0, 0, 0)
       RETURNING id`,
      [sourcesRun]
    );
    runId = rows[0]?.id ?? '';
  });
  return runId;
}
