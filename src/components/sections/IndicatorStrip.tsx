'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

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

interface LbpRateData {
  rate: number;
}

interface AqiData {
  pm25: number | null;
}

interface ReliefwebLumiereData {
  count: number;
}

interface IndicatorStripProps {
  variant: 'lumiere' | 'ombre';
}

export function IndicatorStrip({ variant }: IndicatorStripProps) {
  const { data: stats } = useSWR<StatsData>('/api/v2/stats', fetcher, {
    refreshInterval: 60_000,
  });
  const { data: reforest } = useSWR<ReforestationData>('/api/v2/reforestation-stats', fetcher, {
    refreshInterval: 300_000,
  });
  const { data: lbpData } = useSWR<LbpRateData>('/api/v2/lbp-rate', fetcher, {
    refreshInterval: 300_000,
  });
  const { data: aqiData } = useSWR<AqiData>('/api/v2/aqi', fetcher, {
    refreshInterval: 300_000,
  });
  const { data: rwLumiere } = useSWR<ReliefwebLumiereData>('/api/v2/reliefweb-lumiere?limit=20', fetcher, {
    refreshInterval: 300_000,
  });

  const isLumiere = variant === 'lumiere';
  const textColor = isLumiere ? '#1A1A1A' : '#FFFFFF';
  const mutedColor = isLumiere ? '#888888' : '#666666';

  if (variant === 'lumiere') {
    const lumiereCount = stats?.byClassification?.lumiere ?? null;
    const cultureCount = stats?.cultureEventsToday ?? null;
    const humanitarianReports = rwLumiere?.count ?? null;
    const hectares = reforest?.hectares ?? null;
    const projectCount = reforest?.projectCount ?? 0;
    return (
      <div className="flex flex-wrap gap-6 text-[13px]">
        <div>
          <span style={{ color: mutedColor }}>Signaux positifs 24h </span>
          <span style={{ color: textColor }}>{lumiereCount != null ? lumiereCount : '—'}</span>
        </div>
        <div>
          <span style={{ color: mutedColor }}>Events culturels </span>
          <span style={{ color: textColor }}>{cultureCount != null ? cultureCount : '—'}</span>
        </div>
        <div>
          <span style={{ color: mutedColor }}>Rapports humanitaires </span>
          <span style={{ color: textColor }}>{humanitarianReports != null ? humanitarianReports : '—'}</span>
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

  const lbpRate = lbpData?.rate ?? null;
  const pm25 = aqiData?.pm25 ?? null;

  return (
    <div className="flex flex-wrap gap-6 text-[13px]">
      <div>
        <span style={{ color: mutedColor }}>Incidents 24h </span>
        <span style={{ color: textColor }}>{stats?.eventsToday ?? '—'}</span>
      </div>
      <div>
        <span style={{ color: mutedColor }}>LBP </span>
        <span style={{ color: textColor }}>
          {lbpRate != null ? lbpRate.toLocaleString() : '—'}
        </span>
      </div>
      <div>
        <span style={{ color: mutedColor }}>AQI PM2.5 </span>
        <span style={{ color: textColor }}>
          {pm25 != null ? `${pm25} µg/m³` : '—'}
        </span>
      </div>
    </div>
  );
}
