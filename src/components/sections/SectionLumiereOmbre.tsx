'use client';

import { AISynthesis } from './AISynthesis';
import { IndicatorStrip } from './IndicatorStrip';
import { CondensedFeed } from './CondensedFeed';
import { EventTrendChart } from '@/components/charts/EventTrendChart';

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
        <div className="text-[11px] uppercase tracking-[0.08em] mb-3" style={{ color: '#888888' }}>
          Lumière
        </div>
        <AISynthesis variant="lumiere" />
        <div
          className="my-6"
          style={{ borderBottom: '1px solid #E0DCD7' }}
        />
        <IndicatorStrip variant="lumiere" />
        <div
          className="my-6"
          style={{ borderBottom: '1px solid #E0DCD7' }}
        />
        <EventTrendChart variant="light" />
        <div className="my-6" style={{ borderBottom: '1px solid #E0DCD7' }} />
        <CondensedFeed variant="lumiere" lang={lang} />
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
        <EventTrendChart variant="dark" />
        <div className="my-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }} />
        <CondensedFeed variant="ombre" lang={lang} />
      </div>
    </section>
  );
}
