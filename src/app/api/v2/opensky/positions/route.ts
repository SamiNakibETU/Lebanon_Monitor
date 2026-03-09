/**
 * OpenSky API proxy — aircraft positions as GeoJSON for map layer.
 * Properties: nic (navigation integrity), icao24.
 * NIC < 5 = probable GPS jamming (red on map).
 */

import { NextResponse } from 'next/server';
import { fetchOpenSkyPositions } from '@/sources/opensky/fetcher';

const MILITARY_CALLSIGN_PREFIXES = ['IAF', 'RCH', 'RRR', 'NATO', 'QID', 'ASY', 'HERKY', 'CNV'];

function looksMilitary(callsign?: string, originCountry?: string): boolean {
  const cs = (callsign ?? '').trim().toUpperCase();
  if (MILITARY_CALLSIGN_PREFIXES.some((p) => cs.startsWith(p))) return true;
  const c = (originCountry ?? '').toLowerCase();
  return ['air force', 'military'].some((k) => c.includes(k));
}

function toGeoJSON(
  positions: Array<{
    lon: number;
    lat: number;
    nic: number;
    icao24?: string;
    callsign?: string;
    originCountry?: string;
    altitude?: number;
    velocity?: number;
    heading?: number;
  }>
) {
  const features = positions.map((p) => ({
    type: 'Feature' as const,
    geometry: { type: 'Point' as const, coordinates: [p.lon, p.lat] },
    properties: {
      nic: p.nic,
      icao24: p.icao24 ?? '',
      callsign: p.callsign ?? '',
      originCountry: p.originCountry ?? '',
      altitude: p.altitude ?? null,
      velocity: p.velocity ?? null,
      heading: p.heading ?? null,
      isMilitary: looksMilitary(p.callsign, p.originCountry),
    },
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
