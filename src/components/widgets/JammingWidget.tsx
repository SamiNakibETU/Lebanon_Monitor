'use client';

import { useRef } from 'react';
import useSWR from 'swr';
import { Sparkline } from '@/components/charts/Sparkline';
import { useContainerSize } from '@/hooks/useContainerSize';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function JammingWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width } = useContainerSize(containerRef);

  const { data } = useSWR<{ jammingIndex?: number | null }>('/api/v2/opensky', fetcher, {
    refreshInterval: 60_000,
  });

  const score = data?.jammingIndex ?? 0;
  const sparklineData = [0, 5, 12, 8, 0, 3, score];

  const color = score < 20 ? '#2E7D32' : score < 50 ? '#F57C00' : '#C62828';

  return (
    <div className="flex flex-col p-4" style={{ background: '#FAFAFA' }}>
      <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#666666' }}>
        GPS Jamming
      </div>
      <div className="text-[48px] font-light tabular-nums" style={{ color: score > 0 ? color : '#1A1A1A' }}>
        {score}/100
      </div>
      <div className="mt-2" style={{ height: 40 }}>
        <Sparkline width={width} height={40} data={sparklineData} strokeColor={color} />
      </div>
    </div>
  );
}
