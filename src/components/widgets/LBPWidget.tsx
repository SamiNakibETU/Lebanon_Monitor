'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function LBPWidget() {

  const { data } = useSWR<{ rate: number; source: string; updated: string; spreadVsOfficial?: number | null; volatility24h?: number | null }>(
    '/api/v2/lbp-rate',
    fetcher,
    { refreshInterval: 300_000 }
  );

  const rate = data?.rate ?? null;

  return (
    <div className="flex flex-col p-4" style={{ background: '#0A0A0A' }}>
      <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#666666' }}>
        Taux LBP / USD
      </div>
      <div className="text-[48px] font-light tabular-nums" style={{ color: '#FFFFFF' }}>
        {rate != null ? rate.toLocaleString() : '—'}
      </div>
      <div className="text-[11px] mt-1" style={{ color: '#666666' }}>
        {data?.source === 'fallback' ? 'taux indicatif' : 'marché parallèle'}
      </div>
      <div className="text-[11px] mt-1" style={{ color: '#666666' }}>
        {data?.volatility24h != null ? `vol24h ${data.volatility24h.toFixed(1)}%` : 'vol24h n/a'}
        {data?.spreadVsOfficial != null ? ` · spread ${data.spreadVsOfficial.toFixed(1)}%` : ''}
      </div>
    </div>
  );
}
