/**
 * API v2 actors — list entities (person, organization) for analyst navigation.
 * Phase 6 — actor/entity surfaces.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withClient, isDbConfigured } from '@/db/client';
import { searchEntities } from '@/db/repositories/entity-repository';
import { getEventsByEntity } from '@/db/repositories/entity-repository';
import { getSourceDiversityForEventIds } from '@/db/repositories/event-observation-repository';
import { buildActorReadModel } from '@/lib/read-models/actor';
import type { EntityType } from '@/db/repositories/entity-repository';

export async function GET(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured', code: 500 },
      { status: 500 }
    );
  }

  try {
    const q = req.nextUrl.searchParams.get('q') ?? undefined;
    const entityType = req.nextUrl.searchParams.get('entityType') as EntityType | undefined;
    const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get('limit') ?? 50)));
    const offset = Math.max(0, Number(req.nextUrl.searchParams.get('offset') ?? 0));

    const { entities, total } = await withClient((client) =>
      searchEntities(client, { q, entity_type: entityType, limit, offset })
    );

    const items = await withClient(async (client) => {
      const result = [];
      for (const ent of entities) {
        const { eventIds, total: evTotal } = await getEventsByEntity(client, ent.id, {
          limit: 1,
          offset: 0,
        });
        const episodeRes = await client.query<{ count: string }>(
          `SELECT COUNT(DISTINCT ee.episode_id)::int as count
           FROM episode_event ee
           JOIN event_entity ev ON ev.event_id = ee.event_id
           WHERE ev.entity_id = $1`,
          [ent.id]
        );
        const episodeCount = parseInt(episodeRes.rows[0]?.count ?? '0', 10);
        const claimRes = await client.query<{ count: string }>(
          `SELECT COUNT(*)::int as count FROM claim c
           JOIN event_entity ee ON ee.event_id = c.event_id
           WHERE ee.entity_id = $1`,
          [ent.id]
        );
        const claimCount = parseInt(claimRes.rows[0]?.count ?? '0', 10);
        const contradRes = await client.query<{ count: string }>(
          `SELECT COUNT(*)::int as count FROM claim_contradiction cc
           JOIN claim ca ON ca.id = cc.claim_id_a
           JOIN claim cb ON cb.id = cc.claim_id_b
           JOIN event_entity ea ON ea.event_id = ca.event_id
           JOIN event_entity eb ON eb.event_id = cb.event_id
           WHERE ea.entity_id = $1 AND eb.entity_id = $1`,
          [ent.id, ent.id]
        );
        const contradictionCount = parseInt(contradRes.rows[0]?.count ?? '0', 10);
        const sourceDiversity =
          eventIds.length > 0 ? await getSourceDiversityForEventIds(client, eventIds) : 0;
        const roleRes = await client.query<{ role: string | null }>(
          `SELECT role FROM event_entity WHERE entity_id = $1`,
          [ent.id]
        );
        const roleAggregations = roleRes.rows.reduce((acc, r) => {
          const role = r.role ?? 'unknown';
          const existing = acc.find((x) => (x.role ?? 'unknown') === role);
          if (existing) existing.count += 1;
          else acc.push({ role: r.role, count: 1 });
          return acc;
        }, [] as Array<{ role: string | null; count: number }>);

        result.push(
          buildActorReadModel(ent, {
            eventCount: evTotal,
            episodeCount,
            claimCount,
            contradictionCount,
            sourceDiversity,
            roleAggregations,
          })
        );
      }
      return result;
    });

    return NextResponse.json(
      { items, total },
      {
        headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=120' },
      }
    );
  } catch (err) {
    console.error('API v2 actors error', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 500 },
      { status: 500 }
    );
  }
}
