'use client';

import Link from 'next/link';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface VitalityData {
  summary: string;
  measuredIndicators: Array<{ key: string; label: string; value: number | string; unit: string | null }>;
  proxyIndicators: Array<{ key: string; label: string; value: number | string | null; unit: string | null }>;
  supportingEvents: Array<{ id: string; title: string; category: string | null; occurredAt: string }>;
  coverage: string[];
  gaps: string[];
  caveats: string[];
}

interface PlaceVitalityBlockProps {
  placeId: string;
}

export function PlaceVitalityBlock({ placeId }: PlaceVitalityBlockProps) {
  const { data, error, isLoading } = useSWR<VitalityData>(
    placeId ? `/api/v2/places/${placeId}/vitality` : null,
    fetcher,
    { refreshInterval: 300_000 }
  );

  if (error || isLoading || !data) {
    if (error) return null;
    return (
      <div
        className="mt-8 p-4"
        style={{ background: '#0A0A0A', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      >
        <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#666666' }}>
          Vitalité territoriale
        </div>
        <p style={{ color: '#666666', fontSize: 13 }}>Chargement…</p>
      </div>
    );
  }

  const events = data.supportingEvents ?? [];
  const indicators = [...(data.measuredIndicators ?? []), ...(data.proxyIndicators ?? [])];

  return (
    <div
      className="mt-8 p-6"
      style={{ background: '#0A0A0A', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
    >
      <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#666666' }}>
        Vitalité territoriale
      </div>
      <p className="text-[14px] mb-4" style={{ color: '#FFFFFF' }}>
        {data.summary}
      </p>
      {indicators.length > 0 && (
        <div className="flex flex-wrap gap-4 text-[12px] mb-4">
          {indicators.map((ind) => (
            <span key={ind.key}>
              <span style={{ color: '#666666' }}>{ind.label}: </span>
              <span style={{ color: '#FFFFFF' }}>
                {ind.value != null
                  ? typeof ind.value === 'number'
                    ? ind.value.toLocaleString()
                    : ind.value
                  : '—'}
                {ind.unit ? ` ${ind.unit}` : ''}
              </span>
            </span>
          ))}
        </div>
      )}
      {events.length > 0 && (
        <div className="mb-4">
          <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#666666' }}>
            Événements continuité
          </div>
          <div className="flex flex-col gap-2">
            {events.slice(0, 5).map((e) => (
              <Link
                key={e.id}
                href={`/event/${e.id}`}
                className="text-[12px] leading-snug transition-colors"
                style={{ color: '#FFFFFF' }}
              >
                {e.title.length > 70 ? `${e.title.slice(0, 70)}…` : e.title}
              </Link>
            ))}
          </div>
        </div>
      )}
      {data.gaps.length > 0 && (
        <div className="text-[11px] mt-2" style={{ color: '#666666' }}>
          Gaps: {data.gaps.join(' · ')}
        </div>
      )}
    </div>
  );
}
