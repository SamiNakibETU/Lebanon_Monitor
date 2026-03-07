import { NextResponse } from 'next/server';
import { fetchAll } from '@/sources/registry';
import { healthCheck as dbHealthCheck } from '@/db/client';

const hasDbUrl = !!(process.env.DATABASE_URL || process.env.DATABASE_PRIVATE_URL);

export async function GET() {
  try {
    const [dbResult, { statuses }] = await Promise.all([
      hasDbUrl ? dbHealthCheck() : Promise.resolve(null),
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
        databaseUrlSet: hasDbUrl,
        ...(dbResult !== null && {
          database: dbResult.ok ? 'connected' : 'disconnected',
          ...(dbResult.ok === false && dbResult.error && { dbError: dbResult.error }),
        }),
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
