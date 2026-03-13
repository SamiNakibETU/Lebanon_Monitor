'use client';

import Link from 'next/link';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface SupportingEvent {
  id: string;
  title: string;
  category: string | null;
  occurredAt: string;
}

interface VitalityData {
  supportingEvents: SupportingEvent[];
}

interface VitalityEvidenceListProps {
  lang?: string;
}

export function VitalityEvidenceList({ lang }: VitalityEvidenceListProps) {
  const { data, isLoading, error } = useSWR<VitalityData>('/api/v2/vitality', fetcher, {
    refreshInterval: 60_000,
  });

  const events = data?.supportingEvents ?? [];

  if (isLoading) {
    return (
      <div className="py-4 text-[13px]" style={{ color: '#888888' }}>
        Chargement des preuves…
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 text-[13px]" style={{ color: '#888888' }}>
        Connexion en cours…
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="py-4 text-[13px]" style={{ color: '#888888' }}>
        Aucun événement de continuité récent.
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {events.map((e) => {
        const time = new Date(e.occurredAt);
        const timeStr = time.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        });
        const title = e.title.length > 60 ? `${e.title.slice(0, 60)}…` : e.title;
        return (
          <Link
            key={e.id}
            href={`/event/${e.id}`}
            className="flex items-start gap-3 py-3 px-0 transition-colors group"
            style={{
              borderBottom: '1px solid #E0DCD7',
              fontFamily: '"DM Mono", "SF Mono", monospace',
              fontSize: 13,
            }}
            onMouseEnter={(ev) => {
              ev.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)';
            }}
            onMouseLeave={(ev) => {
              ev.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span
              className="inline-block shrink-0 mt-1.5"
              style={{ width: 4, height: 4, background: '#2E7D32' }}
            />
            <span className="shrink-0 tabular-nums" style={{ color: '#888888' }}>
              {timeStr}
            </span>
            <span className="shrink-0" style={{ color: '#888888' }}>
              {e.category?.replace(/_/g, ' ') ?? '—'}
            </span>
            <span style={{ color: '#888888' }}>│</span>
            <span
              className="flex-1 min-w-0"
              style={{ color: '#1A1A1A' }}
            >
              {title}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
