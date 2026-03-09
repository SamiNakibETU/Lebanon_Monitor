import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch(
      'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=33.89&longitude=35.50&current=pm2_5,pm10,us_aqi&hourly=pm2_5&timezone=Asia%2FBeirut&forecast_hours=24',
      { next: { revalidate: 1800 } }
    );
    if (!res.ok) throw new Error(`Open-Meteo AQI: ${res.status}`);
    const data = await res.json();
    return NextResponse.json(
      {
        pm25: data.current?.pm2_5 ?? null,
        pm10: data.current?.pm10 ?? null,
        usAqi: data.current?.us_aqi ?? null,
        hourly: data.hourly?.pm2_5 ?? [],
      },
      {
        headers: { 'Cache-Control': 's-maxage=1800, stale-while-revalidate=3600' },
      }
    );
  } catch (err) {
    console.error('AQI fetch error:', err);
    return NextResponse.json({ pm25: null, pm10: null, usAqi: null, hourly: [] });
  }
}
