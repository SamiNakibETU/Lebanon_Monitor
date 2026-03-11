import { NextResponse } from 'next/server';
import { cachedFetch } from '@/lib/cache';

const ACAPS_BASE = 'https://api.acaps.org/api/v1';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint') ?? 'inform-severity-index';
  const country = (searchParams.get('country') ?? 'LBN').toUpperCase();

  try {
    const payload = await cachedFetch(
      `v2:acaps:${endpoint}:${country}`,
      async () => {
        const url = `${ACAPS_BASE}/${endpoint}/?iso3=${encodeURIComponent(country)}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(12000), cache: 'no-store' });
        if (!res.ok) {
          return { endpoint, country, count: 0, results: [], error: `acaps_${res.status}` };
        }
        const json = await res.json() as Record<string, unknown>;
        const results = Array.isArray(json.results) ? json.results : Array.isArray(json.data) ? json.data : [];
        return {
          endpoint,
          country,
          count: results.length,
          results: results.slice(0, 200),
          generatedAt: new Date().toISOString(),
        };
      },
      { ttl: 6 * 60 * 60 }
    );
    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 's-maxage=21600, stale-while-revalidate=43200' },
    });
  } catch (err) {
    return NextResponse.json({
      endpoint,
      country,
      count: 0,
      results: [],
      generatedAt: new Date().toISOString(),
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

