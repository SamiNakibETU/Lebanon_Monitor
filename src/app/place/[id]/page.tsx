'use client';

import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { Header } from '@/components/layout/Header';
import { AnalystHeader } from '@/components/shared/AnalystHeader';
import { EvidenceSummary } from '@/components/shared/EvidenceSummary';
import { LinkedEpisodeList } from '@/components/shared/LinkedEpisodeList';
import { RecentEventList } from '@/components/shared/RecentEventList';
import { PlaceMap } from '@/components/place/PlaceMap';
import { PlaceVitalityBlock } from '@/components/place/PlaceVitalityBlock';
import { AnalystActionsBar } from '@/components/shared/AnalystActionsBar';
import { AnalystEmptyState } from '@/components/shared/AnalystEmptyState';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface PlaceDetail {
  id: string;
  label: string;
  namePrimary: string;
  placeType: string | null;
  eventCount: number;
  episodeCount: number;
  sourceDiversity: number;
  evidenceNote?: 'relational' | 'metadata_only' | 'mixed';
  mapBlock?: { centroid: { lat: number; lng: number } | null };
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
}

export default function PlaceDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data, error, isLoading } = useSWR<PlaceDetail>(
    id ? `/api/v2/places/${id}` : null,
    fetcher
  );

  if (error) {
    return (
      <div className="min-h-screen" style={{ background: '#000000', color: '#FFFFFF' }}>
        <Header lang="fr" onLangChange={() => {}} />
        <main className="max-w-[720px] mx-auto px-6 py-12">
          <AnalystHeader title="Lieu non trouvé" backHref="/places" backLabel="Retour aux lieux" />
          <p style={{ color: '#666666', fontSize: 13 }}>Erreur de chargement ou lieu introuvable.</p>
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

  const centroid = data.mapBlock?.centroid ?? null;

  return (
    <div className="min-h-screen" style={{ background: '#000000', color: '#FFFFFF' }}>
      <Header lang="fr" onLangChange={() => {}} />
      <main className="max-w-[720px] mx-auto px-6 py-8">
        <AnalystHeader
          title={data.label}
          subtitle={data.placeType ? `${data.placeType} · ${data.eventCount} événement${data.eventCount !== 1 ? 's' : ''}, ${data.episodeCount} épisode${data.episodeCount !== 1 ? 's' : ''}` : undefined}
          backHref="/places"
          backLabel="Retour aux lieux"
        />
        <EvidenceSummary
          sourceDiversity={data.sourceDiversity}
          eventCount={data.eventCount}
          evidenceNote={data.evidenceNote}
        />
        <div className="mt-6">
          <AnalystActionsBar
            focusType="place"
            placeId={data.id}
            label={data.label}
          />
        </div>
        <div className="mt-8">
          <PlaceMap centroid={centroid} placeLabel={data.label} height={220} />
        </div>
        <PlaceVitalityBlock placeId={data.id} />
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
        {(!data.recentEvents || data.recentEvents.length === 0) &&
          (!data.linkedEpisodes || data.linkedEpisodes.length === 0) && (
            <div className="mt-8">
              <AnalystEmptyState
                message="Aucun événement ni épisode lié pour l'instant. Les données place_id sont en cours de backfill."
              />
            </div>
          )}
      </main>
    </div>
  );
}
