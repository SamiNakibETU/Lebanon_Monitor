/**
 * GET /api/analytics — Event aggregates + live indicators.
 * Phase F — analytics endpoint.
 */

import { NextResponse } from 'next/server';
import { fetchAll } from '@/sources/registry';
import { computeEventAggregates } from '@/analytics/aggregates';

export async function GET() {
  try {
    const { events, indicators } = await fetchAll();
    const aggregates = computeEventAggregates(events);

    return NextResponse.json(
      { aggregates, indicators },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
