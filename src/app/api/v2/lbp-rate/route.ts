import { NextResponse } from 'next/server';
import { cachedFetch } from '@/lib/cache';
import { fetchLbpRate } from '@/sources/lbp-rate/fetcher';

const FALLBACK_RATE = 89_500;

export async function GET() {
  try {
    const data = await cachedFetch(
      'lm:lbp-rate',
      async () => {
        const result = await fetchLbpRate();
        if (result.ok) {
          return { rate: result.data.rate, source: 'lirarate.org', updated: new Date().toISOString() };
        }
        return { rate: FALLBACK_RATE, source: 'fallback', updated: new Date().toISOString() };
      },
      { ttl: 3600 }
    );
    return NextResponse.json(data ?? { rate: FALLBACK_RATE, source: 'fallback', updated: new Date().toISOString() }, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200' },
    });
  } catch {
    return NextResponse.json({ rate: FALLBACK_RATE, source: 'fallback', updated: new Date().toISOString() });
  }
}
