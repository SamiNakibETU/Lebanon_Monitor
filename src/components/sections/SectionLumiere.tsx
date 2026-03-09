'use client';

import useSWR from 'swr';
import { ReconstructionWidget } from '@/components/widgets/ReconstructionWidget';
import { CultureWidget } from '@/components/widgets/CultureWidget';
import { ReforestationWidget } from '@/components/widgets/ReforestationWidget';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface LumiereEvent {
  id: string;
  title: string;
  source?: string | null;
  category?: string | null;
  occurredAt: string;
  url?: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  cultural_event: 'Culture',
  reconstruction: 'Reconstruction',
  institutional_progress: 'Institutions',
  solidarity: 'Solidarité',
  economic_positive: 'Économie',
  international_recognition: 'International',
  environmental_positive: 'Environnement',
};

function LumiereHighlights() {
  const { data } = useSWR<{ data: LumiereEvent[] }>(
    '/api/v2/events?classification=lumiere&limit=20',
    fetcher,
    { refreshInterval: 300_000 }
  );

  const events = Array.isArray(data?.data) ? data.data.slice(0, 10) : [];

  if (events.length === 0) {
    return (
      <div className="p-4" style={{ background: '#F5F2EE', color: '#888888' }}>
        <div className="text-[11px] uppercase tracking-[0.08em] mb-2">
          Fil lumière
        </div>
        <div className="text-[14px]">En attente de données positives...</div>
      </div>
    );
  }

  return (
    <div className="p-4" style={{ background: '#F5F2EE' }}>
      <div className="text-[11px] uppercase tracking-[0.08em] mb-3" style={{ color: '#888888' }}>
        Fil lumière — dernières nouvelles positives
      </div>
      <div className="flex flex-col">
        {events.map((e) => (
          <div
            key={e.id}
            className="flex items-start gap-3 py-2"
            style={{ borderBottom: '1px solid #E0DCD7' }}
          >
            <span
              className="text-[10px] uppercase tracking-[0.08em] shrink-0 mt-0.5"
              style={{ color: '#2E7D32', minWidth: 80 }}
            >
              {CATEGORY_LABELS[e.category ?? ''] ?? 'Signal'}
            </span>
            <div className="flex-1 min-w-0">
              <div
                className="text-[13px] leading-snug truncate"
                style={{ color: '#1A1A1A' }}
              >
                {e.title}
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: '#888888' }}>
                {e.source ?? ''} · {new Date(e.occurredAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SectionLumiere() {
  return (
    <section style={{ background: '#000000' }}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px w-full">
        <ReconstructionWidget />
        <CultureWidget />
        <ReforestationWidget />
      </div>
      <div className="mt-px">
        <LumiereHighlights />
      </div>
    </section>
  );
}
