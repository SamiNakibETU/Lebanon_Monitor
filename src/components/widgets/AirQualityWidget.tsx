'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function aqiColor(aqi: number): string {
  if (aqi <= 50) return '#43A047';
  if (aqi <= 100) return '#FBBF24';
  return '#E53935';
}

export function AirQualityWidget() {
  const { data } = useSWR<{ aqi: number | null }>('/api/v2/indicators', fetcher, {
    refreshInterval: 60_000,
  });

  const aqi = data?.aqi ?? null;

  return (
    <div className="flex flex-col p-4" style={{ background: '#0A0A0A' }}>
      <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#666666' }}>
        Qualité de l'air
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-[48px] font-light tabular-nums" style={{ color: '#FFFFFF' }}>
          {aqi != null ? aqi : '—'}
        </span>
        {aqi != null && (
          <span
            className="inline-block w-3 h-3 shrink-0"
            style={{ background: aqiColor(aqi) }}
          />
        )}
      </div>
      <div className="text-[11px] mt-1" style={{ color: '#666666' }}>
        PM2.5 µg/m³
      </div>
    </div>
  );
}
