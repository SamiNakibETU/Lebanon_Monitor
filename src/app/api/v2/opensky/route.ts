/**
 * OpenSky API proxy — aircraft count + GPS jamming index.
 * Redis cache with stale fallback on timeout.
 */

import { NextResponse } from 'next/server';
import { fetchOpenSky } from '@/sources/opensky/fetcher';
import { redisGet, redisSet, isRedisConfigured } from '@/lib/redis';

const CACHE_KEY = 'lebanon-monitor:opensky';
const CACHE_TTL = 120;

interface OpenSkyData {
  count: number;
  jammingIndex: number;
}

export async function GET() {
  if (isRedisConfigured()) {
    const cached = await redisGet<OpenSkyData>(CACHE_KEY);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=120' },
      });
    }
  }

  try {
    const { count, jammingIndex } = await fetchOpenSky();
    const result: OpenSkyData = { count, jammingIndex };

    if (isRedisConfigured()) {
      await redisSet(CACHE_KEY, result, { ex: CACHE_TTL });
    }

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' },
    });
  } catch (err) {
    console.error('OpenSky API error', err);

    if (isRedisConfigured()) {
      const stale = await redisGet<OpenSkyData>(CACHE_KEY);
      if (stale) {
        return NextResponse.json(stale, {
          headers: { 'Cache-Control': 's-maxage=10, stale-while-revalidate=30' },
        });
      }
    }

    return NextResponse.json({ count: null, jammingIndex: 0 }, { status: 200 });
  }
}
