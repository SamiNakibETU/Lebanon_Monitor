/**
 * OpenSky API proxy — aircraft positions as GeoJSON for map layer.
 * Properties: nic (navigation integrity), icao24.
 * NIC < 5 = probable GPS jamming (red on map).
 */

import { NextResponse } from 'next/server';
import { fetchOpenSkyPositions } from '@/sources/opensky/fetcher';

function toGeoJSON(positions: Array<{ lon: number; lat: number; nic: number; icao24?: string }>) {
  const features = positions.map((p) => ({
    type: 'Feature' as const,
    geometry: { type: 'Point' as const, coordinates: [p.lon, p.lat] },
    properties: { nic: p.nic, icao24: p.icao24 ?? '' },
  }));
  return { type: 'FeatureCollection' as const, features };
}

export async function GET() {
  try {
    const result = await fetchOpenSkyPositions();
    if (!result.ok) {
      return NextResponse.json(
        { type: 'FeatureCollection', features: [] },
        { headers: { 'Cache-Control': 's-maxage=15, stale-while-revalidate=30' } }
      );
    }
    const geojson = toGeoJSON(result.positions);
    return NextResponse.json(geojson, {
      headers: { 'Cache-Control': 's-maxage=15, stale-while-revalidate=30' },
    });
  } catch (err) {
    console.error('OpenSky positions error', err);
    return NextResponse.json(
      { type: 'FeatureCollection', features: [] },
      { headers: { 'Cache-Control': 's-maxage=60' } }
    );
  }
}
