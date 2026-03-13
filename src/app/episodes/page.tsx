'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { AnalystHeader } from '@/components/shared/AnalystHeader';
import { AnalystEmptyState } from '@/components/shared/AnalystEmptyState';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface EpisodeItem {
  id: string;
  label: string | null;
  summary: string | null;
  status?: string;
  firstEventAt: string | null;
  lastEventAt: string | null;
  eventCount: number;
}

export default function EpisodesPage() {
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);
  const { data, error, isLoading } = useSWR<{ items: EpisodeItem[]; total: number }>(
    `/api/v2/episodes?limit=${limit}&offset=${offset}`,
    fetcher
  );

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="min-h-screen" style={{ background: '#000000' }}>
      <Header lang="fr" onLangChange={() => {}} />
      <main className="max-w-[720px] mx-auto px-6 py-8">
        <AnalystHeader
          title="Épisodes"
          subtitle="Clusters analytiques — événements regroupés par type, lieu et temporalité."
          backHref="/"
          backLabel="Retour au dashboard"
        />
        {error && (
          <AnalystEmptyState message="Erreur de chargement." />
        )}
        {isLoading && (
          <p className="mt-6 text-[13px]" style={{ color: '#666666' }}>
            Chargement…
          </p>
        )}
        {!error && !isLoading && items.length === 0 && (
          <AnalystEmptyState message="Aucun épisode disponible." />
        )}
        {!error && !isLoading && items.length > 0 && (
          <div className="flex flex-col mt-8">
            {items.map((ep) => (
              <Link
                key={ep.id}
                href={`/episode/${ep.id}`}
                className="flex flex-col gap-1 py-4 transition-colors block no-underline border-b hover:bg-[rgba(255,255,255,0.02)]"
                style={{ borderColor: 'rgba(255,255,255,0.04)' }}
              >
                <div
                  className="flex items-center gap-2 flex-wrap text-[11px] uppercase tracking-[0.08em]"
                  style={{ color: '#666666' }}
                >
                  {ep.status === 'open' && <span>Ouvert</span>}
                  <span className="tabular-nums">{ep.eventCount} événement{ep.eventCount !== 1 ? 's' : ''}</span>
                  {ep.firstEventAt && ep.lastEventAt && (
                    <span>
                      {new Date(ep.firstEventAt).toLocaleDateString('fr-FR')} →{' '}
                      {new Date(ep.lastEventAt).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </div>
                <div className="text-[14px] font-normal leading-snug" style={{ color: '#FFFFFF' }}>
                  {ep.label ?? 'Sans titre'}
                </div>
              </Link>
            ))}
            {total > limit && (
              <div className="flex gap-4 mt-6" style={{ color: '#666666', fontSize: 13 }}>
                {offset > 0 && (
                  <button
                    type="button"
                    onClick={() => setOffset((o) => Math.max(0, o - limit))}
                    className="transition-colors duration-150 hover:text-[#FFFFFF]"
                  >
                    ← Précédent
                  </button>
                )}
                {offset + items.length < total && (
                  <button
                    type="button"
                    onClick={() => setOffset((o) => o + limit)}
                    className="transition-colors duration-150 hover:text-[#FFFFFF]"
                  >
                    Suivant →
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
