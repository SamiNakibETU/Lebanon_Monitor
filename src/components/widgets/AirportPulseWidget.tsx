'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface AirportData {
  departures: number | null;
  arrivals: number | null;
  total: number | null;
  status: string;
}

export function AirportPulseWidget() {
  const { data } = useSWR<AirportData>('/api/v2/airport', fetcher, { refreshInterval: 15 * 60 * 1000 });

  return (
    <div className="flex flex-col p-4" style={{ background: '#0A0A0A' }}>
      <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#666666' }}>
        Airport Pulse
      </div>
      <div className="text-[48px] font-light tabular-nums" style={{ color: '#FFFFFF' }}>
        {data?.total != null ? data.total : '—'}
      </div>
      <div className="text-[11px] mt-1" style={{ color: '#666666' }}>
        {data?.status === 'ok'
          ? `${data.departures ?? 0} dep · ${data.arrivals ?? 0} arr`
          : 'flux vols indisponible'}
      </div>
    </div>
  );
}
