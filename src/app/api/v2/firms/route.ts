import { NextResponse } from 'next/server';
import { cachedFetch } from '@/lib/cache';
import { fetchFirmsParsed } from '@/sources/firms';

interface FireFeatureProperties {
  id: string;
  source: 'firms';
  acquiredAt: string | null;
  instrument: string;
  confidence: string | null;
  confidenceScore: number;
  brightness: number;
  frp: number;
  daynight: string | null;
  ageHours: number;
}

type FireFeature = GeoJSON.Feature<GeoJSON.Point, FireFeatureProperties>;

function parseAcquiredAt(acqDate?: string, acqTime?: string): string | null {
  if (!acqDate) return null;
  const h = (acqTime ?? '').slice(0, 2).padStart(2, '0');
  const m = (acqTime ?? '').slice(2, 4).padStart(2, '0');
  const iso = `${acqDate}T${h}:${m}:00Z`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function confidenceToScore(confidence?: string): number {
  const c = (confidence ?? '').trim().toLowerCase();
  if (!c) return 0.4;
  if (c === 'h' || c === 'high') return 0.9;
  if (c === 'n' || c === 'nominal') return 0.65;
  if (c === 'l' || c === 'low') return 0.35;
  const n = Number(c);
  if (!Number.isFinite(n)) return 0.4;
  return Math.max(0, Math.min(1, n / 100));
}

export async function GET() {
  try {
    const data = await cachedFetch(
      'v2:firms:hotspots',
      async () => {
        const result = await fetchFirmsParsed();
        if (!result.ok) return [] as FireFeature[];

        return result.data.map((row, i) => {
          const brightness = Number(row.bright_ti4 ?? 0);
          const frp = Number(row.frp ?? 0);
          const confidenceScore = confidenceToScore(row.confidence);
          const acquiredAt = parseAcquiredAt(row.acq_date, row.acq_time);
          const ageHours = acquiredAt
            ? (Date.now() - new Date(acquiredAt).getTime()) / (1000 * 60 * 60)
            : 999;
          return {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [row.longitude, row.latitude],
            },
            properties: {
              id: `firms-${row.latitude}-${row.longitude}-${row.acq_date ?? 'unknown'}-${i}`,
              source: 'firms',
              acquiredAt,
              instrument: 'VIIRS_NOAA20_NRT',
              confidence: row.confidence ?? null,
              confidenceScore,
              brightness,
              frp,
              daynight: row.daynight ?? null,
              ageHours,
            },
          } as FireFeature;
        });
      },
      { ttl: 20 * 60 }
    );

    return NextResponse.json(
      {
        source: 'firms',
        updatedAt: new Date().toISOString(),
        count: data?.length ?? 0,
        data: {
          type: 'FeatureCollection',
          features: data ?? [],
        } satisfies GeoJSON.FeatureCollection<GeoJSON.Point, FireFeatureProperties>,
      },
      { headers: { 'Cache-Control': 's-maxage=120, stale-while-revalidate=1200' } }
    );
  } catch (err) {
    return NextResponse.json(
      {
        source: 'firms',
        updatedAt: new Date().toISOString(),
        count: 0,
        data: { type: 'FeatureCollection', features: [] },
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 200 }
    );
  }
}
