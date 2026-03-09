import { NextResponse } from 'next/server';
import { withClient, isDbConfigured } from '@/db/client';
import { cachedFetch } from '@/lib/cache';

function clamp(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ score: 0, label: 'N/A', components: {}, history: [], generatedAt: new Date().toISOString() });
  }

  try {
    const payload = await cachedFetch(
      'v2:crisis-barometer',
      async () =>
        withClient(async (client) => {
          const row = await client.query<{
            ombre_24h: string;
            total_24h: string;
            armed_24h: string;
          }>(
            `SELECT
               COUNT(*) FILTER (WHERE occurred_at >= NOW() - INTERVAL '24 hours' AND polarity_ui = 'ombre')::int AS ombre_24h,
               COUNT(*) FILTER (WHERE occurred_at >= NOW() - INTERVAL '24 hours')::int AS total_24h,
               COUNT(*) FILTER (WHERE occurred_at >= NOW() - INTERVAL '24 hours' AND event_type IN ('armed_conflict','violence'))::int AS armed_24h
             FROM event
             WHERE is_active = true`
          );

          const lbpRows = await client.query<{ day: string; value: string }>(
            `SELECT DATE(period_end) AS day, AVG((payload->>'value')::float8)::text AS value
             FROM indicator_snapshot
             WHERE indicator_key = 'lbp'
               AND period_end >= NOW() - INTERVAL '30 days'
             GROUP BY DATE(period_end)
             ORDER BY day`
          );

          const trends = await client.query<{ day: string; score: string }>(
            `SELECT DATE(occurred_at) AS day,
                    LEAST(100, ROUND(
                      COUNT(*) FILTER (WHERE polarity_ui = 'ombre') * 2 +
                      COUNT(*) FILTER (WHERE event_type IN ('armed_conflict','violence')) * 3
                    ))::text AS score
             FROM event
             WHERE is_active = true
               AND occurred_at >= NOW() - INTERVAL '30 days'
             GROUP BY DATE(occurred_at)
             ORDER BY day`
          );

          const ombre24 = Number(row.rows[0]?.ombre_24h ?? 0);
          const total24 = Number(row.rows[0]?.total_24h ?? 0);
          const armed24 = Number(row.rows[0]?.armed_24h ?? 0);
          const ombreRatio = total24 > 0 ? ombre24 / total24 : 0;

          const lastLbp = Number(lbpRows.rows.at(-1)?.value ?? 0);
          const firstLbp = Number(lbpRows.rows.at(0)?.value ?? lastLbp);
          const lbpVolatility = firstLbp > 0 ? Math.abs((lastLbp - firstLbp) / firstLbp) * 100 : 0;

          const components = {
            lbpVolatility: clamp(lbpVolatility),
            ombreRatio: clamp(ombreRatio * 100),
            armedActivity: clamp(armed24 * 5),
          };

          const score = clamp(components.lbpVolatility * 0.35 + components.ombreRatio * 0.35 + components.armedActivity * 0.3);
          const label = score >= 75 ? 'Critique' : score >= 55 ? 'Élevé' : score >= 35 ? 'Modéré' : 'Bas';

          const history = trends.rows.map((r) => ({
            day: r.day,
            score: Number(r.score),
          }));

          return {
            score,
            label,
            components,
            history,
            generatedAt: new Date().toISOString(),
          };
        }),
      { ttl: 300 }
    );

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 's-maxage=120, stale-while-revalidate=600' },
    });
  } catch (err) {
    return NextResponse.json(
      { score: 0, label: 'N/A', components: {}, history: [], generatedAt: new Date().toISOString(), error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
