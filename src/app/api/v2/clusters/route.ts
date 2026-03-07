/**
 * API v2 clusters — trending topics by event_type (last 24h vs prior 24h).
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
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const prior24h = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      const curr = await client.query<{ event_type: string; count: string }>(
        `SELECT event_type, COUNT(*)::int as count FROM event
         WHERE is_active = true AND event_type IS NOT NULL
           AND occurred_at >= $1 AND occurred_at < $2
         GROUP BY event_type ORDER BY count DESC LIMIT 12`,
        [last24h, now]
      );
      const prev = await client.query<{ event_type: string; count: string }>(
        `SELECT event_type, COUNT(*)::int as count FROM event
         WHERE is_active = true AND event_type IS NOT NULL
           AND occurred_at >= $1 AND occurred_at < $2
         GROUP BY event_type`,
        [prior24h, last24h]
      );

      const prevByType = new Map(prev.rows.map((r) => [r.event_type, parseInt(r.count, 10)]));
      const clusters = curr.rows.map((r) => {
        const count = parseInt(r.count, 10);
        const prevCount = prevByType.get(r.event_type) ?? 0;
        const trend = prevCount === 0 ? (count > 0 ? 'up' : 'stable') : count > prevCount ? 'up' : count < prevCount ? 'down' : 'stable';
        const change = prevCount === 0 ? count : count - prevCount;
        return {
          code: r.event_type,
          count,
          prevCount,
          change,
          trend: trend as 'up' | 'down' | 'stable',
        };
      });

      return { clusters };
    });

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 's-maxage=120, stale-while-revalidate=300',
      },
    });
  } catch (err) {
    console.error('API v2 clusters error', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 500 },
      { status: 500 }
    );
  }
}
