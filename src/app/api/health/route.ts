import { NextResponse } from 'next/server';
import { fetchAll } from '@/sources/registry';
import { healthCheck as dbHealthCheck } from '@/db/client';

export async function GET() {
  try {
    const [dbOk, { statuses }] = await Promise.all([
      process.env.DATABASE_URL ? dbHealthCheck() : Promise.resolve(null),
      fetchAll(),
    ]);

    const health = statuses.map((s) => ({
      source: s.source,
      status: s.status,
      eventCount: s.eventCount,
      ...(s.error && { error: s.error }),
    }));

    return NextResponse.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        databaseUrlSet: !!process.env.DATABASE_URL,
        ...(dbOk !== null && { database: dbOk ? 'connected' : 'disconnected' }),
        sources: health,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch {
    return NextResponse.json(
      { status: 'error', message: 'Health check failed' },
      { status: 500 }
    );
  }
}
