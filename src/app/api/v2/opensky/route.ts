/**
 * OpenSky API proxy — aircraft count + GPS jamming index.
 */

import { NextResponse } from 'next/server';
import { fetchOpenSky } from '@/sources/opensky/fetcher';

export async function GET() {
  try {
    const { count, jammingIndex } = await fetchOpenSky();
    return NextResponse.json(
      { count, jammingIndex },
      { headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' } }
    );
  } catch (err) {
    console.error('OpenSky API error', err);
    return NextResponse.json({ count: null, jammingIndex: null }, { status: 200 });
  }
}
