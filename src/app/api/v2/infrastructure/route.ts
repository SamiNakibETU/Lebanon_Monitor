/**
 * API v2 infrastructure — hôpitaux, bases, ports, centrales (OSM Overpass).
 * Pour layers carte. Cache 24h.
 */

import { NextResponse } from 'next/server';
import { fetchOsmInfrastructure } from '@/sources/osm-overpass/fetcher';

export async function GET() {
  try {
    const result = await fetchOsmInfrastructure();
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 502 }
      );
    }
    return NextResponse.json(result.data, {
      headers: { 'Cache-Control': 's-maxage=86400, stale-while-revalidate=43200' },
    });
  } catch (err) {
    console.error('Infrastructure API error', err);
    return NextResponse.json({ error: 'Infrastructure fetch failed' }, { status: 500 });
  }
}
