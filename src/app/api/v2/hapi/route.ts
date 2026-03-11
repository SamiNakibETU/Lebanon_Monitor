import { NextResponse } from 'next/server';
import { cachedFetch } from '@/lib/cache';

const HAPI_BASE = 'https://hapi.humdata.org/api/v1';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locationCode = (searchParams.get('location_code') ?? 'LBN').toUpperCase();
  const appIdentifier = process.env.HDX_HAPI_APP_IDENTIFIER ?? '';
  const endpoint = searchParams.get('endpoint') ?? 'coordination-context/operational-presence';
  const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? 100), 10), 1000);

  try {
    const payload = await cachedFetch(
      `v2:hapi:${locationCode}:${endpoint}:${limit}`,
      async () => {
        const qs = new URLSearchParams({
          output_format: 'json',
          location_code: locationCode,
          limit: String(limit),
        });
        if (appIdentifier) qs.set('app_identifier', appIdentifier);
        const url = `${HAPI_BASE}/${endpoint}?${qs.toString()}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(12000), cache: 'no-store' });
        if (!res.ok) {
          return { endpoint, locationCode, count: 0, items: [], error: `hapi_${res.status}` };
        }
        const json = await res.json() as Record<string, unknown>;
        const data = Array.isArray(json.data) ? json.data : [];
        return {
          endpoint,
          locationCode,
          count: data.length,
          items: data.slice(0, 200),
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
      locationCode,
      count: 0,
      items: [],
      generatedAt: new Date().toISOString(),
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

