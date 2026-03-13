/**
 * Single event by ID — translations, observations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withClient, isDbConfigured } from '@/db/client';
import { getEventById } from '@/db/repositories/event-repository';
import { getEventTranslations } from '@/db/repositories/event-translation-repository';
import { getClaimsByEventId } from '@/db/repositories/claim-repository';
import { getEntitiesByEventId } from '@/db/repositories/entity-repository';
import { getEpisodeById } from '@/db/repositories/episode-repository';
import { getContradictionsByEventId } from '@/db/repositories/claim-contradiction-repository';
import { getSourceTier } from '@/config/source-tiers';
import { isProbablyGarbled, normalizeText } from '@/lib/text-normalize';
import { buildGeoQualityFromEvent } from '@/lib/api/geo-quality';
import type { Lang } from '@/db/repositories/event-translation-repository';

function mapSeverityScore(score: number | null): string {
  if (score == null) return 'low';
  if (score >= 0.9) return 'critical';
  if (score >= 0.6) return 'high';
  if (score >= 0.3) return 'medium';
  return 'low';
}

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

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid event ID format' }, { status: 400 });
  }

  const lang = (req.nextUrl.searchParams.get('lang') ?? 'fr') as Lang;

  try {
    const { event, translations, observations, claims, entities, contradictions, episode } = await withClient(async (client) => {
      const event = await getEventById(client, id);
      if (!event) return { event: null, translations: [], observations: [], claims: [], entities: [], contradictions: [], episode: null };

      const [translations, claims, entities, contradictions] = await Promise.all([
        getEventTranslations(client, id),
        getClaimsByEventId(client, id),
        getEntitiesByEventId(client, id),
        getContradictionsByEventId(client, id),
      ]);
      const obsResult = await client.query(
        `SELECT eo.observed_title, eo.observed_at, si.source_name
         FROM event_observation eo
         JOIN source_item si ON si.id = eo.source_item_id
         WHERE eo.event_id = $1
         ORDER BY eo.observed_at DESC NULLS LAST`,
        [id]
      );

      const episode =
        event.primary_episode_id
          ? await getEpisodeById(client, event.primary_episode_id)
          : null;

      return {
        event,
        translations,
        observations: obsResult.rows,
        claims,
        entities,
        contradictions,
        episode,
      };
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found', code: 404 }, { status: 404 });
    }

    const transByLang = new Map(translations.map((t) => [t.language, normalizeText(t.title ?? event.canonical_title)]));
    const title = normalizeText(transByLang.get(lang) ?? event.canonical_title);
    if (isProbablyGarbled(title)) {
      return NextResponse.json({ error: 'Event content unreadable/garbled', code: 422 }, { status: 422 });
    }
    const meta = (event.metadata ?? {}) as Record<string, unknown>;
    const evidence =
      meta.evidence && typeof meta.evidence === 'object'
        ? (meta.evidence as Record<string, unknown>)
        : null;

    const source = (meta.source as string | null) ?? null;
    const sourceCount = observations.length;

    return NextResponse.json(
      {
        id: event.id,
        placeId: event.place_id ?? null,
        title,
        summary: normalizeText(event.canonical_summary ?? '') || null,
        classification: event.polarity_ui,
        confidence: event.confidence_score ?? 0,
        category: event.event_type,
        severity: mapSeverityScore(event.severity_score),
        occurredAt: event.occurred_at,
        latitude: meta.latitude ?? null,
        longitude: meta.longitude ?? null,
        geoPrecision: event.geo_precision ?? (meta.geoPrecision as string | null) ?? 'unknown',
        geoQuality: buildGeoQualityFromEvent(event),
        resolvedPlaceName: (meta.resolvedPlaceName as string | null) ?? null,
        sources: observations.map((o: { source_name: string }) => o.source_name),
        verification_status: event.verification_status,
        sourceCount,
        sourceTier: getSourceTier(source),
        translationStatus: (meta.translationStatus as string | null) ?? 'unknown',
        translationMeta: (meta.translationMeta as Record<string, unknown> | null) ?? null,
        evidence: evidence ?? {
          sourceCount,
          sourceDiversity: new Set(observations.map((o: { source_name: string }) => o.source_name)).size,
          verificationStatus: event.verification_status,
        },
        translations: Object.fromEntries(translations.map((t) => [t.language, t.title])),
        claims: claims.map((c) => ({
          id: c.id,
          text: c.text,
          claim_type: c.claim_type,
          confidence: c.confidence,
          status: c.status,
        })),
        entities: entities.map((e) => ({
          id: e.id,
          name: e.name,
          entity_type: e.entity_type,
          role: e.role,
        })),
        contradictions: contradictions.map((cc) => ({
          claim_id_a: cc.claim_id_a,
          claim_id_b: cc.claim_id_b,
          type: cc.contradiction_type,
        })),
        episode: episode
          ? {
              id: episode.id,
              label: episode.label,
              status: (episode as { status?: string }).status ?? 'open',
              firstEventAt: episode.first_event_at,
              lastEventAt: episode.last_event_at,
              eventCount: episode.event_count,
            }
          : null,
      },
      {
        headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
      }
    );
  } catch (err) {
    console.error('API v2 event by id error', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 500 },
      { status: 500 }
    );
  }
}
