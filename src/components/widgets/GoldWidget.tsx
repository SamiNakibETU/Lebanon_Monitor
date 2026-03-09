'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function GoldWidget() {
  const { data: gold } = useSWR<{ usdPerOz: number; source: string }>(
    '/api/v2/gold',
    fetcher,
    { refreshInterval: 3600_000 }
  );
  const { data: lbp } = useSWR<{ rate: number }>(
    '/api/v2/lbp-rate',
    fetcher,
    { refreshInterval: 300_000 }
  );

  const usd = gold?.usdPerOz ?? null;
  const lbpRate = lbp?.rate ?? 89500;
  const lbpPerOz = usd ? Math.round(usd * lbpRate) : null;

  return (
    <div className="flex flex-col p-4" style={{ background: '#0A0A0A' }}>
      <div
        className="text-[11px] uppercase tracking-[0.08em] mb-2"
        style={{ color: '#666666' }}
      >
        Or (XAU) / once troy
      </div>
      <div
        className="text-[48px] font-light tabular-nums"
        style={{ color: '#FFC107' }}
      >
        {usd
          ? `$${usd.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
          : '—'}
      </div>
      <div className="text-[11px] mt-1" style={{ color: '#666666' }}>
        {lbpPerOz ? `${lbpPerOz.toLocaleString()} LBP` : 'USD / oz'}
      </div>
      <div className="text-[10px] mt-2" style={{ color: '#444444' }}>
        {gold?.source === 'fallback' ? 'prix indicatif' : 'cours international'}
      </div>
    </div>
  );
}
