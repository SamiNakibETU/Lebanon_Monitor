'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface VitalityData {
  summary: string;
  generatedAt: string;
}

export function VitalitySummary() {
  const { data, isLoading, error } = useSWR<VitalityData>('/api/v2/vitality', fetcher, {
    refreshInterval: 300_000,
  });

  if (isLoading || error) {
    return (
      <div
        className="text-[14px] leading-relaxed"
        style={{ color: '#888888' }}
      >
        Synthèse vitalité en cours…
      </div>
    );
  }

  return (
    <div
      className="text-[14px] leading-relaxed"
      style={{ color: '#1A1A1A' }}
    >
      {data?.summary ?? '—'}
    </div>
  );
}
