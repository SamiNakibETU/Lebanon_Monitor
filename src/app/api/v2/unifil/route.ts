/**
 * UNIFIL press releases — last 5 statements.
 */

import { NextResponse } from 'next/server';
import { fetchUnifilPress } from '@/sources/unifil/fetcher';
import { cachedFetch } from '@/lib/cache';

export async function GET() {
  try {
    const result = await cachedFetch(
      'lm:unifil',
      () => fetchUnifilPress(),
      { ttl: 3600 }
    );
    if (!result?.ok) {
      return NextResponse.json({ items: [] }, {
        headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=1800, stale-if-error=86400' },
      });
    }
    return NextResponse.json({ items: result.items }, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=1800, stale-if-error=86400' },
    });
  } catch (err) {
    console.error('UNIFIL API error', err);
    return NextResponse.json({ items: [] }, {
      headers: { 'Cache-Control': 's-maxage=60, stale-if-error=86400' },
    });
  }
}
