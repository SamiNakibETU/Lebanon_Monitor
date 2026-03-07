'use client';

import { useRouter } from 'next/navigation';
import type { SplitMode } from './SplitContainer';

type Language = 'fr' | 'en' | 'ar';

interface HeaderProps {
  lang?: Language;
  onLangChange?: (lang: Language) => void;
  splitMode?: SplitMode;
  onSplitModeChange?: (mode: SplitMode) => void;
  lbp?: number | null;
  weatherBeirut?: string | null;
  aqi?: number | null;
  eventCount?: number;
}

export function Header({
  lang = 'fr',
  onLangChange,
  splitMode = 'split',
  onSplitModeChange,
  lbp = null,
  weatherBeirut = null,
  aqi = null,
  eventCount = 0,
}: HeaderProps) {
  const handleLang = (l: Language) => {
    if (l === 'ar') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
    onLangChange?.(l);
  };

  const now = new Date();
  const eetTime = now.toLocaleTimeString('fr-FR', {
    timeZone: 'Asia/Beirut',
    hour: '2-digit',
    minute: '2-digit',
  });

  const router = useRouter();

  const handleSearch = (value: string) => {
    const q = value.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const modeConfig: Record<SplitMode, { icon: string; label: string }> = {
    split: { icon: '◐', label: 'Split' },
    lumiere: { icon: '☀', label: 'Lumière' },
    ombre: { icon: '☽', label: 'Ombre' },
    twothirds: { icon: '⅔', label: '2/3' },
  };

  return (
    <header
      className="sticky top-0 z-50 w-full flex items-center justify-between gap-2 min-h-12 h-12 px-4 sm:px-6 border-b overflow-x-auto overflow-y-hidden"
      style={{
        background: '#0A0A0A',
        borderColor: 'rgba(255,255,255,0.06)',
        fontSize: 13,
      }}
    >
      <div className="flex items-center gap-4 sm:gap-6 shrink-0">
        <span className="font-medium tracking-[0.02em]" style={{ color: '#FFFFFF', fontSize: 13 }}>
          LB · LEBANON MONITOR
        </span>
        <input
          type="search"
          placeholder="Rechercher..."
          className="bg-transparent border rounded px-3 py-1 text-[12px] w-36 sm:w-40 focus:w-56 transition-all focus:outline-none focus:ring-1"
          style={{ borderColor: 'rgba(255,255,255,0.2)', color: '#FFF' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch(e.currentTarget.value);
          }}
        />
        {onSplitModeChange && (
          <div className="flex gap-1 border-l border-r pl-4 pr-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            {(['split', 'lumiere', 'ombre', 'twothirds'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onSplitModeChange(m)}
                title={m === 'split' ? 'Split 50/50' : m === 'lumiere' ? 'Lumière plein écran' : m === 'ombre' ? 'Ombre plein écran' : '2/3 - 1/3'}
                className="px-3 py-1.5 text-[12px] font-medium transition-opacity duration-150 cursor-pointer hover:opacity-100 flex items-center gap-1.5"
                style={{
                  opacity: splitMode === m ? 1 : 0.5,
                  color: splitMode === m ? '#FFFFFF' : '#999999',
                }}
              >
                <span style={{ fontSize: 16 }}>{modeConfig[m].icon}</span>
                <span className="hidden sm:inline">{modeConfig[m].label}</span>
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-0">
          {(['fr', 'en', 'ar'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => handleLang(l)}
              className="px-2.5 py-1 text-[11px] tracking-[0.04em] transition-colors duration-150 cursor-pointer"
              style={{
                color: lang === l ? '#FFFFFF' : '#666666',
              }}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-6 text-[11px] tabular-nums shrink-0" style={{ color: '#666666' }} suppressHydrationWarning>
        {lbp != null && (
          <span suppressHydrationWarning>
            LBP {lbp.toLocaleString()} ↓
          </span>
        )}
        {weatherBeirut && (
          <span suppressHydrationWarning>
            Beyrouth {weatherBeirut}
          </span>
        )}
        {aqi != null && (
          <span className="flex items-center gap-1" suppressHydrationWarning>
            AQI {aqi}{' '}
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{
                background: aqi <= 50 ? '#43A047' : aqi <= 100 ? '#FBBF24' : '#E53935',
              }}
            />
          </span>
        )}
        <span suppressHydrationWarning>{eventCount} events</span>
        <span suppressHydrationWarning>{eetTime} EET</span>
      </div>
    </header>
  );
}
