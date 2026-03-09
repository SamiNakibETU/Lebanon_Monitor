'use client';

import { useRef } from 'react';
import useSWR from 'swr';
import { useContainerSize } from '@/hooks/useContainerSize';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface CloudflareResponse {
  outageCount: number | null;
  totalRecent: number;
  status: 'stable' | 'disrupted' | 'error';
}

export function CloudflareWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width } = useContainerSize(containerRef);

  const { data } = useSWR<CloudflareResponse>('/api/v2/cloudflare', fetcher, {
    refreshInterval: 300_000,
  });

  const status = data?.status ?? null;
  const outageCount = data?.outageCount ?? null;

  return (
    <div
      ref={containerRef}
      className="flex flex-col p-4"
      style={{ background: '#FAFAFA' }}
    >
      <div
        className="text-[11px] uppercase tracking-[0.08em] mb-2"
        style={{ color: '#666666' }}
      >
        Trafic Internet
      </div>
      <div
        className="text-[11px] mb-2"
        style={{ color: '#666666' }}
      >
        Cloudflare Radar · LB
      </div>
      <div
        className="text-[48px] font-light tabular-nums"
        style={{ color: status === 'disrupted' ? '#C62828' : '#1A1A1A' }}
      >
        {outageCount != null ? outageCount : '—'}
      </div>
      <div className="text-[11px] mt-1" style={{ color: '#888888' }}>
        {status === 'stable'
          ? 'Internet stable — aucune coupure'
          : status === 'disrupted'
            ? `coupure${outageCount !== 1 ? 's' : ''} active${outageCount !== 1 ? 's' : ''} (7j)`
            : 'coupures récentes (7j)'}
      </div>
    </div>
  );
}
