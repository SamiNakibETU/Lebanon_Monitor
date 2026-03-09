/**
 * API v2 infrastructure — serves static GeoJSON (130+ features).
 * Supports ?type=hospital,military filtering. Cache 24h.
 * Falls back to OSM Overpass if static file is unavailable.
 */

import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const types = searchParams.get('type')?.split(',').filter(Boolean);

    const filePath = path.join(process.cwd(), 'public', 'data', 'lebanon-infrastructure.geojson');
    const raw = await fs.readFile(filePath, 'utf-8');
    const geojson = JSON.parse(raw);

    if (types && types.length > 0) {
      geojson.features = geojson.features.filter(
        (f: any) => types.includes(f.properties?.type)
      );
    }

    return NextResponse.json(geojson, {
      headers: { 'Cache-Control': 's-maxage=86400, stale-while-revalidate=43200' },
    });
  } catch (staticErr) {
    console.warn('Static infrastructure file unavailable, trying OSM Overpass', staticErr);

    try {
      const { fetchOsmInfrastructure } = await import('@/sources/osm-overpass/fetcher');
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
    } catch (fallbackErr) {
      console.error('Infrastructure API error (both sources failed)', fallbackErr);
      return NextResponse.json(
        { type: 'FeatureCollection', features: [] },
        { status: 500 }
      );
    }
  }
}
