'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Signal {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  indicators: string[];
  timestamp: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#C62828',
  high: '#E65100',
  medium: '#F9A825',
  low: '#2E7D32',
};

const SEVERITY_DOT: Record<string, string> = {
  critical: '#C62828',
  high: '#E65100',
  medium: '#F9A825',
  low: '#2E7D32',
};

export function SignalsWidget() {
  const { data } = useSWR<{ signals: Signal[] }>(
    '/api/v2/signals',
    fetcher,
    { refreshInterval: 120_000 }
  );

  const signals = data?.signals ?? [];

  return (
    <div className="flex flex-col" style={{ background: '#0A0A0A' }}>
      <div className="text-[11px] uppercase tracking-[0.08em] mb-3 px-4 pt-4" style={{ color: '#666666' }}>
        Signaux faibles · Convergence
      </div>
      {signals.length === 0 ? (
        <div className="text-[13px] px-4 pb-4" style={{ color: '#666666' }}>
          Analyse en cours…
        </div>
      ) : (
        <div className="flex flex-col">
          {signals.map((s) => (
            <div
              key={s.id}
              className="flex gap-3 py-3 px-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
            >
              <span
                className="inline-block shrink-0 mt-1"
                style={{
                  width: 6,
                  height: 6,
                  background: SEVERITY_DOT[s.severity] ?? '#666',
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] leading-snug mb-0.5" style={{ color: '#FFFFFF' }}>
                  {s.title}
                </div>
                <div className="text-[11px] leading-snug" style={{ color: '#888888' }}>
                  {s.description}
                </div>
                <div className="flex gap-2 mt-1">
                  {s.indicators.slice(0, 3).map((ind) => (
                    <span
                      key={ind}
                      className="text-[9px] uppercase tracking-wider px-1"
                      style={{
                        color: SEVERITY_COLORS[s.severity] ?? '#666',
                        border: `1px solid ${SEVERITY_COLORS[s.severity] ?? '#333'}`,
                      }}
                    >
                      {ind.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
