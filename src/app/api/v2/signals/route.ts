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
          } catch {
            // DB queries failed, skip DB-based signals
          }
        }

        // 5. If no alerts found, provide a baseline status
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
