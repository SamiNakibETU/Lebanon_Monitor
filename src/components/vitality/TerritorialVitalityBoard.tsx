'use client';

import useSWR from 'swr';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface VitalityData {
  summary: string;
  measuredIndicators: Array<{ key: string; label: string; value: number | string }>;
  proxyIndicators: Array<{ key: string; label: string; value: number | string | null }>;
  narrativeSignals: Array<{ id: string; title: string; source: string | null; url: string | null }>;
  supportingEvents: Array<{ id: string; title: string; category: string | null; occurredAt: string }>;
  supportingPlaces: Array<{ name: string; governorate?: string }>;
  coverage: string[];
  gaps: string[];
  caveats: string[];
}

export function TerritorialVitalityBoard() {
  const { data } = useSWR<VitalityData>('/api/v2/vitality', fetcher, {
    refreshInterval: 300_000,
  });

  const narrative = data?.narrativeSignals ?? [];
  const events = data?.supportingEvents ?? [];
  const places = data?.supportingPlaces ?? [];

  if (!data) {
    return (
      <div className="p-4" style={{ background: '#F5F2EE', color: '#888888' }}>
        <div className="text-[11px] uppercase tracking-[0.08em] mb-2">Vitalité territoriale</div>
        <div className="text-[14px]">Chargement…</div>
      </div>
    );
  }

  return (
    <div className="p-4" style={{ background: '#F5F2EE' }}>
      <div className="text-[11px] uppercase tracking-[0.08em] mb-3" style={{ color: '#888888' }}>
        Vitalité &amp; Reprise — indicateurs · preuves · couverture
      </div>
      <div className="text-[14px] mb-4" style={{ color: '#1A1A1A' }}>
        {data.summary}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ background: '#E0DCD7' }}>
        <div className="p-3" style={{ background: '#F5F2EE' }}>
          <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#1A1A1A' }}>
            Rapports ReliefWeb
          </div>
          {narrative.slice(0, 4).map((n) => (
            <a
              key={n.id}
              href={n.url ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="block py-2 text-[12px] leading-snug transition-colors"
              style={{ color: '#1A1A1A', borderBottom: '1px solid #E0DCD7' }}
            >
              {n.title.length > 70 ? `${n.title.slice(0, 70)}…` : n.title}
            </a>
          ))}
          {narrative.length === 0 && (
            <div className="text-[11px] py-2" style={{ color: '#888888' }}>Aucun rapport récent</div>
          )}
        </div>
        <div className="p-3" style={{ background: '#F5F2EE' }}>
          <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#1A1A1A' }}>
            Événements continuité
          </div>
          {events.slice(0, 4).map((e) => (
            <Link
              key={e.id}
              href={`/event/${e.id}`}
              className="block py-2 text-[12px] leading-snug transition-colors"
              style={{ color: '#1A1A1A', borderBottom: '1px solid #E0DCD7' }}
            >
              {e.title.length > 70 ? `${e.title.slice(0, 70)}…` : e.title}
            </Link>
          ))}
          {events.length === 0 && (
            <div className="text-[11px] py-2" style={{ color: '#888888' }}>Aucun événement récent</div>
          )}
        </div>
        <div className="p-3" style={{ background: '#F5F2EE' }}>
          <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#1A1A1A' }}>
            Territoires couverts
          </div>
          {places.slice(0, 6).map((p) => (
            <div
              key={p.name}
              className="py-1.5 text-[12px]"
              style={{ color: '#1A1A1A', borderBottom: '1px solid #E0DCD7' }}
            >
              {p.name}
              {p.governorate && p.governorate !== p.name ? ` · ${p.governorate}` : ''}
            </div>
          ))}
          {places.length === 0 && (
            <div className="text-[11px] py-2" style={{ color: '#888888' }}>—</div>
          )}
        </div>
      </div>
      {(data.gaps.length > 0 || data.caveats.length > 0 || data.coverage.length > 0) && (
        <div className="mt-4 pt-3" style={{ borderTop: '1px solid #E0DCD7' }}>
          {data.coverage.length > 0 && (
            <div className="text-[11px] mb-2" style={{ color: '#888888' }}>
              Couverture: {data.coverage.join(' · ')}
            </div>
          )}
          {data.gaps.length > 0 && (
            <div className="text-[11px] mb-2" style={{ color: '#888888' }}>
              Manques: {data.gaps.join(' · ')}
            </div>
          )}
          {data.caveats.length > 0 && (
            <div className="text-[11px]" style={{ color: '#888888' }}>
              Caveats: {data.caveats.join(' · ')}
            </div>
          )}
        </div>
      )}
      <div className="mt-3 pt-2 flex flex-wrap gap-4">
        <Link
          href="/places"
          className="text-[11px] uppercase tracking-[0.08em] transition-colors duration-150"
          style={{ color: '#888888' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#1A1A1A';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#888888';
          }}
        >
          Voir vitalité par lieu →
        </Link>
        <Link
          href="/retrieval?objectTypes=events,episodes,places,actors&limit=25"
          className="text-[11px] uppercase tracking-[0.08em] transition-colors duration-150"
          style={{ color: '#888888' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#1A1A1A';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#888888';
          }}
        >
          Ouvrir retrieval →
        </Link>
      </div>
    </div>
  );
}
