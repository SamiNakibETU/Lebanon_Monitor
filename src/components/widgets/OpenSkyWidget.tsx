'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function OpenSkyWidget() {
  const { data } = useSWR<{ count?: number; jammingIndex?: number }>(
    '/api/v2/opensky',
    fetcher,
    { refreshInterval: 30_000 }
  );

  const count = data?.count ?? null;

  return (
    <div className="flex flex-col p-4" style={{ background: '#FAFAFA' }}>
      <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#666666' }}>
        Espace Aérien
      </div>
      <div className="text-[11px] mb-2" style={{ color: '#666666' }}>
        OpenSky Network
      </div>
      <div className="text-[48px] font-light tabular-nums" style={{ color: '#1A1A1A' }}>
        {count != null ? count : '—'}
      </div>
      <div className="text-[11px] mt-1" style={{ color: '#666666' }}>
        avions au-dessus du Liban
      </div>
    </div>
  );
}
