/**
 * API v2 indicators — latest LBP, weather, AQI + history.
 */

import { NextResponse } from 'next/server';
import { withClient, isDbConfigured } from '@/db/client';
import { getLatestSnapshots } from '@/db/repositories/indicator-snapshot-repository';

export async function GET(request: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured', code: 500 },
      { status: 500 }
    );
  }

  try {
    const [lbpSnapshots, weatherSnapshots, aqiSnapshots] = await Promise.all([
      withClient((c) => getLatestSnapshots(c, 'lbp', 30)),
      withClient((c) => getLatestSnapshots(c, 'weather_beirut', 24)),
      withClient((c) => getLatestSnapshots(c, 'aqi', 24)),
    ]);

    const latestLbp = lbpSnapshots[0]?.payload as { value?: number } | undefined;
    const latestWeather = weatherSnapshots[0]?.payload as { value?: string } | undefined;
    const latestAqi = aqiSnapshots[0]?.payload as { value?: number } | undefined;

    const lbpHistory = lbpSnapshots.map((s) => ({
      at: s.computed_at,
      value: (s.payload as { value?: number }).value,
    }));
    const weatherHistory = weatherSnapshots.map((s) => ({
      at: s.computed_at,
      value: (s.payload as { value?: string }).value,
    }));
    const aqiHistory = aqiSnapshots.map((s) => ({
      at: s.computed_at,
      value: (s.payload as { value?: number }).value,
    }));

    return NextResponse.json(
      {
        lbp: latestLbp?.value ?? null,
        weatherBeirut: latestWeather?.value ?? null,
        aqi: latestAqi?.value ?? null,
        history: {
          lbp: lbpHistory,
          weather: weatherHistory,
          aqi: aqiHistory,
        },
      },
      {
        headers: {
          'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (err) {
    console.error('API v2 indicators error', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 500 },
      { status: 500 }
    );
  }
}
