'use client';

import useSWR from 'swr';
import { ReconstructionWidget } from '@/components/widgets/ReconstructionWidget';
import { CultureWidget } from '@/components/widgets/CultureWidget';
import { SolidarityActiveWidget } from '@/components/widgets/SolidarityActiveWidget';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface LumiereEvent {
  id: string;
  title: string;
  source?: string | null;
  category?: string | null;
  occurredAt: string;
  url?: string | null;
  confidence_lumiere?: number | null;
  impact_lumiere?: number | null;
  verification_status?: string | null;
  resolvedPlaceName?: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  aid_delivery_verified: 'Aide vérifiée',
  service_restoration: 'Service restauré',
  cultural_resilience: 'Résilience culturelle',
  sports_cohesion: 'Cohésion sportive',
  civil_society_mobilization: 'Mobilisation civile',
  cultural_event: 'Culture',
  reconstruction: 'Reconstruction',
  institutional_progress: 'Institutions',
  solidarity: 'Solidarité',
  economic_positive: 'Économie',
  international_recognition: 'International',
  environmental_positive: 'Environnement',
}

function confidenceBadge(status?: string | null): { label: string; color: string } {
  if (status === 'verified') return { label: 'Vérifié', color: '#2E7D32' };
  if (status === 'partially_verified') return { label: 'Partiel', color: '#888888' };
  return { label: 'Faible', color: '#888888' };
}

function LumiereBoard() {
  const { data } = useSWR<{ data: LumiereEvent[] }>(
    '/api/v2/events?classification=lumiere&limit=60',
    fetcher,
    { refreshInterval: 300_000 }
  );

  const all = Array.isArray(data?.data) ? data.data : [];
  const now = all.slice(0, 8);
  const momentum = [...all]
    .filter((e) => (e.impact_lumiere ?? 0) >= 60 || (e.confidence_lumiere ?? 0) >= 70)
    .slice(0, 8);
  const structural = [...all]
    .filter((e) => ['service_restoration', 'institutional_progress', 'aid_delivery_verified'].includes(e.category ?? ''))
    .slice(0, 8);

  if (all.length === 0) {
    return (
      <div className="p-4" style={{ background: '#F5F2EE', color: '#888888' }}>
        <div className="text-[11px] uppercase tracking-[0.08em] mb-2">Lumière Intelligence</div>
        <div className="text-[14px]">En attente de données positives...</div>
      </div>
    );
  }

  const columns = [
    { title: 'Now', items: now },
    { title: 'Momentum', items: momentum },
    { title: 'Structural', items: structural },
  ];

  return (
    <div className="p-4" style={{ background: '#F5F2EE' }}>
      <div className="text-[11px] uppercase tracking-[0.08em] mb-3" style={{ color: '#888888' }}>
        Lumière Intelligence — now / momentum / structural
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ background: '#E0DCD7' }}>
        {columns.map((col) => (
          <div key={col.title} className="p-3" style={{ background: '#F5F2EE' }}>
            <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#1A1A1A' }}>{col.title}</div>
            <div className="flex flex-col">
              {col.items.map((e) => {
                const badge = confidenceBadge(e.verification_status);
                return (
                  <div key={`${col.title}-${e.id}`} className="py-2" style={{ borderBottom: '1px solid #E0DCD7' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] uppercase tracking-[0.08em]" style={{ color: '#2E7D32' }}>
                        {CATEGORY_LABELS[e.category ?? ''] ?? 'Signal'}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.08em]" style={{ color: badge.color }}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="text-[12px] leading-snug" style={{ color: '#1A1A1A' }}>{e.title}</div>
                    <div className="text-[10px] mt-1" style={{ color: '#888888' }}>
                      {e.source ?? ''} · {e.resolvedPlaceName ?? 'Liban'} · {new Date(e.occurredAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </div>
                  </div>
                );
              })}
              {col.items.length === 0 && (
                <div className="text-[11px] py-2" style={{ color: '#888888' }}>Aucun signal.</div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
        {all.slice(0, 3).map((e) => (
          <div key={`chain-${e.id}`} className="p-2" style={{ borderBottom: '1px solid #E0DCD7' }}>
            <div className="text-[10px] uppercase tracking-[0.08em]" style={{ color: '#888888' }}>Evidence chain</div>
            <div className="text-[11px]" style={{ color: '#1A1A1A' }}>
              {e.source ?? 'source inconnue'} {'->'} {e.resolvedPlaceName ?? 'Liban'} {'->'} {new Date(e.occurredAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-[10px]" style={{ color: '#888888' }}>
              Conf: {e.confidence_lumiere ?? 'n/a'} · Impact: {e.impact_lumiere ?? 'n/a'}
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
        <SolidarityActiveWidget />
        <ReconstructionWidget />
        <CultureWidget />
      </div>
      <div className="mt-px">
        <LumiereBoard />
      </div>
    </section>
  );
}
