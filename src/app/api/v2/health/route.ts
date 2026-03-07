/**
 * API v2 health — source health status + last fetch timestamps.
 */

import { NextResponse } from 'next/server';
import { withClient } from '@/db/client';

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL && !process.env.DATABASE_PRIVATE_URL) {
    return NextResponse.json(
      { error: 'Database not configured', code: 500 },
      { status: 500 }
    );
  }

  try {
    const result = await withClient(async (client) => {
      const { rows } = await client.query<{
        source_name: string;
        status: string;
        checked_at: Date;
        response_time_ms: number | null;
        item_count: number | null;
        error_message: string | null;
      }>(
        `SELECT DISTINCT ON (source_name) source_name, status, checked_at, 
                response_time_ms, item_count, error_message
         FROM source_health_log 
         ORDER BY source_name, checked_at DESC`
      );

      const sources = rows.map((r) => ({
        name: r.source_name,
        status: r.status,
        lastChecked: r.checked_at,
        responseTimeMs: r.response_time_ms,
        itemCount: r.item_count,
        error: r.error_message,
      }));

      const { rows: pipelineRows } = await client.query<{
        started_at: Date;
        status: string;
        raw_count: number;
        events_created: number;
        events_updated: number;
      }>(
        `SELECT started_at, status, raw_count, events_created, events_updated 
         FROM pipeline_run 
         ORDER BY started_at DESC 
         LIMIT 1`
      );

      const lastRun = pipelineRows[0];

      return {
        sources,
        lastPipelineRun: lastRun
          ? {
              startedAt: lastRun.started_at,
              status: lastRun.status,
              rawCount: lastRun.raw_count,
              eventsCreated: lastRun.events_created,
              eventsUpdated: lastRun.events_updated,
            }
          : null,
      };
    });

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 's-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (err) {
    console.error('API v2 health error', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 500 },
      { status: 500 }
    );
  }
}
