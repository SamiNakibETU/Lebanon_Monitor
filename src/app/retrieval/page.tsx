'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { AnalystHeader } from '@/components/shared/AnalystHeader';
import { AnalystActionsBar } from '@/components/shared/AnalystActionsBar';
import { AnalystEmptyState } from '@/components/shared/AnalystEmptyState';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface RetrievalMeta {
  query: { q?: string; placeId?: string; objectTypes?: string[]; limit?: number; offset?: number };
  generatedAt: string;
}

interface ContextPack {
  facts: string[];
  claims: string[];
  contradictions: string[];
  uncertainInferences: string[];
  missingData: string[];
  citations: string[];
}

interface RetrievalData {
  events?: Array<{ id: string; title: string; summary?: string; occurredAt?: string; sourceCount?: number }>;
  episodes?: Array<{ id: string; label?: string; summary?: string; firstEventAt?: string; lastEventAt?: string }>;
  places?: Array<{ id: string; namePrimary?: string; placeType?: string; eventCount?: number }>;
  actors?: Array<{ id: string; name?: string; entityType?: string }>;
  meta?: { totalEvents?: number; totalEpisodes?: number; totalPlaces?: number; totalActors?: number };
}

interface RetrievalResult {
  data?: RetrievalData;
  contextPack?: ContextPack;
  meta?: RetrievalMeta;
}

function RetrievalContent() {
  const searchParams = useSearchParams();
  const q = searchParams?.get('q') ?? '';
  const placeId = searchParams?.get('placeId') ?? '';
  const objectTypesParam = searchParams?.get('objectTypes') ?? 'events';
  const limit = searchParams?.get('limit') ?? '25';
  const offset = searchParams?.get('offset') ?? '0';
  const limitNum = Math.max(1, Number.parseInt(limit, 10) || 25);
  const offsetNum = Math.max(0, Number.parseInt(offset, 10) || 0);

  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (placeId) params.set('placeId', placeId);
  params.set('objectTypes', objectTypesParam);
  params.set('limit', limit);
  params.set('offset', offset);

  const apiUrl = `/api/v2/retrieval?${params.toString()}`;
  const { data, error, isLoading } = useSWR<RetrievalResult>(apiUrl, fetcher);

  const [label, setLabel] = useState<string>('');
  const [showContextPack, setShowContextPack] = useState(false);
  useEffect(() => {
    if (q) setLabel(q);
    else if (placeId) setLabel(`Lieu ${placeId.slice(0, 8)}`);
    else setLabel('Recherche ouverte');
  }, [q, placeId]);

  const events = data?.data?.events ?? [];
  const episodes = data?.data?.episodes ?? [];
  const places = data?.data?.places ?? [];
  const actors = data?.data?.actors ?? [];
  const contextPack = data?.contextPack;
  const totalEvents = data?.data?.meta?.totalEvents ?? 0;
  const hasPrevPage = offsetNum > 0;
  const hasNextPage = totalEvents > offsetNum + events.length;
  const hasAny = events.length > 0 || episodes.length > 0 || places.length > 0 || actors.length > 0;

  const focusType: 'place' | 'search' = placeId ? 'place' : 'search';
  const actionsProps = {
    focusType,
    placeId: placeId || undefined,
    query: q || undefined,
    label,
  };

  return (
    <div className="min-h-screen" style={{ background: '#000000', color: '#FFFFFF' }}>
      <Header lang="fr" onLangChange={() => {}} />
      <main className="max-w-[720px] mx-auto px-6 py-8">
        <AnalystHeader
          title="Retrieval"
          subtitle={q ? `"${q}"` : placeId ? `Lieu ${placeId.slice(0, 8)}…` : 'Exploration structurée'}
          backHref="/search"
          backLabel="Retour à la recherche"
        />
        <div className="flex flex-wrap gap-2 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <span className="text-[11px] uppercase tracking-[0.08em] mr-2" style={{ color: '#666666' }}>
            Presets
          </span>
          <Link href="/retrieval?objectTypes=events,episodes,places&limit=25" className="text-[11px] uppercase tracking-[0.08em] px-2 py-1 transition-colors duration-150 hover:text-[#FFFFFF]" style={{ color: '#666666', border: '1px solid rgba(255,255,255,0.1)' }}>
            Place brief
          </Link>
          <Link href="/retrieval?objectTypes=events,actors&limit=25" className="text-[11px] uppercase tracking-[0.08em] px-2 py-1 transition-colors duration-150 hover:text-[#FFFFFF]" style={{ color: '#666666', border: '1px solid rgba(255,255,255,0.1)' }}>
            Actor brief
          </Link>
          <Link href="/retrieval?objectTypes=events,episodes&limit=25" className="text-[11px] uppercase tracking-[0.08em] px-2 py-1 transition-colors duration-150 hover:text-[#FFFFFF]" style={{ color: '#666666', border: '1px solid rgba(255,255,255,0.1)' }}>
            Episode brief
          </Link>
          <Link href="/retrieval?q=vitalit%C3%A9&objectTypes=events,episodes,places,actors&limit=25" className="text-[11px] uppercase tracking-[0.08em] px-2 py-1 transition-colors duration-150 hover:text-[#FFFFFF]" style={{ color: '#666666', border: '1px solid rgba(255,255,255,0.1)' }}>
            Vitality brief
          </Link>
          <Link href="/retrieval?objectTypes=events,episodes,places,actors&limit=25" className="text-[11px] uppercase tracking-[0.08em] px-2 py-1 transition-colors duration-150 hover:text-[#FFFFFF]" style={{ color: '#666666', border: '1px solid rgba(255,255,255,0.1)' }}>
            Open exploration
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-4 text-[11px]" style={{ color: '#666666' }}>
          <span>Filtres actifs:</span>
          <span>types: {objectTypesParam}</span>
          <span>limit: {limitNum}</span>
          <span>offset: {offsetNum}</span>
          {q && <span>q: {q}</span>}
          {placeId && <span>place: {placeId.slice(0, 8)}…</span>}
        </div>
        <AnalystActionsBar {...actionsProps} />

        {error && (
          <AnalystEmptyState
            message="Erreur de chargement du retrieval."
            variant="dark"
          />
        )}
        {isLoading && (
          <p className="mt-8 text-[13px]" style={{ color: '#666666' }}>
            Chargement…
          </p>
        )}

        {!error && !isLoading && !hasAny && (
          <AnalystEmptyState
            message="Aucun résultat. Essayez une autre requête ou un lieu."
            variant="dark"
          />
        )}

        {!error && !isLoading && hasAny && (
          <div className="mt-8 flex flex-col gap-10">
            {events.length > 0 && (
              <section>
                <h2 className="text-[11px] uppercase tracking-[0.08em] mb-3" style={{ color: '#666666' }}>
                  Événements ({events.length})
                </h2>
                <ul className="flex flex-col">
                  {events.map((e) => (
                    <li key={e.id}>
                      <Link
                        href={`/event/${e.id}`}
                        className="flex flex-col gap-0.5 py-3 block border-b transition-colors duration-150 hover:bg-[rgba(255,255,255,0.02)]"
                        style={{ borderColor: 'rgba(255,255,255,0.04)', color: '#FFFFFF' }}
                      >
                        <span className="text-[14px] font-normal">{e.title}</span>
                        <span className="text-[11px] uppercase tracking-[0.08em]" style={{ color: '#666666' }}>
                          {e.occurredAt?.slice(0, 10)}
                          {e.sourceCount != null && e.sourceCount > 1 && ` · ${e.sourceCount} sources`}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                {(hasPrevPage || hasNextPage) && (
                  <div className="flex gap-3 mt-4 text-[12px]">
                    {hasPrevPage && (
                      <Link
                        href={`/retrieval?${new URLSearchParams({
                          q,
                          placeId,
                          objectTypes: objectTypesParam,
                          limit: String(limitNum),
                          offset: String(Math.max(0, offsetNum - limitNum)),
                        }).toString()}`}
                        className="transition-colors duration-150 hover:text-[#FFFFFF]"
                        style={{ color: '#666666' }}
                      >
                        ← Précédent
                      </Link>
                    )}
                    {hasNextPage && (
                      <Link
                        href={`/retrieval?${new URLSearchParams({
                          q,
                          placeId,
                          objectTypes: objectTypesParam,
                          limit: String(limitNum),
                          offset: String(offsetNum + limitNum),
                        }).toString()}`}
                        className="transition-colors duration-150 hover:text-[#FFFFFF]"
                        style={{ color: '#666666' }}
                      >
                        Suivant →
                      </Link>
                    )}
                  </div>
                )}
              </section>
            )}
            {episodes.length > 0 && (
              <section>
                <h2 className="text-[11px] uppercase tracking-[0.08em] mb-3" style={{ color: '#666666' }}>
                  Épisodes ({episodes.length})
                </h2>
                <ul className="flex flex-col">
                  {episodes.map((ep) => (
                    <li key={ep.id}>
                      <Link
                        href={`/episode/${ep.id}`}
                        className="flex flex-col gap-0.5 py-3 block border-b transition-colors duration-150 hover:bg-[rgba(255,255,255,0.02)]"
                        style={{ borderColor: 'rgba(255,255,255,0.04)', color: '#FFFFFF' }}
                      >
                        <span className="text-[14px] font-normal">{ep.label ?? 'Sans titre'}</span>
                        <span className="text-[11px] uppercase tracking-[0.08em]" style={{ color: '#666666' }}>
                          {ep.firstEventAt && ep.lastEventAt
                            ? `${new Date(ep.firstEventAt).toLocaleDateString('fr-FR')} → ${new Date(ep.lastEventAt).toLocaleDateString('fr-FR')}`
                            : 'Épisode'}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {places.length > 0 && (
              <section>
                <h2 className="text-[11px] uppercase tracking-[0.08em] mb-3" style={{ color: '#666666' }}>
                  Lieux ({places.length})
                </h2>
                <ul className="flex flex-col">
                  {places.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/place/${p.id}`}
                        className="flex flex-col gap-0.5 py-3 block border-b transition-colors duration-150 hover:bg-[rgba(255,255,255,0.02)]"
                        style={{ borderColor: 'rgba(255,255,255,0.04)', color: '#FFFFFF' }}
                      >
                        <span className="text-[14px] font-normal">{p.namePrimary ?? p.id}</span>
                        <span className="text-[11px] uppercase tracking-[0.08em]" style={{ color: '#666666' }}>
                          {p.eventCount ?? 0} événement(s)
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {actors.length > 0 && (
              <section>
                <h2 className="text-[11px] uppercase tracking-[0.08em] mb-3" style={{ color: '#666666' }}>
                  Acteurs ({actors.length})
                </h2>
                <ul className="flex flex-col">
                  {actors.map((a) => (
                    <li key={a.id}>
                      <Link
                        href={`/actor/${a.id}`}
                        className="flex flex-col gap-0.5 py-3 block border-b transition-colors duration-150 hover:bg-[rgba(255,255,255,0.02)]"
                        style={{ borderColor: 'rgba(255,255,255,0.04)', color: '#FFFFFF' }}
                      >
                        <span className="text-[14px] font-normal">{a.name ?? a.id}</span>
                        <span className="text-[11px] uppercase tracking-[0.08em]" style={{ color: '#666666' }}>
                          {a.entityType ?? 'acteur'}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {contextPack && (
              <section className="pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <button
                  type="button"
                  onClick={() => setShowContextPack((prev) => !prev)}
                  className="text-[11px] uppercase tracking-[0.08em] transition-colors duration-150 hover:text-[#FFFFFF]"
                  style={{ color: '#666666' }}
                >
                  {showContextPack ? 'Masquer context pack' : 'Inspecter context pack'}
                </button>
                {showContextPack && (
                  <div className="mt-3 space-y-4">
                    <div>
                      <h2 className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#666666' }}>
                        Facts ({contextPack.facts.length})
                      </h2>
                      <ul className="space-y-1 text-[12px]" style={{ color: '#888888' }}>
                        {contextPack.facts.slice(0, 8).map((item, i) => (
                          <li key={`fact-${i}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h2 className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#666666' }}>
                        Claims ({contextPack.claims.length})
                      </h2>
                      <ul className="space-y-1 text-[12px]" style={{ color: '#888888' }}>
                        {contextPack.claims.slice(0, 8).map((item, i) => (
                          <li key={`claim-${i}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h2 className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#666666' }}>
                        Citations ({contextPack.citations.length})
                      </h2>
                      <ul className="space-y-1 font-mono text-[12px]" style={{ color: '#888888' }}>
                        {contextPack.citations.slice(0, 20).map((c, i) => (
                          <li key={`citation-${i}`}>{c}</li>
                        ))}
                        {contextPack.citations.length > 20 && (
                          <li style={{ color: '#666666' }}>+{contextPack.citations.length - 20} autres</li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function RetrievalPage() {
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
      <RetrievalContent />
    </Suspense>
  );
}
