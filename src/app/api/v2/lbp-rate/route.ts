import { NextResponse } from 'next/server';
import { cachedFetch } from '@/lib/cache';
import { fetchLbpRate } from '@/sources/lbp-rate/fetcher';
import { withClient, isDbConfigured } from '@/db/client';

const FALLBACK_RATE = 89_500;
const OFFICIAL_RATE = Number(process.env.OFFICIAL_LBP_RATE ?? 89_500);

export async function GET() {
  try {
    const data = await cachedFetch(
      'lm:lbp-rate',
      async () => {
        const result = await fetchLbpRate();
        if (result.ok) {
          return { rate: result.data.rate, source: 'lirarate.org', updated: new Date().toISOString() };
        }
        return { rate: FALLBACK_RATE, source: 'fallback', updated: new Date().toISOString() };
      },
      { ttl: 3600 }
    );

    let trend30d: number[] = [];
    let volatility24h: number | null = null;
    if (isDbConfigured()) {
      const metrics = await withClient(async (client) => {
        const hist = await client.query<{ v: string }>(
          `SELECT (payload->>'value')::float8::text AS v
           FROM indicator_snapshot
           WHERE indicator_key = 'lbp'
             AND period_end >= NOW() - INTERVAL '30 days'
           ORDER BY period_end ASC`
        );
        const vol = await client.query<{ volatility: string | null }>(
          `WITH x AS (
             SELECT (payload->>'value')::float8 AS v
             FROM indicator_snapshot
             WHERE indicator_key = 'lbp'
               AND period_end >= NOW() - INTERVAL '24 hours'
           )
           SELECT
             CASE WHEN AVG(v) IS NULL OR AVG(v)=0 THEN NULL
               ELSE (STDDEV_POP(v)/AVG(v))*100
             END::text AS volatility
           FROM x`
        );
        return {
          history: hist.rows.map((r) => Number(r.v)).filter((n) => Number.isFinite(n)),
          volatility: vol.rows[0]?.volatility != null ? Number(vol.rows[0].volatility) : null,
        };
      });
      trend30d = metrics.history.slice(-30);
      volatility24h = metrics.volatility != null ? Number(metrics.volatility.toFixed(2)) : null;
    }

    const rate = data?.rate ?? FALLBACK_RATE;
    const spreadVsOfficial = OFFICIAL_RATE > 0 ? Number((((rate - OFFICIAL_RATE) / OFFICIAL_RATE) * 100).toFixed(2)) : null;

    return NextResponse.json(
      {
        rate,
        source: data?.source ?? 'fallback',
        updated: data?.updated ?? new Date().toISOString(),
        officialRate: OFFICIAL_RATE,
        spreadVsOfficial,
        volatility24h,
        trend30d,
      },
      {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200' },
      }
    );
  } catch {
    return NextResponse.json({
      rate: FALLBACK_RATE,
      source: 'fallback',
      updated: new Date().toISOString(),
      officialRate: OFFICIAL_RATE,
      spreadVsOfficial: 0,
      volatility24h: null,
      trend30d: [],
    });
  }
}
