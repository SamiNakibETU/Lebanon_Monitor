import { NextResponse } from 'next/server';
import { withClient, isDbConfigured } from '@/db/client';
import { cachedFetch } from '@/lib/cache';
import { callGroq, getSanitizedGroqKey } from '@/lib/groq-client';

type ComponentKey = 'military' | 'economic' | 'political' | 'humanitarian';

interface InstabilityComponent {
  score: number;
  weight: number;
  brief: string;
}

function clampScore(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

async function briefForComponent(component: ComponentKey, score: number, basis: string): Promise<string> {
  if (!getSanitizedGroqKey()) return basis;
  const text = await callGroq({
    messages: [
      { role: 'system', content: 'You generate one-line OSINT score explanations in French.' },
      {
        role: 'user',
        content: `Explique en une phrase courte la composante "${component}" (score ${score}/100). Données: ${basis}`,
      },
    ],
    temperature: 0.2,
    max_tokens: 120,
    timeoutMs: 8_000,
  });
  return text ?? basis;
}

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ score: 0, components: {}, generatedAt: new Date().toISOString() });
  }

  try {
    const payload = await cachedFetch(
      'v2:instability',
      async () =>
        withClient(async (client) => {
          const metrics = await client.query<{
            armed_24h: string;
            ombre_24h: string;
            political_24h: string;
            displacement_24h: string;
            infra_24h: string;
          }>(
            `SELECT
               COUNT(*) FILTER (WHERE occurred_at >= NOW() - INTERVAL '24 hours' AND event_type IN ('armed_conflict','violence'))::int AS armed_24h,
               COUNT(*) FILTER (WHERE occurred_at >= NOW() - INTERVAL '24 hours' AND polarity_ui = 'ombre')::int AS ombre_24h,
               COUNT(*) FILTER (WHERE occurred_at >= NOW() - INTERVAL '24 hours' AND event_type = 'political_tension')::int AS political_24h,
               COUNT(*) FILTER (WHERE occurred_at >= NOW() - INTERVAL '24 hours' AND event_type = 'displacement')::int AS displacement_24h,
               COUNT(*) FILTER (WHERE occurred_at >= NOW() - INTERVAL '24 hours' AND event_type = 'infrastructure_failure')::int AS infra_24h
             FROM event
             WHERE is_active = true`
          );

          const lbp = await client.query<{ latest: number | null; avg24: number | null }>(
            `WITH last24 AS (
               SELECT (payload->>'value')::float8 AS value
               FROM indicator_snapshot
               WHERE indicator_key = 'lbp'
                 AND period_end >= NOW() - INTERVAL '24 hours'
             )
             SELECT
               (SELECT value FROM last24 ORDER BY value DESC NULLS LAST LIMIT 1) AS latest,
               AVG(value) AS avg24
             FROM last24`
          );

          const row = metrics.rows[0]!;
          const armed = Number(row.armed_24h ?? 0);
          const ombre = Number(row.ombre_24h ?? 0);
          const political = Number(row.political_24h ?? 0);
          const displacement = Number(row.displacement_24h ?? 0);
          const infra = Number(row.infra_24h ?? 0);
          const latestLbp = Number(lbp.rows[0]?.latest ?? 0);
          const avgLbp = Number(lbp.rows[0]?.avg24 ?? 0);

          const militaryScore = clampScore(armed * 4 + ombre * 0.4);
          const economicScore = clampScore(avgLbp > 0 ? ((latestLbp - avgLbp) / avgLbp) * 100 + 40 : 40);
          const politicalScore = clampScore(political * 6 + 20);
          const humanitarianScore = clampScore(displacement * 7 + infra * 5 + 15);

          const components: Record<ComponentKey, InstabilityComponent> = {
            military: {
              score: militaryScore,
              weight: 30,
              brief: await briefForComponent('military', militaryScore, `${armed} événements armés, ${ombre} ombre`),
            },
            economic: {
              score: economicScore,
              weight: 25,
              brief: await briefForComponent('economic', economicScore, `LBP latest=${latestLbp}, avg24=${avgLbp}`),
            },
            political: {
              score: politicalScore,
              weight: 20,
              brief: await briefForComponent('political', politicalScore, `${political} événements politiques`),
            },
            humanitarian: {
              score: humanitarianScore,
              weight: 25,
              brief: await briefForComponent(
                'humanitarian',
                humanitarianScore,
                `${displacement} déplacements, ${infra} incidents infra`
              ),
            },
          };

          const score = clampScore(
            (components.military.score * components.military.weight +
              components.economic.score * components.economic.weight +
              components.political.score * components.political.weight +
              components.humanitarian.score * components.humanitarian.weight) /
              100
          );

          return {
            score,
            components,
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
      { score: 0, components: {}, generatedAt: new Date().toISOString(), error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
