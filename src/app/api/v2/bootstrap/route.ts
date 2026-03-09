/**
 * Bootstrap endpoint — returns all initial data in a single request.
 * Frontend fetches once on load, passes as fallbackData to SWR hooks.
 */

import { NextResponse } from 'next/server';
import { redisGet, isRedisConfigured } from '@/lib/redis';

const KEYS = [
  'lm:stats',
  'lm:indicators',
  'lm:polymarket',
  'lm:unifil',
  'lebanon-monitor:opensky',
] as const;

export async function GET() {
  const result: Record<string, unknown> = {};

  if (isRedisConfigured()) {
    const values = await Promise.all(KEYS.map((k) => redisGet(k)));
    for (let i = 0; i < KEYS.length; i++) {
      const shortKey = KEYS[i].replace('lm:', '').replace('lebanon-monitor:', '');
      result[shortKey] = values[i] ?? null;
    }
  }

  const [statsRes, indicatorsRes, polymarketRes, unifilRes, openskyRes, aqiRes] = await Promise.allSettled([
    result.stats ? Promise.resolve(null) : fetch(`${baseUrl()}/api/v2/stats`).then(r => r.json()).catch(() => null),
    result.indicators ? Promise.resolve(null) : fetch(`${baseUrl()}/api/v2/indicators`).then(r => r.json()).catch(() => null),
    result.polymarket ? Promise.resolve(null) : fetch(`${baseUrl()}/api/v2/polymarket`).then(r => r.json()).catch(() => null),
    result.unifil ? Promise.resolve(null) : fetch(`${baseUrl()}/api/v2/unifil`).then(r => r.json()).catch(() => null),
    result.opensky ? Promise.resolve(null) : fetch(`${baseUrl()}/api/v2/opensky`).then(r => r.json()).catch(() => null),
    fetch(`${baseUrl()}/api/v2/aqi`).then(r => r.json()).catch(() => null),
  ]);

  return NextResponse.json(
    {
      stats: result.stats ?? settled(statsRes),
      indicators: result.indicators ?? settled(indicatorsRes),
      polymarket: result.polymarket ?? settled(polymarketRes),
      unifil: result.unifil ?? settled(unifilRes),
      opensky: result.opensky ?? settled(openskyRes),
      aqi: settled(aqiRes),
    },
    {
      headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60, stale-if-error=300' },
    }
  );
}

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

function settled(result: PromiseSettledResult<unknown>): unknown {
  return result.status === 'fulfilled' ? result.value : null;
}
