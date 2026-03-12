import { NextResponse } from 'next/server';
import { withClient, isDbConfigured } from '@/db/client';
import { cachedFetch } from '@/lib/cache';

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ generatedAt: new Date().toISOString(), items: [] });
  }

  try {
    const payload = await cachedFetch(
      'lm:analyst-workbench:v1',
      async () =>
        withClient(async (client) => {
          const { rows } = await client.query<{
            event_id: string;
            title: string;
            occurred_at: string;
            observation_count: number;
            source_diversity: number;
            verification_status: string;
          }>(
            `SELECT
              e.id as event_id,
              e.canonical_title as title,
              e.occurred_at,
              COUNT(eo.id)::int as observation_count,
              COUNT(DISTINCT si.source_name)::int as source_diversity,
              e.verification_status::text
            FROM event e
            LEFT JOIN event_observation eo ON eo.event_id = e.id
            LEFT JOIN source_item si ON si.id = eo.source_item_id
            WHERE e.is_active = true
            GROUP BY e.id
            ORDER BY e.occurred_at DESC
            LIMIT 120`
          );

          return {
            generatedAt: new Date().toISOString(),
            _meta: { description: 'Event list with observation count (sources corroborating), not extracted claims.' },
            items: rows.map((r) => ({
              eventId: r.event_id,
              title: r.title,
              occurredAt: r.occurred_at,
              observationCount: r.observation_count,
              sourceDiversity: r.source_diversity,
              mediaCount: 0,
              verificationStatus: r.verification_status,
            })),
          };
        }),
      { ttl: 300 }
    );

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=900' },
    });
  } catch (err) {
    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      items: [],
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

