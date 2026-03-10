'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface MarketIntelData {
  lbp: { rate: number; delta24hPct: number | null };
  gold: { usdPerOz: number | null; delta24hPct: number | null };
  brent: { usd: number | null; delta24hPct: number | null };
  polymarket: { question: string; yesProb: number; delta24h: number | null; eventSlug: string } | null;
  verdict: string;
}

function delta(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return 'n/a';
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function deltaColor(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '#666666';
  if (value >= 2) return '#C62828';
  if (value <= -2) return '#2E7D32';
  return '#888888';
}

export function MarketIntelWidget() {
  const { data } = useSWR<MarketIntelData>('/api/v2/market-intel', fetcher, { refreshInterval: 300_000 });
  const polyDeltaPct = data?.polymarket?.delta24h != null ? data.polymarket.delta24h * 100 : null;

  return (
    <div className="p-4" style={{ background: '#0A0A0A' }}>
      <div className="text-[11px] uppercase tracking-[0.08em] mb-3" style={{ color: '#666666' }}>
        Intelligence marchés
      </div>
      <div className="grid grid-cols-2 gap-2 text-[12px] mb-3">
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: 6 }}>
          <div style={{ color: '#888888' }}>LBP (black market)</div>
          <div style={{ color: '#FFFFFF' }}>{data?.lbp?.rate?.toLocaleString() ?? '—'}</div>
          <div style={{ color: deltaColor(data?.lbp?.delta24hPct) }}>{delta(data?.lbp?.delta24hPct)}</div>
        </div>
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: 6 }}>
          <div style={{ color: '#888888' }}>Or (XAU)</div>
          <div style={{ color: '#FFFFFF' }}>{data?.gold?.usdPerOz != null ? `$${Math.round(data.gold.usdPerOz)}` : '—'}</div>
          <div style={{ color: deltaColor(data?.gold?.delta24hPct) }}>{delta(data?.gold?.delta24hPct)}</div>
        </div>
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: 6 }}>
          <div style={{ color: '#888888' }}>Brent</div>
          <div style={{ color: '#FFFFFF' }}>{data?.brent?.usd != null ? `$${Math.round(data.brent.usd)}` : '—'}</div>
          <div style={{ color: deltaColor(data?.brent?.delta24hPct) }}>{delta(data?.brent?.delta24hPct)}</div>
        </div>
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: 6 }}>
          <div style={{ color: '#888888' }}>Polymarket</div>
          <div style={{ color: '#FFFFFF' }}>
            {data?.polymarket != null ? `${Math.round(data.polymarket.yesProb * 100)}%` : '—'}
          </div>
          <div style={{ color: deltaColor(polyDeltaPct) }}>{delta(polyDeltaPct)}</div>
        </div>
      </div>
      <div className="text-[11px] leading-relaxed" style={{ color: '#CCCCCC' }}>
        {data?.verdict ?? 'Analyse marchés en cours…'}
      </div>
    </div>
  );
}

