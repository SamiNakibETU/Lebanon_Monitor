'use client';

type Language = 'fr' | 'en' | 'ar';

interface HeaderProps {
  lang?: Language;
  onLangChange?: (lang: Language) => void;
}

export function Header({
  lang = 'fr',
  onLangChange,
}: HeaderProps) {
  const handleLang = (l: Language) => {
    if (l === 'ar') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
    onLangChange?.(l);
  };

  const eetTime = new Date().toLocaleTimeString('en-GB', {
    timeZone: 'Asia/Beirut',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <header
      className="sticky top-0 z-50 w-full flex items-center justify-between min-h-12 h-12 px-4 sm:px-6 border-b"
      style={{
        background: '#000000',
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      <span
        className="font-medium"
        style={{ color: '#FFFFFF', fontSize: 13 }}
      >
        LB: LEBANON MONITOR
      </span>
      <div className="flex items-center gap-4">
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
        <span
          className="text-[11px] tabular-nums"
          style={{ color: '#666666' }}
          suppressHydrationWarning
        >
          {eetTime} EET
        </span>
      </div>
    </header>
  );
}
