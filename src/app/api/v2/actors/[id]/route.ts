/**
 * API v2 actor by ID — detail for acteur/entity analyst page.
 * Phase 6 — identity, evidence, linked events/episodes, claims, contradictions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withClient, isDbConfigured } from '@/db/client';
import {
  getEntityById,
  getEventsByEntity,
  getEpisodesByEntity,
} from '@/db/repositories/entity-repository';
import { getEventsByIds } from '@/db/repositories/event-repository';
import { getEpisodeById } from '@/db/repositories/episode-repository';
import { getClaimsByEventId } from '@/db/repositories/claim-repository';
import { getContradictionsByEventId } from '@/db/repositories/claim-contradiction-repository';
import { getSourceDiversityForEventIds } from '@/db/repositories/event-observation-repository';
import { buildActorReadModel } from '@/lib/read-models/actor';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured', code: 500 },
      { status: 500 }
    );
  }

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid actor ID format' }, { status: 400 });
  }

  try {
    const entity = await withClient((client) => getEntityById(client, id));
    if (!entity) {
      return NextResponse.json({ error: 'Actor not found', code: 404 }, { status: 404 });
    }

    const data = await withClient(async (client) => {
      const { eventIds, total: eventTotal } = await getEventsByEntity(client, id, {
        limit: 30,
        offset: 0,
      });
      const episodes = await getEpisodesByEntity(client, id, { limit: 10 });
      const sourceDiversity =
        eventIds.length > 0
          ? await getSourceDiversityForEventIds(client, eventIds)
          : 0;

      const roleRes = await client.query<{ role: string | null; count: string }>(
        `SELECT ee.role, COUNT(*)::int as count
         FROM event_entity ee
         WHERE ee.entity_id = $1
         GROUP BY ee.role`,
        [id]
      );

      let claimCount = 0;
      let contradictionCount = 0;
      if (eventIds.length > 0) {
        const claimRes = await client.query<{ count: string }>(
          `SELECT COUNT(*)::int as count FROM claim WHERE event_id = ANY($1::uuid[])`,
          [eventIds]
        );
        claimCount = parseInt(claimRes.rows[0]?.count ?? '0', 10);

        const ccRes = await client.query<{ count: string }>(
          `SELECT COUNT(*)::int as count
           FROM claim_contradiction cc
           JOIN claim ca ON ca.id = cc.claim_id_a
           JOIN claim cb ON cb.id = cc.claim_id_b
           WHERE ca.event_id = ANY($1::uuid[]) AND cb.event_id = ANY($1::uuid[])`,
          [eventIds]
        );
        contradictionCount = parseInt(ccRes.rows[0]?.count ?? '0', 10);
      }

      const episodeTotal = episodes.length;
      const episodeDetails = await Promise.all(
        episodes.map((ep) => getEpisodeById(client, ep.episodeId))
      );

      const events = eventIds.length > 0 ? await getEventsByIds(client, eventIds) : [];
      const claimsByEvent = await Promise.all(
        eventIds.slice(0, 5).map((eid) => getClaimsByEventId(client, eid))
      );
      const contradictionsByEvent = await Promise.all(
        eventIds.slice(0, 5).map((eid) => getContradictionsByEventId(client, eid))
      );

      const readModel = buildActorReadModel(entity, {
        eventCount: eventTotal,
        episodeCount: episodeTotal,
        claimCount,
        contradictionCount,
        sourceDiversity,
        roleAggregations: roleRes.rows.map((r) => ({
          role: r.role,
          count: parseInt(r.count, 10) || 0,
        })),
      });

      return {
        ...readModel,
        recentEvents: events.map((e) => ({
          id: e.id,
          title: e.canonical_title,
          occurredAt: e.occurred_at,
          eventType: e.event_type,
          polarity: e.polarity_ui,
        })),
        linkedEpisodes: episodes.map((ep, i) => ({
          episodeId: ep.episodeId,
          eventCount: ep.eventCount,
          episode: episodeDetails[i]
            ? {
                id: episodeDetails[i]!.id,
                label: episodeDetails[i]!.label,
                status: (episodeDetails[i] as { status?: string })?.status ?? 'open',
                firstEventAt: episodeDetails[i]!.first_event_at,
                lastEventAt: episodeDetails[i]!.last_event_at,
              }
            : null,
        })),
        topClaims: claimsByEvent.flat().slice(0, 10).map((c) => ({
          id: c.id,
          text: c.text,
          claimType: c.claim_type,
          eventId: c.event_id,
        })),
        topContradictions: contradictionsByEvent.flat().slice(0, 5).map((cc) => ({
          claimIdA: cc.claim_id_a,
          claimIdB: cc.claim_id_b,
          type: cc.contradiction_type,
        })),
      };
    });

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=120' },
    });
  } catch (err) {
    console.error('API v2 actor by id error', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 500 },
      { status: 500 }
    );
  }
}
