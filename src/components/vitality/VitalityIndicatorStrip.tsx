'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface VitalityData {
  measuredIndicators: Array<{ key: string; label: string; value: number | string; unit: string | null }>;
  proxyIndicators: Array<{ key: string; label: string; value: number | string | null; unit: string | null }>;
}

export function VitalityIndicatorStrip() {
  const { data } = useSWR<VitalityData>('/api/v2/vitality', fetcher, {
    refreshInterval: 300_000,
  });

  const measured = data?.measuredIndicators ?? [];
  const proxy = data?.proxyIndicators ?? [];

  return (
    <div className="flex flex-col gap-4">
      {measured.length > 0 && (
        <div>
          <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#888888' }}>
            Mesuré
          </div>
          <div className="flex flex-wrap gap-6 text-[13px]">
            {measured.map((ind) => (
              <div key={ind.key}>
                <span style={{ color: '#888888' }}>{ind.label} </span>
                <span style={{ color: '#1A1A1A' }}>
                  {ind.value != null
                    ? typeof ind.value === 'number'
                      ? ind.value.toLocaleString()
                      : ind.value
                    : '—'}
                  {ind.unit ? ` ${ind.unit}` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {proxy.length > 0 && (
        <div>
          <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#888888' }}>
            Proxy
          </div>
          <div className="flex flex-wrap gap-6 text-[13px]">
            {proxy.map((ind) => (
              <div key={ind.key}>
                <span style={{ color: '#888888' }}>{ind.label} </span>
                <span style={{ color: '#1A1A1A' }}>
                  {ind.value != null
                    ? typeof ind.value === 'number'
                      ? ind.value.toLocaleString()
                      : ind.value
                    : '—'}
                  {ind.unit ? ` ${ind.unit}` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {measured.length === 0 && proxy.length === 0 && (
        <span style={{ color: '#888888', fontSize: 13 }}>Indicateurs en attente</span>
      )}
    </div>
  );
}
