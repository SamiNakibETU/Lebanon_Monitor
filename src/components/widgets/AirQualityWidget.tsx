'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function pm25Color(pm25: number): string {
  if (pm25 <= 12) return '#43A047';
  if (pm25 <= 35) return '#FBBF24';
  if (pm25 <= 55) return '#E65100';
  return '#E53935';
}

export function AirQualityWidget() {
  const { data } = useSWR<{
    pm25: number | null;
    pm10: number | null;
    usAqi: number | null;
    hourly: number[];
  }>('/api/v2/aqi', fetcher, {
    refreshInterval: 300_000,
  });

  const pm25 = data?.pm25 ?? null;
  const usAqi = data?.usAqi ?? null;

  return (
    <div className="flex flex-col p-4" style={{ background: '#0A0A0A' }}>
      <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#666666' }}>
        Qualité de l'air
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-[48px] font-light tabular-nums" style={{ color: '#FFFFFF' }}>
          {pm25 != null ? pm25 : '—'}
        </span>
        {pm25 != null && (
          <span
            className="inline-block w-3 h-3 shrink-0"
            style={{ background: pm25Color(pm25) }}
          />
        )}
      </div>
      <div className="text-[11px] mt-1" style={{ color: '#666666' }}>
        PM2.5 µg/m³
        {usAqi != null && (
          <span className="ml-2">US AQI {usAqi}</span>
        )}
      </div>
    </div>
  );
}
