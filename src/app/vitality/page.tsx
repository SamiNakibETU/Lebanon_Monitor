'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { AnalystHeader } from '@/components/shared/AnalystHeader';
import { VitalitySummary } from '@/components/vitality/VitalitySummary';
import { VitalityIndicatorStrip } from '@/components/vitality/VitalityIndicatorStrip';
import { VitalityTrendChart } from '@/components/vitality/VitalityTrendChart';
import { VitalityEvidenceList } from '@/components/vitality/VitalityEvidenceList';
import { AnalystActionsBar } from '@/components/shared/AnalystActionsBar';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface VitalityData {
  summary: string;
  supportingPlaces: Array<{ name: string; governorate?: string }>;
  coverage: string[];
  gaps: string[];
  caveats: string[];
}

export default function VitalityPage() {
  const { data } = useSWR<VitalityData>('/api/v2/vitality', fetcher, {
    refreshInterval: 300_000,
  });

  return (
    <div className="min-h-screen" style={{ background: '#F5F2EE', color: '#1A1A1A' }}>
      <Header lang="fr" onLangChange={() => {}} />
      <main className="max-w-[720px] mx-auto px-6 py-8">
        <AnalystHeader
          title="Vitalité & Reprise"
          subtitle="Continuité territoriale, capacité, signaux de reprise. Observé, inféré, manquant."
          backHref="/"
          backLabel="Retour au dashboard"
        />
        <AnalystActionsBar
          focusType="search"
          query="vitalité"
          label="Vitalité & Reprise"
        />
        <div className="mt-8 space-y-8">
          <section>
            <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#888888' }}>
              Synthèse
            </div>
            <VitalitySummary />
          </section>
          <section style={{ borderTop: '1px solid #E0DCD7', paddingTop: 24 }}>
            <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#888888' }}>
              Mesuré · Proxy · Narratif
            </div>
            <VitalityIndicatorStrip />
          </section>
          <section style={{ borderTop: '1px solid #E0DCD7', paddingTop: 24 }}>
            <VitalityTrendChart />
          </section>
          <section style={{ borderTop: '1px solid #E0DCD7', paddingTop: 24 }}>
            <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#888888' }}>
              Événements continuité
            </div>
            <VitalityEvidenceList lang="fr" />
          </section>
          {data && (data.supportingPlaces?.length > 0 || data.gaps?.length > 0 || data.caveats?.length > 0 || data.coverage?.length > 0) && (
            <section
              className="p-4"
              style={{
                borderTop: '1px solid #E0DCD7',
                paddingTop: 24,
                background: '#FAFAFA',
              }}
            >
              <div className="text-[11px] uppercase tracking-[0.08em] mb-3" style={{ color: '#888888' }}>
                Couverture · Manques · Caveats
              </div>
              {data.coverage?.length > 0 && (
                <div className="text-[13px] mb-2" style={{ color: '#1A1A1A' }}>
                  Observé: {data.coverage.join(' · ')}
                </div>
              )}
              {data.supportingPlaces?.length > 0 && (
                <div className="text-[13px] mb-2" style={{ color: '#1A1A1A' }}>
                  Territoires: {data.supportingPlaces.map((p) => p.governorate ?? p.name).filter(Boolean).join(', ') || data.supportingPlaces.map((p) => p.name).join(', ')}
                </div>
              )}
              {data.gaps?.length > 0 && (
                <div className="text-[13px] mb-2" style={{ color: '#666666' }}>
                  Manques: {data.gaps.join(' · ')}
                </div>
              )}
              {data.caveats?.length > 0 && (
                <div className="text-[13px]" style={{ color: '#666666' }}>
                  Caveats: {data.caveats.join(' · ')}
                </div>
              )}
              <div className="mt-4">
                <Link
                  href="/places"
                  className="text-[11px] uppercase tracking-[0.08em] transition-colors duration-150"
                  style={{ color: '#888888' }}
                >
                  Voir vitalité par lieu →
                </Link>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
