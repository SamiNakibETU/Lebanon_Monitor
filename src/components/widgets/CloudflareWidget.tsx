'use client';

import { useRef } from 'react';
import { Sparkline } from '@/components/charts/Sparkline';
import { useContainerSize } from '@/hooks/useContainerSize';

export function CloudflareWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width } = useContainerSize(containerRef);

  const sparklineData = [85, 90, 88, 92, 87, 91, 89];

  return (
    <div
      ref={containerRef}
      className="flex flex-col p-4"
      style={{ background: '#FAFAFA' }}
    >
      <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#666666' }}>
        Trafic Internet
      </div>
      <div className="text-[11px] mb-2" style={{ color: '#666666' }}>
        Cloudflare Radar
      </div>
      <div className="text-[48px] font-light tabular-nums" style={{ color: '#1A1A1A' }}>
        —
      </div>
      <div className="mt-2" style={{ height: 40 }}>
        <Sparkline width={width} height={40} data={sparklineData} strokeColor="#666666" />
      </div>
    </div>
  );
}
