/**
 * API v2 stats — total events, ombre ratio, top categories, top sources.
 */

import { NextResponse } from 'next/server';
import { withClient } from '@/db/client';

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: 'Database not configured', code: 500 },
      { status: 500 }
    );
  }

  try {
    const result = await withClient(async (client) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const totalRes = await client.query<{ count: string }>(
        `SELECT COUNT(*)::int as count FROM event WHERE is_active = true`
      );
      const polarityRes = await client.query<{ polarity_ui: string; count: string }>(
        `SELECT polarity_ui, COUNT(*)::int as count FROM event 
         WHERE is_active = true AND occurred_at >= $1 
         GROUP BY polarity_ui`,
        [today]
      );
      const categoryRes = await client.query<{ event_type: string; count: string }>(
        `SELECT event_type, COUNT(*)::int as count FROM event 
         WHERE is_active = true AND occurred_at >= $1 
         GROUP BY event_type HAVING event_type IS NOT NULL ORDER BY count DESC LIMIT 8`,
        [today]
      );
      const sourceRes = await client.query<{ source_name: string; count: string }>(
        `SELECT si.source_name, COUNT(*)::int as count 
         FROM event e 
         JOIN event_observation eo ON eo.event_id = e.id 
         JOIN source_item si ON si.id = eo.source_item_id 
         WHERE e.is_active = true AND occurred_at >= $1 
         GROUP BY si.source_name ORDER BY count DESC LIMIT 8`,
        [today]
      );

      const total = parseInt(totalRes.rows[0]?.count ?? '0', 10);
      const byPolarity = Object.fromEntries(
        polarityRes.rows.map((r) => [r.polarity_ui, parseInt(r.count, 10)])
      );
      const ombre = byPolarity.ombre ?? 0;
      const lumiere = byPolarity.lumiere ?? 0;
      const neutre = byPolarity.neutre ?? 0;
      const totalToday = ombre + lumiere + neutre;
      const ombreRatio = totalToday > 0 ? Math.round((ombre / totalToday) * 100) : 0;

      return {
        totalEvents: total,
        eventsToday: totalToday,
        ombreRatio,
        byClassification: { ombre, lumiere, neutre },
        topCategories: categoryRes.rows.map((r) => ({
          code: r.event_type,
          count: parseInt(r.count, 10),
        })),
        topSources: sourceRes.rows.map((r) => ({
          name: r.source_name,
          count: parseInt(r.count, 10),
        })),
      };
    });

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (err) {
    console.error('API v2 stats error', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 500 },
      { status: 500 }
    );
  }
}
