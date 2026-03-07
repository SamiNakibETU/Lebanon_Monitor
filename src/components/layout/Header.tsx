'use client';

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

  const modeLabels: Record<SplitMode, string> = {
    split: '◐',
    lumiere: '☀️',
    ombre: '🌙',
    twothirds: '⅔',
  };

  return (
    <header
      className="sticky top-0 z-50 w-full flex items-center justify-between h-12 px-6 border-b"
      style={{
        background: '#0A0A0A',
        borderColor: 'rgba(255,255,255,0.06)',
        fontSize: 13,
      }}
    >
      <div className="flex items-center gap-6">
        <span className="font-medium tracking-[0.02em]" style={{ color: '#FFFFFF', fontSize: 13 }}>
          LB · LEBANON MONITOR
        </span>
        {onSplitModeChange && (
          <div className="flex gap-0 border-l border-r pl-4 pr-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            {(['split', 'lumiere', 'ombre', 'twothirds'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onSplitModeChange(m)}
                title={m === 'split' ? 'Split 50/50' : m === 'lumiere' ? 'Lumière plein écran' : m === 'ombre' ? 'Ombre plein écran' : '2/3 - 1/3'}
                className="px-2 py-1 text-[14px] transition-opacity duration-150"
                style={{
                  opacity: splitMode === m ? 1 : 0.5,
                }}
              >
                {modeLabels[m]}
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
              className="px-2.5 py-1 text-[11px] tracking-[0.04em] transition-colors duration-150"
              style={{
                color: lang === l ? '#FFFFFF' : '#666666',
              }}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-6 text-[11px] tabular-nums" style={{ color: '#666666' }} suppressHydrationWarning>
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
