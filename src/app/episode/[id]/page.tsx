'use client';

import { useParams } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { AnalystHeader } from '@/components/shared/AnalystHeader';
import { AnalystActionsBar } from '@/components/shared/AnalystActionsBar';
import { AnalystEmptyState } from '@/components/shared/AnalystEmptyState';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface EpisodeDetail {
  id: string;
  label: string | null;
  summary: string | null;
  status?: string;
  firstEventAt: string | null;
  lastEventAt: string | null;
  eventCount: number;
  eventIds: string[];
}

export default function EpisodeDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data, error, isLoading } = useSWR<EpisodeDetail>(
    id ? `/api/v2/episodes/${id}` : null,
    fetcher
  );

  if (error) {
    return (
      <div className="min-h-screen" style={{ background: '#000000', color: '#FFFFFF' }}>
        <Header lang="fr" onLangChange={() => {}} />
        <main className="max-w-[720px] mx-auto px-6 py-12">
          <AnalystHeader title="Épisode non trouvé" backHref="/episodes" backLabel="Retour aux épisodes" />
          <p style={{ color: '#666666', fontSize: 13 }}>Erreur de chargement ou épisode introuvable.</p>
        </main>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="min-h-screen" style={{ background: '#000000', color: '#FFFFFF' }}>
        <Header lang="fr" onLangChange={() => {}} />
        <main className="max-w-[720px] mx-auto px-6 py-12">
          <p style={{ color: '#666666', fontSize: 13 }}>Chargement…</p>
        </main>
      </div>
    );
  }

  const subtitle = [
    data.status === 'open' ? 'Ouvert' : null,
    `${data.eventCount} événement${data.eventCount !== 1 ? 's' : ''}`,
    data.firstEventAt && data.lastEventAt
      ? `${new Date(data.firstEventAt).toLocaleDateString('fr-FR')} → ${new Date(data.lastEventAt).toLocaleDateString('fr-FR')}`
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="min-h-screen" style={{ background: '#000000', color: '#FFFFFF' }}>
      <Header lang="fr" onLangChange={() => {}} />
      <main className="max-w-[720px] mx-auto px-6 py-8">
        <AnalystHeader
          title={data.label ?? 'Sans titre'}
          subtitle={subtitle || undefined}
          backHref="/episodes"
          backLabel="Retour aux épisodes"
        />
        {data.summary && (
          <p className="mt-2 text-[14px]" style={{ color: '#888888' }}>
            {data.summary}
          </p>
        )}
        <div className="mt-6">
          <AnalystActionsBar
            focusType="episode"
            episodeId={data.id}
            label={data.label ?? 'Sans titre'}
          />
        </div>
        {data.eventIds.length > 0 ? (
          <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="text-[11px] uppercase tracking-[0.08em] mb-3" style={{ color: '#666666' }}>
              Événements
            </div>
            <ul className="flex flex-col">
              {data.eventIds.map((eid) => (
                <li key={eid}>
                  <Link
                    href={`/event/${eid}`}
                    className="flex flex-col gap-0.5 py-3 block border-b transition-colors duration-150 hover:bg-[rgba(255,255,255,0.02)]"
                    style={{ borderColor: 'rgba(255,255,255,0.04)', color: '#FFFFFF' }}
                  >
                    <span className="text-[14px] font-normal">/event/{eid.slice(0, 8)}…</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <AnalystEmptyState message="Aucun événement lié à cet épisode." />
        )}
      </main>
    </div>
  );
}
