'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { HeroMap } from '@/components/hero/HeroMap';
import { SectionLumiereOmbre } from '@/components/sections/SectionLumiereOmbre';
import { SectionInfrastructure } from '@/components/sections/SectionInfrastructure';
import { SectionEconomie } from '@/components/sections/SectionEconomie';
import { SectionGeopolitique } from '@/components/sections/SectionGeopolitique';
import { SectionLumiere } from '@/components/sections/SectionLumiere';
import { SectionLive } from '@/components/sections/SectionLive';
import { useScrollPosition } from '@/hooks/useScrollPosition';

const LANG_STORAGE_KEY = 'lebanon-monitor-lang';
type Language = 'fr' | 'en' | 'ar';

export default function Home() {
  const { isScrolled } = useScrollPosition();
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LANG_STORAGE_KEY);
      if (stored === 'fr' || stored === 'en' || stored === 'ar') return stored;
    }
    return 'fr';
  });

  const setLang = (l: Language) => {
    setLangState(l);
    if (typeof window !== 'undefined') localStorage.setItem(LANG_STORAGE_KEY, l);
  };

  return (
    <div className="min-h-screen" style={{ background: '#000000' }}>
      <Header lang={lang} onLangChange={setLang} />
      <section
        className="relative w-full"
        style={{ height: 'calc(100vh - 48px)', minHeight: 400 }}
        aria-label="Carte du Liban"
      >
        <HeroMap minimized={isScrolled} />
      </section>
      <SectionLumiereOmbre lang={lang} />
      <SectionInfrastructure />
      <SectionEconomie />
      <SectionGeopolitique />
      <SectionLumiere />
      <SectionLive />
      <footer
        className="flex items-center justify-center gap-4 px-4 py-3 text-[10px]"
        style={{
          background: '#000000',
          color: '#666666',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <span>GDELT · ACLED · USGS · NASA · ReliefWeb · Telegram</span>
        <a
          href="https://polymarket.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[#888] transition-colors"
        >
          Polymarket
        </a>
      </footer>
    </div>
  );
}
