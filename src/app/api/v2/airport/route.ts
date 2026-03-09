import { NextResponse } from 'next/server';
import { cachedFetch } from '@/lib/cache';

const URL = 'https://www.beirutairport.gov.lb/_flight.php?lang=en';

function countFlights(html: string): { departures: number; arrivals: number } {
  const departureMatches = html.match(/departure/gi) ?? [];
  const arrivalMatches = html.match(/arrival/gi) ?? [];
  return {
    departures: Math.max(0, departureMatches.length - 1),
    arrivals: Math.max(0, arrivalMatches.length - 1),
  };
}

export async function GET() {
  try {
    const payload = await cachedFetch(
      'v2:airport',
      async () => {
        const res = await fetch(URL, {
          headers: { 'User-Agent': 'LebanonMonitor/1.0' },
          signal: AbortSignal.timeout(12000),
        });
        if (!res.ok) {
          return {
            source: 'fallback',
            departures: null,
            arrivals: null,
            total: null,
            status: 'unavailable',
            updatedAt: new Date().toISOString(),
          };
        }
        const html = await res.text();
        const { departures, arrivals } = countFlights(html);
        return {
          source: 'beirutairport.gov.lb',
          departures,
          arrivals,
          total: departures + arrivals,
          status: 'ok',
          updatedAt: new Date().toISOString(),
        };
      },
      { ttl: 15 * 60 }
    );

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=1800' },
    });
  } catch (err) {
    return NextResponse.json(
      {
        source: 'fallback',
        departures: null,
        arrivals: null,
        total: null,
        status: 'unavailable',
        updatedAt: new Date().toISOString(),
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 200 }
    );
  }
}
