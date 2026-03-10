import { NextResponse } from 'next/server';
import { withClient, isDbConfigured } from '@/db/client';
import { cachedFetch } from '@/lib/cache';

interface Signal {
  id: string;
  type: 'convergence' | 'spike' | 'anomaly' | 'escalation';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  indicators: string[];
  timestamp: string;
}

export async function GET() {
  try {
    const signals = await cachedFetch<Signal[]>(
      'lm:signals',
      async () => {
        const alerts: Signal[] = [];
        const now = new Date();

        // 1. Event spike detection: compare today vs 7-day average
        if (isDbConfigured()) {
          try {
            const spike = await withClient(async (client) => {
              const res = await client.query<{ today: string; avg7d: string }>(
                `SELECT
                   (SELECT COUNT(*)::int FROM event WHERE is_active = true AND occurred_at >= CURRENT_DATE) as today,
                   (SELECT ROUND(COUNT(*)::numeric / 7, 1) FROM event WHERE is_active = true AND occurred_at >= NOW() - INTERVAL '7 days') as avg7d`
              );
              return res.rows[0];
            });

            const today = parseInt(spike?.today ?? '0', 10);
            const avg7d = parseFloat(spike?.avg7d ?? '0');

            if (avg7d > 0 && today > avg7d * 1.5) {
              alerts.push({
                id: `spike-${now.toISOString().slice(0, 10)}`,
                type: 'spike',
                severity: today > avg7d * 2 ? 'high' : 'medium',
                title: `Volume d'événements anormal`,
                description: `${today} événements aujourd'hui vs ${avg7d.toFixed(0)}/j en moyenne (7j). Signal de situation instable.`,
                indicators: ['event_volume', 'daily_trend'],
                timestamp: now.toISOString(),
              });
            }

            // 2. Ombre dominance: if >75% of today's events are ombre
            const polarityCheck = await withClient(async (client) => {
              const res = await client.query<{ ombre: string; total: string }>(
                `SELECT
                   COUNT(*) FILTER (WHERE polarity_ui = 'ombre')::int as ombre,
                   COUNT(*)::int as total
                 FROM event
                 WHERE is_active = true AND occurred_at >= CURRENT_DATE`
              );
              return res.rows[0];
            });

            const ombreCount = parseInt(polarityCheck?.ombre ?? '0', 10);
            const totalCount = parseInt(polarityCheck?.total ?? '0', 10);
            const ombreRatio = totalCount > 0 ? ombreCount / totalCount : 0;

            if (totalCount >= 10 && ombreRatio > 0.75) {
              alerts.push({
                id: `ombre-dominance-${now.toISOString().slice(0, 10)}`,
                type: 'escalation',
                severity: ombreRatio > 0.85 ? 'critical' : 'high',
                title: `Dominance ombre ${Math.round(ombreRatio * 100)}%`,
                description: `${ombreCount}/${totalCount} événements classifiés ombre. Contexte sécuritaire tendu.`,
                indicators: ['ombre_ratio', 'classification_balance'],
                timestamp: now.toISOString(),
              });
            }

            // 3. Category concentration
            const categoryConc = await withClient(async (client) => {
              const res = await client.query<{ event_type: string; count: string }>(
                `SELECT event_type, COUNT(*)::int as count
                 FROM event
                 WHERE is_active = true AND occurred_at >= CURRENT_DATE
                   AND event_type IS NOT NULL
                 GROUP BY event_type
                 ORDER BY count DESC LIMIT 1`
              );
              return res.rows[0];
            });

            if (categoryConc && parseInt(categoryConc.count, 10) > totalCount * 0.5 && totalCount >= 10) {
              const catLabel = categoryConc.event_type.replace(/_/g, ' ');
              alerts.push({
                id: `category-spike-${categoryConc.event_type}`,
                type: 'convergence',
                severity: 'medium',
                title: `Concentration: ${catLabel}`,
                description: `${categoryConc.count}/${totalCount} événements dans la catégorie "${catLabel}". Signal de focalisation médiatique.`,
                indicators: ['category_distribution', 'media_focus'],
                timestamp: now.toISOString(),
              });
            }

            // 4. Multi-source convergence zones
            const convergence = await withClient(async (client) => {
              const res = await client.query<{
                zone: string;
                event_count: string;
                source_count: string;
                score: string;
              }>(
                `WITH base AS (
                   SELECT
                     COALESCE(
                       NULLIF(e.metadata->>'resolvedPlaceName', ''),
                       NULLIF(e.metadata->>'admin1', ''),
                       'Lebanon'
                     ) AS zone,
                     e.id,
                     si.source_name
                   FROM event e
                   LEFT JOIN event_observation eo ON eo.event_id = e.id
                   LEFT JOIN source_item si ON si.id = eo.source_item_id
                   WHERE e.is_active = true
                     AND e.occurred_at >= NOW() - INTERVAL '24 hours'
                 )
                 SELECT
                   zone,
                   COUNT(DISTINCT id)::int as event_count,
                   COUNT(DISTINCT source_name)::int as source_count,
                   LEAST(100, ROUND(
                     LEAST(45, LN(GREATEST(COUNT(DISTINCT id), 1) + 1) * 14) +
                     LEAST(35, COUNT(DISTINCT source_name) * 6) +
                     CASE WHEN COUNT(DISTINCT source_name) >= 3 THEN 20 ELSE 0 END
                   ))::int as score
                 FROM base
                 GROUP BY zone
                 HAVING COUNT(DISTINCT id) >= 3
                 ORDER BY score DESC
                 LIMIT 1`
              );
              return res.rows[0];
            });

            if (convergence && parseInt(convergence.score, 10) >= 55) {
              const zone = convergence.zone;
              const sourceCount = parseInt(convergence.source_count, 10);
              const eventCount = parseInt(convergence.event_count, 10);
              alerts.push({
                id: `convergence-${zone}-${now.toISOString().slice(0, 10)}`,
                type: 'convergence',
                severity: sourceCount >= 3 ? 'high' : 'medium',
                title: `Convergence multi-source: ${zone}`,
                description: `${eventCount} événements corroborés par ${sourceCount} sources sur 24h.`,
                indicators: ['multi_source_convergence', 'zone_corroboration'],
                timestamp: now.toISOString(),
              });
            }

            // 5. Market stress signal from LBP + Polymarket delta
            const marketSignal = await withClient(async (client) => {
              const lbp = await client.query<{ latest: string | null; prev: string | null }>(
                `WITH x AS (
                   SELECT (payload->>'value')::float8 AS value, period_end
                   FROM indicator_snapshot
                   WHERE indicator_key = 'lbp'
                     AND period_end >= NOW() - INTERVAL '48 hours'
                   ORDER BY period_end DESC
                   LIMIT 2
                 )
                 SELECT
                   (SELECT value::text FROM x OFFSET 0 LIMIT 1) AS latest,
                   (SELECT value::text FROM x OFFSET 1 LIMIT 1) AS prev`
              );
              const ratio = await client.query<{ today_lumiere: string; yesterday_lumiere: string; today_total: string; yesterday_total: string }>(
                `SELECT
                   COUNT(*) FILTER (WHERE occurred_at >= CURRENT_DATE AND polarity_ui = 'lumiere')::int AS today_lumiere,
                   COUNT(*) FILTER (WHERE occurred_at >= CURRENT_DATE - INTERVAL '1 day' AND occurred_at < CURRENT_DATE AND polarity_ui = 'lumiere')::int AS yesterday_lumiere,
                   COUNT(*) FILTER (WHERE occurred_at >= CURRENT_DATE)::int AS today_total,
                   COUNT(*) FILTER (WHERE occurred_at >= CURRENT_DATE - INTERVAL '1 day' AND occurred_at < CURRENT_DATE)::int AS yesterday_total
                 FROM event
                 WHERE is_active = true`
              );
              return {
                latest: lbp.rows[0]?.latest ? Number(lbp.rows[0].latest) : null,
                prev: lbp.rows[0]?.prev ? Number(lbp.rows[0].prev) : null,
                todayLumiere: Number(ratio.rows[0]?.today_lumiere ?? 0),
                yesterdayLumiere: Number(ratio.rows[0]?.yesterday_lumiere ?? 0),
                todayTotal: Number(ratio.rows[0]?.today_total ?? 0),
                yesterdayTotal: Number(ratio.rows[0]?.yesterday_total ?? 0),
              };
            });

            const lbpDeltaPct =
              marketSignal.latest && marketSignal.prev && marketSignal.prev > 0
                ? ((marketSignal.latest - marketSignal.prev) / marketSignal.prev) * 100
                : null;

            if (lbpDeltaPct != null && Math.abs(lbpDeltaPct) > 2) {
              alerts.push({
                id: `market-lbp-${now.toISOString().slice(0, 10)}`,
                type: 'anomaly',
                severity: Math.abs(lbpDeltaPct) > 4 ? 'high' : 'medium',
                title: `Signal marché: LBP ${lbpDeltaPct >= 0 ? '+' : ''}${lbpDeltaPct.toFixed(1)}%`,
                description: `Mouvement anormal du taux parallèle LBP sur 24h. Corréler avec signaux de conflit.`,
                indicators: ['lbp_delta_24h', 'market_stress'],
                timestamp: now.toISOString(),
              });
            }

            const todayRatio = marketSignal.todayTotal > 0 ? marketSignal.todayLumiere / marketSignal.todayTotal : 0;
            const yesterdayRatio = marketSignal.yesterdayTotal > 0 ? marketSignal.yesterdayLumiere / marketSignal.yesterdayTotal : 0;
            if (yesterdayRatio > 0 && todayRatio > yesterdayRatio * 1.2) {
              alerts.push({
                id: `lumiere-ratio-${now.toISOString().slice(0, 10)}`,
                type: 'anomaly',
                severity: 'low',
                title: `Signal Lumière en hausse`,
                description: `Le ratio Lumière augmente de ${Math.round(((todayRatio / yesterdayRatio) - 1) * 100)}% vs veille.`,
                indicators: ['lumiere_ratio_shift', 'de_escalation_proxy'],
                timestamp: now.toISOString(),
              });
            }
          } catch {
            // DB queries failed, skip DB-based signals
          }
        }

        // 6. If no alerts found, provide a baseline status
        if (alerts.length === 0) {
          alerts.push({
            id: `baseline-${now.toISOString().slice(0, 10)}`,
            type: 'anomaly',
            severity: 'low',
            title: 'Situation stable',
            description: 'Aucun signal de convergence détecté. Flux d\'événements dans la norme.',
            indicators: ['baseline'],
            timestamp: now.toISOString(),
          });
        }

        return alerts;
      },
      { ttl: 120 }
    );

    return NextResponse.json({ signals: signals ?? [] }, {
      headers: { 'Cache-Control': 's-maxage=120, stale-while-revalidate=300' },
    });
  } catch (err) {
    console.error('Signals API error:', err);
    return NextResponse.json({ signals: [] });
  }
}
