'use client';

import { useRef } from 'react';
import useSWR from 'swr';
import { Sparkline } from '@/components/charts/Sparkline';
import { useContainerSize } from '@/hooks/useContainerSize';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function LBPWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width } = useContainerSize(containerRef);

  const { data } = useSWR<{ lbp: number | null; history?: { lbp?: Array<{ at: string; value?: number }> } }>(
    '/api/v2/indicators',
    fetcher,
    { refreshInterval: 60_000 }
  );

  const lbp = data?.lbp ?? null;
  const history = data?.history?.lbp ?? [];
  const sparklineData = history
    .filter((h): h is { at: string; value: number } => typeof h.value === 'number')
    .slice(-90)
    .map((h) => h.value);

  return (
    <div className="flex flex-col p-4" style={{ background: '#0A0A0A' }}>
      <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#666666' }}>
        Taux LBP / USD
      </div>
      <div className="text-[48px] font-light tabular-nums" style={{ color: '#FFFFFF' }}>
        {lbp != null ? lbp.toLocaleString() : '—'}
      </div>
      <div className="mt-2" style={{ height: 40 }}>
        <Sparkline width={width} height={40} data={sparklineData} strokeColor="#666666" />
      </div>
    </div>
  );
}
