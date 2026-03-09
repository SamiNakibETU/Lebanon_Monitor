import { NextResponse } from 'next/server';
import { withClient, isDbConfigured } from '@/db/client';
import { cachedFetch } from '@/lib/cache';

const SOURCE_TTLS: Record<string, number> = {
  gdelt: 15 * 60,
  rss: 30 * 60,
  ucdp: 12 * 60 * 60,
  firms: 3 * 60 * 60,
  cloudflare: 30 * 60,
  'lbp-rate': 60 * 60,
  reliefweb: 60 * 60,
  twitter: 30 * 60,
  telegram: 30 * 60,
};

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ items: [], generatedAt: new Date().toISOString() });
  }

  try {
    const payload = await cachedFetch(
      'v2:data-freshness',
      async () =>
        withClient(async (client) => {
          const { rows } = await client.query<{
            source_name: string;
            checked_at: string;
            status: string;
            item_count: number | null;
            error_message: string | null;
          }>(
            `SELECT DISTINCT ON (source_name)
               source_name, checked_at, status, item_count, error_message
             FROM source_health_log
             ORDER BY source_name, checked_at DESC`
          );

          const now = Date.now();
          const items = rows.map((r) => {
            const checkedAt = new Date(r.checked_at);
            const ageSec = Math.max(0, (now - checkedAt.getTime()) / 1000);
            const ttl = SOURCE_TTLS[r.source_name] ?? 3600;
            const stale = ageSec > ttl * 2;
            return {
              source: r.source_name,
              checkedAt: checkedAt.toISOString(),
              ageSeconds: Math.round(ageSec),
              ttlSeconds: ttl,
              stale,
              status: stale ? 'stale' : r.status,
              itemCount: r.item_count ?? 0,
              error: r.error_message ?? null,
            };
          });

          return { items, generatedAt: new Date().toISOString() };
        }),
      { ttl: 120 }
    );

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    });
  } catch (err) {
    return NextResponse.json(
      { items: [], generatedAt: new Date().toISOString(), error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
