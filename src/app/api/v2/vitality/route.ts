/**
 * API v2 vitality — unified territorial vitality contract.
 * Aggregates reconstruction, reliefweb, infra/economy; separates measured, proxy, narrative.
 * Does NOT infer vitality from lumiere polarity.
 */

import { NextResponse } from 'next/server';
import { cachedFetch } from '@/lib/cache';
import { withClient, isDbConfigured } from '@/db/client';
import { listEvents } from '@/db/repositories/event-repository';
import type { VitalityReadModel, MeasuredIndicator, ProxyIndicator, NarrativeSignal, SupportingEvent, SupportingPlace } from '@/lib/read-models/vitality';

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

async function fetchReconstruction(): Promise<{ projects: Array<{ governorate?: string }>; total: number }> {
  const res = await fetch(`${BASE}/api/v2/reconstruction`, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
  if (!res.ok) return { projects: [], total: 0 };
  const data = (await res.json()) as { projects?: Array<{ governorate?: string }>; total?: number };
  return { projects: data.projects ?? [], total: data.total ?? 0 };
}

async function fetchReliefweb(): Promise<{ items: Array<{ id: string; title: string; source: string | null; date: string | null; themes: string[]; url: string | null }> }> {
  const res = await fetch(`${BASE}/api/v2/reliefweb-lumiere?limit=15`, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
  if (!res.ok) return { items: [] };
  const data = (await res.json()) as { items?: Array<{ id: string; title: string; source: string | null; date: string | null; themes: string[]; url?: string | null }> };
  return { items: (data.items ?? []).map((i) => ({ ...i, url: i.url ?? null })) };
}

async function fetchLbp(): Promise<{ rate: number; volatility24h: number | null; spreadVsOfficial: number | null }> {
  const res = await fetch(`${BASE}/api/v2/lbp-rate`, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
  if (!res.ok) return { rate: 89500, volatility24h: null, spreadVsOfficial: null };
  const data = (await res.json()) as { rate?: number; volatility24h?: number | null; spreadVsOfficial?: number | null };
  return { rate: data.rate ?? 89500, volatility24h: data.volatility24h ?? null, spreadVsOfficial: data.spreadVsOfficial ?? null };
}

async function fetchEdl(): Promise<{ availableHours: number | null }> {
  const res = await fetch(`${BASE}/api/v2/edl`, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
  if (!res.ok) return { availableHours: null };
  const data = (await res.json()) as { availableHours?: number | null };
  return { availableHours: data.availableHours ?? null };
}

async function fetchCloudflare(): Promise<{ outageCount: number; status: string }> {
  const res = await fetch(`${BASE}/api/v2/cloudflare`, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
  if (!res.ok) return { outageCount: 0, status: 'stable' };
  const data = (await res.json()) as { outageCount?: number; status?: string };
  return { outageCount: data.outageCount ?? 0, status: data.status ?? 'stable' };
}

async function fetchInfrastructureFeatureCount(): Promise<number> {
  try {
    const res = await fetch(`${BASE}/api/v2/infrastructure`, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
    if (!res.ok) return 0;
    const geojson = (await res.json()) as { features?: unknown[] };
    return Array.isArray(geojson.features) ? geojson.features.length : 0;
  } catch {
    return 0;
  }
}

/** Event types indicating territorial vitality (recovery, continuity, capacity). NOT polarity-based. */
const VITALITY_EVENT_TYPES = [
  'reconstruction', 'solidarity', 'cultural_event', 'cultural_resilience',
  'aid_delivery_verified', 'service_restoration', 'sports_cohesion', 'civil_society_mobilization',
] as const;

async function fetchSupportingEvents(): Promise<SupportingEvent[]> {
  if (!isDbConfigured()) return [];
  const from = new Date();
  from.setDate(from.getDate() - 30);
  const { events } = await withClient(async (client) =>
    listEvents(client, {
      event_types: [...VITALITY_EVENT_TYPES],
      from_date: from,
      limit: 20,
      offset: 0,
    })
  );
  return events.map((e) => ({
    id: e.id,
    title: e.canonical_title,
    category: e.event_type,
    occurredAt: e.occurred_at.toISOString(),
  }));
}

function buildVitalityModel(data: {
  reconstruction: { projects: Array<{ governorate?: string }>; total: number };
  reliefweb: { items: Array<{ id: string; title: string; source: string | null; date: string | null; themes: string[]; url: string | null }> };
  lbp: { rate: number; volatility24h: number | null; spreadVsOfficial: number | null };
  edl: { availableHours: number | null };
  cloudflare: { outageCount: number; status: string };
  infraCount: number;
  supportingEvents: SupportingEvent[];
}): VitalityReadModel {
  const measured: MeasuredIndicator[] = [
    { key: 'lbp_rate', label: 'Taux LBP parallèle', value: data.lbp.rate, unit: 'LBP/USD', source: 'lirarate.org', updatedAt: new Date().toISOString() },
    ...(data.edl.availableHours != null
      ? [{ key: 'edl_hours', label: 'Heures EDL', value: data.edl.availableHours, unit: 'h/jour', source: 'edl.gov.lb', updatedAt: new Date().toISOString() } as MeasuredIndicator]
      : []),
    { key: 'cloudflare_outages', label: 'Pannes internet (LB)', value: data.cloudflare.outageCount, unit: null, source: 'Cloudflare', updatedAt: new Date().toISOString() },
  ];

  const proxy: ProxyIndicator[] = [
    { key: 'wb_projects', label: 'Projets Banque mondiale', value: data.reconstruction.total, unit: null, source: 'World Bank', updatedAt: new Date().toISOString() },
    { key: 'infra_features', label: 'Infrastructures cartographiées', value: data.infraCount, unit: null, source: 'OSM/GeoJSON', updatedAt: new Date().toISOString() },
    ...(data.lbp.volatility24h != null
      ? [{ key: 'lbp_volatility', label: 'Volatilité LBP 24h', value: `${data.lbp.volatility24h.toFixed(2)}%`, unit: null, source: 'indicator_snapshot', updatedAt: new Date().toISOString(), caveat: 'Estimé sur snapshots' } as ProxyIndicator]
      : []),
  ];

  const narrative: NarrativeSignal[] = data.reliefweb.items.map((i) => ({
    id: i.id,
    title: i.title,
    source: i.source,
    date: i.date,
    themes: i.themes,
    url: i.url,
  }));

  const places: SupportingPlace[] = [];
  const govSet = new Set<string>();
  for (const p of data.reconstruction.projects) {
    const gov = p.governorate ?? 'Lebanon';
    if (!govSet.has(gov)) {
      govSet.add(gov);
      places.push({ name: gov, governorate: gov !== 'Lebanon' ? gov : undefined, geoPrecision: gov === 'Lebanon' ? 'country' : 'governorate' });
    }
  }
  if (govSet.size === 0) {
    places.push({ name: 'Lebanon', geoPrecision: 'country' });
  }

  const coverage: string[] = [];
  if (data.reconstruction.total > 0) coverage.push('Projets WB actifs couvrant plusieurs gouvernorats');
  if (data.reliefweb.items.length > 0) coverage.push('Rapports ReliefWeb Recovery, Education, Health');
  if (data.lbp.rate > 0) coverage.push('Indicateur LBP parallèle disponible');
  if (data.infraCount > 0) coverage.push('Infrastructure géolocalisée disponible');
  if (data.supportingEvents.length > 0) coverage.push('Événements reconstruction/solidarité dans les 30 derniers jours');
  if (coverage.length === 0) coverage.push('Données partielles — sources externes à intégrer');

  const gaps: string[] = [];
  if (data.edl.availableHours == null) gaps.push('Données EDL non disponibles ou scraping échoué');
  if (data.reliefweb.items.length < 5) gaps.push('ReliefWeb — peu de rapports récents Recovery/Education/Health');

  const caveats: string[] = [
    'La vitalité territoriale ne se déduit pas du classement lumiere/ombre des événements.',
    'Les indicateurs mesurés (LBP, EDL, pannes) sont des proxies partiels.',
    'Les rapports ReliefWeb sont orientés thématique humanitaire.',
  ];

  const summary = [
    data.reconstruction.total > 0 && `${data.reconstruction.total} projets WB en cours`,
    data.reliefweb.items.length > 0 && `${data.reliefweb.items.length} rapports ReliefWeb récents`,
    data.supportingEvents.length > 0 && `${data.supportingEvents.length} événements de continuité/reprise récents`,
  ]
    .filter(Boolean)
    .join('. ') || 'Données de vitalité territoriale partielles.';

  return {
    summary,
    measuredIndicators: measured,
    proxyIndicators: proxy,
    narrativeSignals: narrative,
    supportingEvents: data.supportingEvents,
    supportingPlaces: places,
    coverage,
    gaps,
    caveats,
    generatedAt: new Date().toISOString(),
  };
}

export async function GET() {
  try {
    const payload = await cachedFetch(
      'lm:vitality:v1',
      async () => {
        const [reconstruction, reliefweb, lbp, edl, cloudflare, supportingEvents] = await Promise.all([
          fetchReconstruction(),
          fetchReliefweb(),
          fetchLbp(),
          fetchEdl(),
          fetchCloudflare(),
          fetchSupportingEvents(),
        ]);
        const infraCount = await fetchInfrastructureFeatureCount();

        return buildVitalityModel({
          reconstruction,
          reliefweb,
          lbp,
          edl,
          cloudflare,
          infraCount,
          supportingEvents,
        });
      },
      { ttl: 300 }
    );

    return NextResponse.json(payload ?? buildVitalityModel({
      reconstruction: { projects: [], total: 0 },
      reliefweb: { items: [] },
      lbp: { rate: 89500, volatility24h: null, spreadVsOfficial: null },
      edl: { availableHours: null },
      cloudflare: { outageCount: 0, status: 'stable' },
      infraCount: 0,
      supportingEvents: [],
    }), {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' },
    });
  } catch (err) {
    console.error('Vitality API error:', err);
    return NextResponse.json(
      buildVitalityModel({
        reconstruction: { projects: [], total: 0 },
        reliefweb: { items: [] },
        lbp: { rate: 89500, volatility24h: null, spreadVsOfficial: null },
        edl: { availableHours: null },
        cloudflare: { outageCount: 0, status: 'stable' },
        infraCount: 0,
        supportingEvents: [],
      }),
      { status: 200 }
    );
  }
}
