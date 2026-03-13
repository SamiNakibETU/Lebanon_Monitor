'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { EpisodeBadge } from '@/components/EpisodeBadge';
import { AnalystHeader } from '@/components/shared/AnalystHeader';
import { AnalystActionsBar } from '@/components/shared/AnalystActionsBar';
import { AnalystEmptyState } from '@/components/shared/AnalystEmptyState';

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

interface EventDetail {
  id: string;
  placeId?: string | null;
  title: string;
  summary?: string | null;
  classification: string;
  confidence: number;
  category?: string | null;
  severity: string;
  occurredAt: string;
  latitude?: number | null;
  longitude?: number | null;
  sources?: string[];
  verification_status?: 'unverified' | 'partially_verified' | 'verified' | 'disputed';
  sourceCount?: number;
  sourceTier?: 'T1' | 'T2' | 'T3' | null;
  translations?: Record<string, string>;
  episode?: { id: string; label: string | null; status?: string; eventCount: number } | null;
  entities?: Array<{ id: string; name: string; entity_type?: string | null; role?: string | null }>;
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params?.id as string;

  const [lang, setLang] = useState<Language>('fr');
  useEffect(() => {
    setLang(getInitialLang(searchParams));
  }, [searchParams]);

  const handleLangChange = useCallback((l: Language) => {
    setLang(l);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANG_STORAGE_KEY, l);
    }
    router.replace(`/event/${id}?lang=${l}`, { scroll: false });
  }, [id, router]);

  const { data, error } = useSWR<EventDetail>(
    id ? `/api/v2/events/${id}?lang=${lang}` : null,
    fetcher
  );

  if (error) {
    return (
      <div className="min-h-screen" style={{ background: '#000', color: '#FFF' }}>
        <Header lang={lang} onLangChange={handleLangChange} />
        <div className="max-w-[720px] mx-auto px-6 py-12">
          <p style={{ color: '#666' }}>Erreur de chargement.</p>
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-4 text-[13px] transition-colors duration-150"
            style={{ color: '#666' }}
          >
            ← Retour
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen" style={{ background: '#000', color: '#FFF' }}>
        <Header lang={lang} onLangChange={handleLangChange} />
        <div className="max-w-[720px] mx-auto px-6 py-12">
          <p style={{ color: '#666' }}>Chargement…</p>
        </div>
      </div>
    );
  }

  const dotColor = data.classification === 'ombre' ? '#E53935' : data.classification === 'lumiere' ? '#43A047' : '#666666';
  const actionFocusType: 'place' | 'search' = data.placeId ? 'place' : 'search';

  return (
    <div className="min-h-screen" style={{ background: '#000', color: '#FFF' }}>
      <Header lang={lang} onLangChange={handleLangChange} />
      <div className="max-w-[720px] mx-auto px-6 py-8">
        <AnalystHeader
          title={data.title}
          subtitle={`${data.category ?? data.classification} · ${new Date(data.occurredAt).toLocaleDateString('fr-FR')}`}
          backHref="/"
          backLabel="Retour au dashboard"
        />
        <AnalystActionsBar
          focusType={actionFocusType}
          placeId={data.placeId ?? undefined}
          query={data.title}
          label={data.title}
        />

        <div className="mt-6">
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <span
              className="inline-block shrink-0 rounded-full"
              style={{ width: 6, height: 6, background: dotColor }}
            />
            <span className="text-[11px] uppercase tracking-[0.04em]" style={{ color: '#666' }}>
              {data.category ?? data.classification} · {data.severity}
            </span>
            {data.verification_status && data.verification_status !== 'unverified' && (
              <span
                className="text-[10px] uppercase px-1.5 py-0.5"
                style={{
                  color: data.verification_status === 'verified' ? '#43A047' : data.verification_status === 'partially_verified' ? '#FF9800' : '#666',
                  background: data.verification_status === 'verified' ? 'rgba(67,160,71,0.15)' : data.verification_status === 'partially_verified' ? 'rgba(255,152,0,0.15)' : 'transparent',
                }}
              >
                {data.verification_status === 'verified' ? 'Vérifié' : data.verification_status === 'partially_verified' ? 'Partiellement vérifié' : ''}
              </span>
            )}
            {data.sourceCount != null && data.sourceCount > 1 && (
              <span className="text-[11px]" style={{ color: '#666' }}>
                · Confirmé par {data.sourceCount} sources
              </span>
            )}
            {data.episode && (
              <EpisodeBadge
                id={data.episode.id}
                label={data.episode.label}
                eventCount={data.episode.eventCount}
                status={data.episode.status as 'open' | 'closed' | undefined}
              />
            )}
            {data.sources && data.sources.length > 0 && (
              <span className="text-[11px] flex items-center gap-1" style={{ color: '#666' }}>
                · {data.sources.join(', ')}
                {data.sourceTier && (
                  <span
                    className="inline-flex items-center px-1 rounded text-[9px]"
                    style={{ background: 'rgba(255,255,255,0.08)', color: '#999' }}
                    title={data.sourceTier === 'T1' ? 'Source fiable' : data.sourceTier === 'T2' ? 'Source moyenne' : 'Source faible'}
                  >
                    {data.sourceTier}
                  </span>
                )}
              </span>
            )}
          </div>

          <p className="mt-2 text-[13px]" style={{ color: '#666' }} suppressHydrationWarning>
            {new Date(data.occurredAt).toLocaleString('fr-FR', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </p>

          {data.summary && (
            <p className="mt-6 text-[14px] leading-relaxed" style={{ color: '#FFF' }}>
              {data.summary}
            </p>
          )}

          {(data.placeId || (data.entities && data.entities.length > 0)) && (
            <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-[11px] uppercase tracking-[0.08em] mb-3" style={{ color: '#666' }}>
                Explorer
              </div>
              <div className="flex flex-wrap gap-3">
                {data.placeId && (
                  <Link
                    href={`/place/${data.placeId}`}
                    className="text-[13px] transition-colors duration-150 hover:text-[#FFF]"
                    style={{ color: '#666' }}
                  >
                    Lieu →
                  </Link>
                )}
                {data.entities?.map((ent) => (
                  <Link
                    key={ent.id}
                    href={`/actor/${ent.id}`}
                    className="text-[13px] transition-colors duration-150 hover:text-[#FFF]"
                    style={{ color: '#666' }}
                  >
                    {ent.name} {ent.role && `(${ent.role})`} →
                  </Link>
                ))}
              </div>
            </div>
          )}
          {!data.placeId && (!data.entities || data.entities.length === 0) && (
            <AnalystEmptyState message="Aucun pivot lieu/acteur disponible pour cet événement." />
          )}

          {data.translations && Object.keys(data.translations).length > 1 && (
            <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-[11px] uppercase tracking-[0.08em] mb-3" style={{ color: '#666' }}>
                Traductions
              </div>
              <div className="flex flex-col gap-2">
                {Object.entries(data.translations).map(([lang, title]) => (
                  <div key={lang}>
                    <span className="text-[10px] uppercase" style={{ color: '#666' }}>
                      {lang}
                    </span>
                    <p className="text-[13px] mt-0.5" style={{ color: '#FFF' }}>
                      {title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
