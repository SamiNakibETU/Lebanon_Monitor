import { NextResponse } from 'next/server';
import { withClient, isDbConfigured } from '@/db/client';
import { cachedFetch } from '@/lib/cache';
import { callGroq, getSanitizedGroqKey } from '@/lib/groq-client';

interface ConvergenceZone {
  zone: string;
  eventCount: number;
  sourceCount: number;
  sourceDiversity: string[];
  severeCount: number;
  score: number;
  latitude: number | null;
  longitude: number | null;
  topCategories: Array<{ category: string; count: number }>;
  brief?: string;
}

async function buildZoneBrief(zone: ConvergenceZone): Promise<string | null> {
  if (!getSanitizedGroqKey()) return null;
  const prompt = [
    'Tu es analyste OSINT.',
    "Explique en 2 phrases max pourquoi cette convergence de signaux est importante et quel risque immédiat surveiller.",
    `Zone: ${zone.zone}`,
    `Score: ${zone.score}/100`,
    `Events: ${zone.eventCount}`,
    `Sources distinctes: ${zone.sourceCount}`,
    `Categories dominantes: ${zone.topCategories.map((c) => `${c.category} (${c.count})`).join(', ') || 'n/a'}`,
    'Réponse en français, factuelle, sans disclaimer.',
  ].join('\n');

  return callGroq({
    messages: [
      { role: 'system', content: 'You write concise convergence risk briefs for analysts.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
    max_tokens: 180,
    timeoutMs: 10_000,
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = Math.min(parseInt(searchParams.get('days') ?? '7', 10) || 7, 30);
  const minScore = Math.min(parseInt(searchParams.get('minScore') ?? '40', 10) || 40, 95);
  const includeBriefs = searchParams.get('includeBriefs') !== 'false';

  if (!isDbConfigured()) {
    return NextResponse.json({ days, generatedAt: new Date().toISOString(), zones: [], explain: {} });
  }

  try {
    const cacheKey = `lm:convergence:${days}:${minScore}`;
    const payload = await cachedFetch(
      cacheKey,
      () =>
        withClient(async (client) => {
          const zoneRes = await client.query<{
            zone: string;
            event_count: string;
            source_count: string;
            severe_count: string;
            source_diversity: string[];
            score: string;
            latitude: number | null;
            longitude: number | null;
          }>(
            `WITH base AS (
               SELECT
                 e.id,
                 COALESCE(
                   NULLIF(e.metadata->>'resolvedPlaceName', ''),
                   NULLIF(e.metadata->>'admin1', ''),
                   'Lebanon'
                 ) AS zone,
                 e.event_type,
                 e.severity_score,
                 si.source_name,
                 NULLIF(e.metadata->>'latitude', '')::float8 AS latitude,
                 NULLIF(e.metadata->>'longitude', '')::float8 AS longitude
               FROM event e
               LEFT JOIN event_observation eo ON eo.event_id = e.id
               LEFT JOIN source_item si ON si.id = eo.source_item_id
               WHERE e.is_active = true
                 AND e.occurred_at >= NOW() - INTERVAL '1 day' * $1
             )
             SELECT
               zone,
               COUNT(DISTINCT id)::int AS event_count,
               COUNT(DISTINCT source_name)::int AS source_count,
               COUNT(*) FILTER (WHERE severity_score >= 0.6)::int AS severe_count,
               ARRAY_REMOVE(ARRAY_AGG(DISTINCT source_name), NULL) AS source_diversity,
               AVG(latitude) FILTER (WHERE latitude IS NOT NULL) AS latitude,
               AVG(longitude) FILTER (WHERE longitude IS NOT NULL) AS longitude,
               LEAST(100, ROUND(
                 LEAST(35, LN(GREATEST(COUNT(DISTINCT id), 1) + 1) * 11) +
                 LEAST(30, COUNT(DISTINCT source_name) * 5) +
                 LEAST(20, (COUNT(*) FILTER (WHERE severity_score >= 0.6)) * 2) +
                 CASE
                   WHEN COUNT(DISTINCT source_name) >= 3 AND COUNT(DISTINCT id) >= 5 THEN 15
                   WHEN COUNT(DISTINCT source_name) >= 2 AND COUNT(DISTINCT id) >= 3 THEN 8
                   ELSE 0
                 END
               ))::int AS score
             FROM base
             GROUP BY zone
             HAVING COUNT(DISTINCT id) >= 2
             ORDER BY score DESC, event_count DESC
             LIMIT 25`,
            [days]
          );

          const catRes = await client.query<{
            zone: string;
            category: string;
            count: string;
          }>(
            `WITH base AS (
               SELECT
                 COALESCE(
                   NULLIF(e.metadata->>'resolvedPlaceName', ''),
                   NULLIF(e.metadata->>'admin1', ''),
                   'Lebanon'
                 ) AS zone,
                 COALESCE(e.event_type, 'unknown') AS category
               FROM event e
               WHERE e.is_active = true
                 AND e.occurred_at >= NOW() - INTERVAL '1 day' * $1
             )
             SELECT zone, category, COUNT(*)::int as count
             FROM base
             GROUP BY zone, category
             ORDER BY zone, count DESC`,
            [days]
          );

          const categoriesByZone = new Map<string, Array<{ category: string; count: number }>>();
          for (const row of catRes.rows) {
            const list = categoriesByZone.get(row.zone) ?? [];
            if (list.length < 3) {
              list.push({ category: row.category, count: parseInt(row.count, 10) });
            }
            categoriesByZone.set(row.zone, list);
          }

          const zones: ConvergenceZone[] = zoneRes.rows
            .map((z) => ({
              zone: z.zone,
              eventCount: parseInt(z.event_count, 10),
              sourceCount: parseInt(z.source_count, 10),
              severeCount: parseInt(z.severe_count, 10),
              sourceDiversity: Array.isArray(z.source_diversity) ? z.source_diversity : [],
              score: parseInt(z.score, 10),
              latitude: z.latitude == null ? null : Number(z.latitude),
              longitude: z.longitude == null ? null : Number(z.longitude),
              topCategories: categoriesByZone.get(z.zone) ?? [],
            }))
            .filter((z) => z.score >= minScore);

          if (includeBriefs && zones.length > 0) {
            const top = zones.slice(0, 5);
            const briefs = await Promise.all(top.map((z) => buildZoneBrief(z)));
            for (let i = 0; i < top.length; i++) {
              const b = briefs[i];
              if (b) top[i]!.brief = b;
            }
          }

          return {
            days,
            generatedAt: new Date().toISOString(),
            explain: {
              scoreFormula:
                'score = volume + sourceDiversity + severeEvents + convergenceBonus',
              components: {
                volume: 'ln(eventCount+1)*11 capped 35',
                sourceDiversity: 'distinct sources *5 capped 30',
                severeEvents: 'severity>=0.6 count *2 capped 20',
                convergenceBonus: '+15 (>=3 sources and >=5 events) / +8 (>=2 sources and >=3 events)',
              },
            },
            zones,
          };
        }),
      { ttl: 180 }
    );

    return NextResponse.json(payload ?? { days, generatedAt: new Date().toISOString(), zones: [], explain: {} }, {
      headers: { 'Cache-Control': 's-maxage=180, stale-while-revalidate=360' },
    });
  } catch (err) {
    console.error('Convergence API error:', err);
    return NextResponse.json({ days, generatedAt: new Date().toISOString(), zones: [], explain: {} });
  }
}

