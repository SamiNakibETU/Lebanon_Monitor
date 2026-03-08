'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface IndicatorsData {
  lbp: number | null;
  aqi: number | null;
}

interface StatsData {
  totalEvents: number;
  eventsToday: number;
  byClassification?: { lumiere?: number; ombre?: number; neutre?: number };
  cultureEventsToday?: number;
}

interface ReforestationData {
  hectares: number | null;
  projectCount: number;
}

interface IndicatorStripProps {
  variant: 'lumiere' | 'ombre';
}

export function IndicatorStrip({ variant }: IndicatorStripProps) {
  const { data: indicators } = useSWR<IndicatorsData>('/api/v2/indicators', fetcher, {
    refreshInterval: 60_000,
  });
  const { data: stats } = useSWR<StatsData>('/api/v2/stats', fetcher, {
    refreshInterval: 60_000,
  });
  const { data: reforest } = useSWR<ReforestationData>('/api/v2/reforestation-stats', fetcher, {
    refreshInterval: 300_000,
  });

  const isLumiere = variant === 'lumiere';
  const textColor = isLumiere ? '#1A1A1A' : '#FFFFFF';
  const mutedColor = isLumiere ? '#888888' : '#666666';

  if (variant === 'lumiere') {
    const lumiereCount = stats?.byClassification?.lumiere ?? null;
    const cultureCount = stats?.cultureEventsToday ?? null;
    const hectares = reforest?.hectares ?? null;
    const projectCount = reforest?.projectCount ?? 0;
    return (
      <div className="flex flex-wrap gap-6 text-[13px]">
        <div>
          <span style={{ color: mutedColor }}>Projets reconstruction </span>
          <span style={{ color: textColor }}>{lumiereCount != null ? lumiereCount : '—'}</span>
        </div>
        <div>
          <span style={{ color: mutedColor }}>Events culturels </span>
          <span style={{ color: textColor }}>{cultureCount != null ? cultureCount : '—'}</span>
        </div>
        <div>
          <span style={{ color: mutedColor }}>Hectares replantés </span>
          <span style={{ color: textColor }}>
            {hectares != null ? hectares.toLocaleString() : projectCount > 0 ? projectCount : '—'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-6 text-[13px]">
      <div>
        <span style={{ color: mutedColor }}>Incidents 24h </span>
        <span style={{ color: textColor }}>{stats?.eventsToday ?? '—'}</span>
      </div>
      <div>
        <span style={{ color: mutedColor }}>LBP </span>
        <span style={{ color: textColor }}>
          {indicators?.lbp != null ? indicators.lbp.toLocaleString() : '—'}
        </span>
      </div>
      <div>
        <span style={{ color: mutedColor }}>AQI PM2.5 </span>
        <span style={{ color: textColor }}>
          {indicators?.aqi != null ? `${indicators.aqi} µg/m³` : '—'}
        </span>
      </div>
    </div>
  );
}
