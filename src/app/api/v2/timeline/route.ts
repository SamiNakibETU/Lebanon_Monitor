/**
 * API v2 timeline — hourly event counts for last 24h.
 */

import { NextResponse } from 'next/server';
import { withClient, isDbConfigured } from '@/db/client';

export async function GET(request: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured', code: 500 },
      { status: 500 }
    );
  }

  try {
    const result = await withClient(async (client) => {
      const { rows } = await client.query<{
        hour: string;
        cnt: string;
        ombre: string;
        lumiere: string;
      }>(
        `SELECT
          to_char(occurred_at, 'YYYY-MM-DD HH24') as hour,
          COUNT(*)::int as cnt,
          COUNT(*) FILTER (WHERE polarity_ui = 'ombre')::int as ombre,
          COUNT(*) FILTER (WHERE polarity_ui = 'lumiere')::int as lumiere
         FROM event
         WHERE is_active = true AND occurred_at >= now() - interval '24 hours'
         GROUP BY 1
         ORDER BY 1`
      );

      const byKey = new Map<string, { count: number; ombre: number; lumiere: number }>();
      for (const r of rows) {
        byKey.set(r.hour, {
          count: parseInt(r.cnt, 10),
          ombre: parseInt(r.ombre, 10),
          lumiere: parseInt(r.lumiere, 10),
        });
      }

      const result: Array<{ hour: string; count: number; ombre: number; lumiere: number }> = [];
      const now = new Date();
      for (let i = 0; i < 24; i++) {
        const d = new Date(now);
        d.setHours(d.getHours() - (23 - i), 0, 0, 0);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}`;
        const v = byKey.get(key) ?? { count: 0, ombre: 0, lumiere: 0 };
        result.push({
          hour: String(d.getHours()).padStart(2, '0'),
          count: v.count,
          ombre: v.ombre,
          lumiere: v.lumiere,
        });
      }
      return result;
    });

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (err) {
    console.error('API v2 timeline error', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 500 },
      { status: 500 }
    );
  }
}
