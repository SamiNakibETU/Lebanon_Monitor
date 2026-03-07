'use client';

type Language = 'fr' | 'en' | 'ar';

interface HeaderProps {
  lang?: Language;
  onLangChange?: (lang: Language) => void;
  lbp?: number | null;
  weatherBeirut?: string | null;
  aqi?: number | null;
  eventCount?: number;
}

export function Header({
  lang = 'fr',
  onLangChange,
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

  return (
    <header
      className="sticky top-0 z-50 w-full border-b backdrop-blur-xl"
      style={{
        background: 'rgba(10, 10, 10, 0.8)',
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-4">
          <span className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            🇱🇧 LEBANON MONITOR
          </span>
          <div className="flex items-center gap-1">
            {(['fr', 'en', 'ar'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => handleLang(l)}
                className="px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors"
                style={{
                  background: lang === l ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: lang === l ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px]" style={{ color: 'var(--text-secondary)' }} suppressHydrationWarning>
          {lbp != null && (
            <span className="tabular-nums" suppressHydrationWarning>
              LBP {lbp.toLocaleString()} <span className="text-[10px]">↓</span>
            </span>
          )}
          {weatherBeirut && (
            <span suppressHydrationWarning>
              Beyrouth {weatherBeirut}
            </span>
          )}
          {aqi != null && (
            <span suppressHydrationWarning>
              AQI {aqi}{' '}
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{
                  background: aqi <= 50 ? '#4ADE80' : aqi <= 100 ? '#FBBF24' : '#F87171',
                }}
              />
            </span>
          )}
          <span className="tabular-nums" suppressHydrationWarning>{eventCount} events</span>
          <span suppressHydrationWarning>{eetTime} EET</span>
        </div>
      </div>
    </header>
  );
}
