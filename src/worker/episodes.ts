/**
 * Worker episodes — group events into analytic episodes by type, place, and time.
 * Distinct from event_cluster (Jaccard title similarity).
 */

import { withClient } from '@/db/client';
import {
  getRecentUnepisodedEvents,
  updateEventPrimaryEpisode,
} from '@/db/repositories/event-repository';
import {
  createEpisode,
  linkEventToEpisode,
  getEpisodeEventIds,
  updateEpisodeTimes,
  listEpisodes,
  getEpisodeById,
  closeStaleEpisodes,
} from '@/db/repositories/episode-repository';
import {
  chooseEpisodeForEvent,
  getPlaceKey,
  placeToGovernorate,
  type EpisodeCandidate,
} from '@/core/episodes/choose-episode-for-event';
import type { EventRow } from '@/db/types';
import { logger } from '@/lib/logger';

export async function runEpisodes(): Promise<{
  episodesCreated: number;
  eventsLinked: number;
}> {
  const since = new Date();
  since.setDate(since.getDate() - 14);
  const openCutoff = new Date();
  openCutoff.setTime(openCutoff.getTime() - 48 * 60 * 60 * 1000); // 48h

  const events = await withClient((client) =>
    getRecentUnepisodedEvents(client, since, 500)
  );

  if (events.length === 0) {
    return { episodesCreated: 0, eventsLinked: 0 };
  }

  const closedCount = await withClient((client) => closeStaleEpisodes(client, openCutoff));
  if (closedCount > 0) {
    logger.info('Episodes closed (stale)', { count: closedCount });
  }

  const { episodes: existingEpisodes } = await withClient((client) =>
    listEpisodes(client, { limit: 500, fromDate: since, openOnly: true })
  );

  const candidates: EpisodeCandidate[] = [];
  for (const ep of existingEpisodes) {
    const lastAt = ep.last_event_at;
    if (!lastAt) continue;
    const meta = (ep.metadata ?? {}) as { eventType?: string; placeKey?: string; governorateKey?: string };
    candidates.push({
      id: ep.id,
      eventType: meta.eventType ?? null,
      placeKey: meta.placeKey ?? 'unknown',
      governorateKey: meta.governorateKey,
      lastEventAt: lastAt,
    });
  }

  let episodesCreated = 0;
  let eventsLinked = 0;
  const episodeCache = new Map<string, EpisodeCandidate>();

  for (const ev of events) {
    const eventForLinking = toEventForLinking(ev);
    const matched = chooseEpisodeForEvent(eventForLinking, candidates);

    if (matched) {
      await withClient(async (client) => {
        const ep = await getEpisodeById(client, matched.id);
        await linkEventToEpisode(client, matched.id, ev.id);
        const ids = await getEpisodeEventIds(client, matched.id);
        const firstAt = ep?.first_event_at
          ? (ev.occurred_at < ep.first_event_at ? ev.occurred_at : ep.first_event_at)
          : ev.occurred_at;
        const lastAt = ep?.last_event_at
          ? (ev.occurred_at > ep.last_event_at ? ev.occurred_at : ep.last_event_at)
          : ev.occurred_at;
        await updateEpisodeTimes(client, matched.id, firstAt, lastAt, ids.length);
        await updateEventPrimaryEpisode(client, ev.id, matched.id);
      });
      const c = candidates.find((x) => x.id === matched!.id);
      if (c) c.lastEventAt = new Date(Math.max(c.lastEventAt.getTime(), ev.occurred_at.getTime()));
      eventsLinked++;
    } else {
      const placeKey = getPlaceKey(eventForLinking);
      const governorateKey = eventForLinking.metadata?.admin1 ?? placeToGovernorate(placeKey);
      const episode = await withClient(async (client) => {
        const ep = await createEpisode(client, {
          label: ev.canonical_title?.slice(0, 100) ?? 'Episode',
          first_event_at: ev.occurred_at,
          last_event_at: ev.occurred_at,
          event_count: 1,
          metadata: { eventType: ev.event_type, placeKey, governorateKey: governorateKey ?? undefined },
        });
        await linkEventToEpisode(client, ep.id, ev.id);
        await updateEventPrimaryEpisode(client, ev.id, ep.id);
        return ep;
      });
      candidates.push({
        id: episode.id,
        eventType: ev.event_type ?? null,
        placeKey,
        governorateKey: governorateKey ?? undefined,
        lastEventAt: episode.last_event_at ?? ev.occurred_at,
      });
      episodesCreated++;
      eventsLinked++;
    }
  }

  logger.info('Episodes run complete', { episodesCreated, eventsLinked });
  return { episodesCreated, eventsLinked };
}

function toEventForLinking(ev: EventRow): {
  id: string;
  eventType: string | null;
  occurredAt: Date;
  metadata?: {
    resolvedPlaceName?: string | null;
    admin1?: string | null;
    latitude?: number;
    longitude?: number;
  } | null;
} {
  const meta = (ev.metadata ?? {}) as Record<string, unknown>;
  const lat = meta.latitude as number | undefined;
  const lng = meta.longitude as number | undefined;
  return {
    id: ev.id,
    eventType: ev.event_type ?? null,
    occurredAt: ev.occurred_at,
    metadata: {
      resolvedPlaceName: (meta.resolvedPlaceName as string | null) ?? null,
      admin1: (meta.admin1 as string | null) ?? null,
      latitude: typeof lat === 'number' ? lat : undefined,
      longitude: typeof lng === 'number' ? lng : undefined,
    },
  };
}
