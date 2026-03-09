'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface EDLData {
  availableHours: number | null;
  status: string;
  source: string;
}

export function EDLWidget() {
  const { data } = useSWR<EDLData>('/api/v2/edl', fetcher, { refreshInterval: 60 * 60 * 1000 });

  return (
    <div className="flex flex-col p-4" style={{ background: '#0A0A0A' }}>
      <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#666666' }}>
        EDL Power Tracker
      </div>
      <div className="text-[48px] font-light tabular-nums" style={{ color: '#FFFFFF' }}>
        {data?.availableHours != null ? `${data.availableHours}h` : '—'}
      </div>
      <div className="text-[11px] mt-1" style={{ color: '#666666' }}>
        {data?.status === 'ok' ? 'heures moyennes / jour' : 'données indisponibles'}
      </div>
    </div>
  );
}
