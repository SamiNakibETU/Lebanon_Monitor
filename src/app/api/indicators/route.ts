/**
 * GET /api/indicators — Returns weather, LBP rate, and air quality.
 * Separate from events to allow lightweight polling for header indicators.
 */

import { NextResponse } from 'next/server';
import { fetchAll } from '@/sources/registry';

export async function GET() {
  try {
    const { indicators } = await fetchAll();
    return NextResponse.json(indicators, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
