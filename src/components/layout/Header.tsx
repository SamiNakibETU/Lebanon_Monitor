'use client';

import { useEffect, useState } from 'react';

type Language = 'fr' | 'en' | 'ar';

interface HeaderProps {
  lang?: Language;
  onLangChange?: (lang: Language) => void;
}

function SourceHealthDot() {
  const [status, setStatus] = useState<'ok' | 'warn' | 'error' | null>(null);
  const [sourceCount, setSourceCount] = useState(0);

  useEffect(() => {
    const check = () => {
      fetch('/api/v2/health')
        .then((r) => r.json())
        .then((data) => {
          const sources = data.sources ?? {};
          const okCount = Object.values(sources).filter((s: unknown) => s === 'ok' || (s && typeof s === 'object' && (s as Record<string, unknown>).status === 'ok')).length;
          setSourceCount(okCount);
          if (okCount >= 10) setStatus('ok');
          else if (okCount >= 5) setStatus('warn');
          else setStatus('error');
        })
        .catch(() => setStatus('error'));
    };
    check();
    const interval = setInterval(check, 120_000);
    return () => clearInterval(interval);
  }, []);

  if (status == null) return null;

  const color = status === 'ok' ? '#43A047' : status === 'warn' ? '#FBBF24' : '#E53935';

  return (
    <span
      title={`${sourceCount} sources active`}
      className="inline-block w-2 h-2 shrink-0"
      style={{ background: color }}
    />
  );
}

function FreshnessChip() {
  const [minutesAgo, setMinutesAgo] = useState<number | null>(null);

  useEffect(() => {
    const check = () => {
      fetch('/api/v2/data-freshness')
        .then((r) => r.json())
        .then((data) => {
          const items = Array.isArray(data.items) ? data.items : [];
          if (items.length === 0) return setMinutesAgo(null);
          const latestTs = items
            .map((i: Record<string, unknown>) => {
              const v = typeof i.checkedAt === 'string' ? new Date(i.checkedAt).getTime() : 0;
              return Number.isFinite(v) ? v : 0;
            })
            .reduce((a: number, b: number) => Math.max(a, b), 0);
          if (!latestTs) return setMinutesAgo(null);
          const mins = Math.max(0, Math.round((Date.now() - latestTs) / 60000));
          setMinutesAgo(mins);
        })
        .catch(() => setMinutesAgo(null));
    };

    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="text-[10px]" style={{ color: '#666666' }}>
      {minutesAgo == null ? 'Ingestion: n/a' : `Ingestion: il y a ${minutesAgo} min`}
    </span>
  );
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
      <div className="flex items-center gap-2">
        <SourceHealthDot />
        <span
          className="font-medium"
          style={{ color: '#FFFFFF', fontSize: 13 }}
        >
          LB: LEBANON MONITOR
        </span>
        <FreshnessChip />
      </div>
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
