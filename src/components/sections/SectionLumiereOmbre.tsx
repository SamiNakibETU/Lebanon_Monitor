'use client';

import Link from 'next/link';
import { AISynthesis } from './AISynthesis';
import { IndicatorStrip } from './IndicatorStrip';
import { CondensedFeed } from './CondensedFeed';
import { EventTrendChart } from '@/components/charts/EventTrendChart';
import { VitalitySummary } from '@/components/vitality/VitalitySummary';
import { VitalityIndicatorStrip } from '@/components/vitality/VitalityIndicatorStrip';
import { VitalityTrendChart } from '@/components/vitality/VitalityTrendChart';
import { VitalityEvidenceList } from '@/components/vitality/VitalityEvidenceList';

type Language = 'fr' | 'en' | 'ar';

interface SectionLumiereOmbreProps {
  lang?: Language;
}

export function SectionLumiereOmbre({ lang = 'fr' }: SectionLumiereOmbreProps) {
  return (
    <section className="grid w-full grid-cols-1 md:grid-cols-2">
      <div
        className="flex flex-col p-6 sm:p-8"
        style={{ background: '#F5F2EE' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] uppercase tracking-[0.08em]" style={{ color: '#888888' }}>
            Vitalité & Reprise
          </div>
          <Link
            href="/retrieval?q=vitalité&objectTypes=events,episodes,places,actors"
            className="text-[11px] uppercase tracking-[0.08em] transition-colors duration-150"
            style={{ color: '#888888' }}
          >
            Ouvrir retrieval
          </Link>
        </div>
        <VitalitySummary />
        <div
          className="my-6"
          style={{ borderBottom: '1px solid #E0DCD7' }}
        />
        <VitalityIndicatorStrip />
        <div
          className="my-6"
          style={{ borderBottom: '1px solid #E0DCD7' }}
        />
        <VitalityTrendChart />
        <div className="my-6" style={{ borderBottom: '1px solid #E0DCD7' }} />
        <VitalityEvidenceList lang={lang} />
      </div>
      <div
        className="flex flex-col p-6 sm:p-8"
        style={{ background: '#0A0A0A' }}
      >
        <div className="text-[11px] uppercase tracking-[0.08em] mb-3" style={{ color: '#666666' }}>
          Ombre
        </div>
        <AISynthesis variant="ombre" />
        <div
          className="my-6"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
        />
        <IndicatorStrip variant="ombre" />
        <div
          className="my-6"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
        />
        <EventTrendChart variant="dark" focus="ombre" />
        <div className="my-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }} />
        <CondensedFeed variant="ombre" lang={lang} />
      </div>
    </section>
  );
}
