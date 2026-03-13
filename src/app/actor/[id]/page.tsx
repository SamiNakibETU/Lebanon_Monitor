'use client';

import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { Header } from '@/components/layout/Header';
import { AnalystHeader } from '@/components/shared/AnalystHeader';
import { AnalystActionsBar } from '@/components/shared/AnalystActionsBar';
import { AnalystEmptyState } from '@/components/shared/AnalystEmptyState';
import { ActorSummary } from '@/components/actor/ActorSummary';
import { LinkedEpisodeList } from '@/components/shared/LinkedEpisodeList';
import { RecentEventList } from '@/components/shared/RecentEventList';
import { ClaimsPanel } from '@/components/shared/ClaimsPanel';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ActorDetail {
  id: string;
  label: string;
  entityType: string | null;
  eventCount: number;
  episodeCount: number;
  claimCount: number;
  contradictionCount: number;
  sourceDiversity: number;
  roles: string[];
  recentEvents?: Array<{
    id: string;
    title: string;
    occurredAt: string;
    eventType?: string | null;
    polarity?: string | null;
  }>;
  linkedEpisodes?: Array<{
    episodeId: string;
    eventCount: number;
    episode: {
      id: string;
      label: string | null;
      status?: string;
      firstEventAt: string | null;
      lastEventAt: string | null;
    } | null;
  }>;
  topClaims?: Array<{
    id: string;
    text: string;
    claimType?: string | null;
    eventId: string;
  }>;
  topContradictions?: Array<{
    claimIdA: string;
    claimIdB: string;
    type?: string | null;
  }>;
}

export default function ActorDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data, error, isLoading } = useSWR<ActorDetail>(
    id ? `/api/v2/actors/${id}` : null,
    fetcher
  );

  if (error) {
    return (
      <div className="min-h-screen" style={{ background: '#000000', color: '#FFFFFF' }}>
        <Header lang="fr" onLangChange={() => {}} />
        <main className="max-w-[720px] mx-auto px-6 py-12">
          <AnalystHeader title="Acteur non trouvé" backHref="/actors" backLabel="Retour aux acteurs" />
          <p style={{ color: '#666666', fontSize: 13 }}>Erreur de chargement ou acteur introuvable.</p>
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

  return (
    <div className="min-h-screen" style={{ background: '#000000', color: '#FFFFFF' }}>
      <Header lang="fr" onLangChange={() => {}} />
      <main className="max-w-[720px] mx-auto px-6 py-8">
        <AnalystHeader
          title={data.label}
          subtitle={data.entityType ? `${data.entityType} · ${data.eventCount} événement${data.eventCount !== 1 ? 's' : ''}, ${data.episodeCount} épisode${data.episodeCount !== 1 ? 's' : ''}` : undefined}
          backHref="/actors"
          backLabel="Retour aux acteurs"
        />
        <ActorSummary
          label={data.label}
          entityType={data.entityType}
          roles={data.roles ?? []}
          eventCount={data.eventCount}
          episodeCount={data.episodeCount}
          claimCount={data.claimCount}
          contradictionCount={data.contradictionCount}
          sourceDiversity={data.sourceDiversity}
        />
        <div className="mt-6">
          <AnalystActionsBar
            focusType="actor"
            actorId={data.id}
            label={data.label}
          />
        </div>
        {data.recentEvents && data.recentEvents.length > 0 && (
          <div className="mt-8">
            <RecentEventList events={data.recentEvents} maxItems={15} />
          </div>
        )}
        {data.linkedEpisodes && data.linkedEpisodes.length > 0 && (
          <div className="mt-8">
            <LinkedEpisodeList episodes={data.linkedEpisodes} />
          </div>
        )}
        {(data.topClaims?.length ?? 0) > 0 || (data.topContradictions?.length ?? 0) > 0 ? (
          <div className="mt-8">
            <ClaimsPanel
              claims={data.topClaims ?? []}
              contradictions={data.topContradictions ?? []}
            />
          </div>
        ) : null}
        {(!data.recentEvents || data.recentEvents.length === 0) &&
          (!data.linkedEpisodes || data.linkedEpisodes.length === 0) &&
          (data.topClaims?.length ?? 0) === 0 && (
            <div className="mt-8">
              <AnalystEmptyState message="Aucun événement, épisode ou claim lié pour l'instant." />
            </div>
          )}
      </main>
    </div>
  );
}
