'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { CATEGORY_LABELS } from '@/lib/labels';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const LANG_STORAGE_KEY = 'lebanon-monitor-lang';
type Language = 'fr' | 'en' | 'ar';

function getInitialLang(searchParams: URLSearchParams | null): Language {
  const fromUrl = searchParams?.get('lang');
  if (fromUrl === 'fr' || fromUrl === 'en' || fromUrl === 'ar') return fromUrl;
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored === 'fr' || stored === 'en' || stored === 'ar') return stored;
  }
  return 'fr';
}

function getCategoryLabel(code: string): string {
  return (CATEGORY_LABELS as Record<string, string>)[code] ?? code.replace(/_/g, ' ');
}

interface SearchEvent {
  id: string;
  title: string;
  summary?: string | null;
  classification: string;
  category?: string | null;
  occurredAt: string;
  source?: string | null;
  sourceCount?: number;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams?.get('q') ?? '';
  const [lang, setLang] = useState<Language>('fr');

  useEffect(() => {
    setLang(getInitialLang(searchParams));
  }, [searchParams]);

  const handleLangChange = useCallback((l: Language) => {
    setLang(l);
    if (typeof window !== 'undefined') localStorage.setItem(LANG_STORAGE_KEY, l);
  }, []);

  const searchUrl = q ? `/api/v2/search?q=${encodeURIComponent(q)}&lang=${lang}&limit=50` : null;
  const { data, error, isLoading } = useSWR<{ data: SearchEvent[]; meta: { total: number } }>(
    searchUrl,
    fetcher
  );

  const events = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  return (
    <div className="min-h-screen" style={{ background: '#000000' }}>
      <Header
        lang={lang}
        onLangChange={handleLangChange}
        eventCount={total}
      />
      <main className="max-w-[720px] mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-[24px] font-light" style={{ color: '#FFFFFF' }}>
            Recherche
          </h1>
          {q && (
            <p className="text-[13px] mt-1" style={{ color: '#666666' }}>
              &quot;{q}&quot; — {total} résultat{total !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {!q ? (
          <p style={{ color: '#666666', fontSize: 13 }}>
            Entrez un terme dans la barre de recherche du header et appuyez sur Entrée.
          </p>
        ) : error ? (
          <p style={{ color: '#666666', fontSize: 13 }}>Erreur de chargement.</p>
        ) : isLoading ? (
          <p style={{ color: '#666666', fontSize: 13 }}>Chargement…</p>
        ) : events.length === 0 ? (
          <p style={{ color: '#666666', fontSize: 13 }}>Aucun résultat.</p>
        ) : (
          <div className="flex flex-col">
            {events.map((e) => {
              const isLumiere = e.classification === 'lumiere';
              const dotColor = isLumiere ? '#2E7D32' : '#C62828';
              const borderColor = isLumiere ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)';
              const textColor = isLumiere ? '#1A1A1A' : '#FFFFFF';
              const metaColor = isLumiere ? '#888888' : '#666666';
              const time = new Date(e.occurredAt);
              const rel =
                time > new Date(Date.now() - 60 * 60 * 1000)
                  ? `${Math.round((Date.now() - time.getTime()) / 60000)} min ago`
                  : time.toLocaleDateString();

              return (
                <Link
                  key={e.id}
                  href={`/event/${e.id}?lang=${lang}`}
                  className="flex gap-3 py-4 transition-colors block no-underline border-b"
                  style={{ borderColor }}
                >
                  <span
                    className="inline-block shrink-0 rounded-full"
                    style={{ width: 6, height: 6, background: dotColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <div
                      className="flex items-center gap-2 flex-wrap text-[11px] mb-1.5 uppercase tracking-[0.08em]"
                      style={{ color: metaColor }}
                    >
                      {e.category && (
                        <>
                          <span>{getCategoryLabel(e.category)}</span>
                          <span>·</span>
                        </>
                      )}
                      {e.source && <span>{e.source}</span>}
                      {e.sourceCount != null && e.sourceCount > 1 && (
                        <span className="tabular-nums">{e.sourceCount} sources</span>
                      )}
                      <span className="ml-auto" suppressHydrationWarning>
                        {rel}
                      </span>
                    </div>
                    <div className="text-[14px] font-normal leading-snug" style={{ color: textColor }}>
                      {e.title}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: '#000000', color: '#666666', fontSize: 13 }}
        >
          Chargement…
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
