import { NextResponse } from 'next/server';
import { withClient, isDbConfigured } from '@/db/client';
import { cachedFetch } from '@/lib/cache';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = Math.min(parseInt(searchParams.get('days') ?? '7', 10) || 7, 90);

  if (!isDbConfigured()) {
    return NextResponse.json({ days, series: [] });
  }

  try {
    const cacheKey = `lm:trends:${days}`;
    const data = await cachedFetch(
      cacheKey,
      () => withClient(async (client) => {
        const res = await client.query<{
          day: string;
          classification: string;
          category: string | null;
          count: string;
          avg_severity: string | null;
        }>(
          `SELECT
             DATE(occurred_at) as day,
             polarity_ui as classification,
             event_type as category,
             COUNT(*)::int as count,
             ROUND(AVG(severity_score)::numeric, 2) as avg_severity
           FROM event
           WHERE is_active = true
             AND occurred_at >= NOW() - INTERVAL '1 day' * $1
           GROUP BY DATE(occurred_at), polarity_ui, event_type
           ORDER BY day ASC`,
          [days]
        );

        const dailyTotals = await client.query<{
          day: string;
          ombre: string;
          lumiere: string;
          neutre: string;
          total: string;
        }>(
          `SELECT
             DATE(occurred_at) as day,
             COUNT(*) FILTER (WHERE polarity_ui = 'ombre')::int as ombre,
             COUNT(*) FILTER (WHERE polarity_ui = 'lumiere')::int as lumiere,
             COUNT(*) FILTER (WHERE polarity_ui = 'neutre')::int as neutre,
             COUNT(*)::int as total
           FROM event
           WHERE is_active = true
             AND occurred_at >= NOW() - INTERVAL '1 day' * $1
           GROUP BY DATE(occurred_at)
           ORDER BY day ASC`,
          [days]
        );

        const intensityRes = await client.query<{
          day: string;
          score: string;
        }>(
          `SELECT
             DATE(occurred_at) as day,
             ROUND(
               (COUNT(*) FILTER (WHERE polarity_ui = 'ombre') * 1.0 /
                GREATEST(COUNT(*), 1) * 50) +
               (COALESCE(AVG(severity_score) FILTER (WHERE polarity_ui = 'ombre'), 0) * 50)
             )::int as score
           FROM event
           WHERE is_active = true
             AND occurred_at >= NOW() - INTERVAL '1 day' * $1
           GROUP BY DATE(occurred_at)
           ORDER BY day ASC`,
          [days]
        );

        return {
          days,
          timeline: dailyTotals.rows.map((r) => ({
            day: r.day,
            ombre: parseInt(r.ombre, 10),
            lumiere: parseInt(r.lumiere, 10),
            neutre: parseInt(r.neutre, 10),
            total: parseInt(r.total, 10),
          })),
          intensity: intensityRes.rows.map((r) => ({
            day: r.day,
            score: parseInt(r.score, 10),
          })),
          breakdown: res.rows.map((r) => ({
            day: r.day,
            classification: r.classification,
            category: r.category,
            count: parseInt(r.count, 10),
            avgSeverity: r.avg_severity ? parseFloat(r.avg_severity) : null,
          })),
        };
      }),
      { ttl: 300 }
    );

    return NextResponse.json(data ?? { days, timeline: [], intensity: [], breakdown: [] }, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' },
    });
  } catch (err) {
    console.error('Trends API error:', err);
    return NextResponse.json({ days, timeline: [], intensity: [], breakdown: [] });
  }
}
