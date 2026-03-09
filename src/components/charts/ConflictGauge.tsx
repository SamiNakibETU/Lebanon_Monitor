'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface TrendsData {
  intensity: Array<{ day: string; score: number }>;
}

function getColor(score: number): string {
  if (score <= 25) return '#2E7D32';
  if (score <= 50) return '#F9A825';
  if (score <= 75) return '#E65100';
  return '#C62828';
}

function getLabel(score: number): string {
  if (score <= 25) return 'Faible';
  if (score <= 50) return 'Modéré';
  if (score <= 75) return 'Élevé';
  return 'Critique';
}

export function ConflictGauge() {
  const { data } = useSWR<TrendsData>('/api/v2/trends?days=7', fetcher, {
    refreshInterval: 300_000,
  });

  const latestScore = data?.intensity?.length
    ? data.intensity[data.intensity.length - 1].score
    : null;

  const score = latestScore ?? 0;
  const color = getColor(score);

  return (
    <div className="flex flex-col p-4" style={{ background: '#0A0A0A' }}>
      <div
        className="text-[11px] uppercase tracking-[0.08em] mb-2"
        style={{ color: '#666666' }}
      >
        Indice de tension
      </div>
      <div className="flex items-baseline gap-2 mb-3">
        <span
          className="text-[48px] font-light tabular-nums"
          style={{ color: '#FFFFFF' }}
        >
          {latestScore != null ? score : '—'}
        </span>
        <span className="text-[14px]" style={{ color }}>
          /100 · {getLabel(score)}
        </span>
      </div>
      <div
        className="w-full h-1.5"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${Math.min(score, 100)}%`,
            background: color,
          }}
        />
      </div>
      {data?.intensity && data.intensity.length > 1 && (
        <div className="flex gap-1 mt-2">
          {data.intensity.slice(-7).map((d, i) => (
            <div
              key={i}
              className="flex-1 h-1"
              style={{
                background: getColor(d.score),
                opacity: 0.5 + i / 14,
              }}
              title={`${d.day}: ${d.score}/100`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
