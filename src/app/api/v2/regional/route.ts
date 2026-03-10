import { NextResponse } from 'next/server';
import { cachedFetch } from '@/lib/cache';
import { withClient, isDbConfigured } from '@/db/client';

const COUNTRIES = [
  {
    code: 'LB',
    name: 'Liban',
    query: 'Lebanon',
    reliefweb: 'Lebanon',
    dbKeywords: ['lebanon', 'liban', 'beirut', 'بيروت'],
    lat: 33.8547,
    lng: 35.8623,
  },
  {
    code: 'IL',
    name: 'Israel',
    query: 'Israel',
    reliefweb: 'Israel',
    dbKeywords: ['israel', 'israeli', 'haifa', 'تل ابيب'],
    lat: 31.0461,
    lng: 34.8516,
  },
  {
    code: 'SY',
    name: 'Syrie',
    query: 'Syria',
    reliefweb: 'Syrian Arab Republic',
    dbKeywords: ['syria', 'syrian', 'damascus', 'syrie'],
    lat: 34.8021,
    lng: 38.9968,
  },
  {
    code: 'JO',
    name: 'Jordanie',
    query: 'Jordan',
    reliefweb: 'Jordan',
    dbKeywords: ['jordan', 'amman', 'jordanie'],
    lat: 30.5852,
    lng: 36.2384,
  },
  {
    code: 'PS',
    name: 'Palestine',
    query: 'Palestine OR Gaza OR West Bank',
    reliefweb: 'occupied Palestinian territory',
    dbKeywords: ['palestine', 'gaza', 'west bank', 'rafah', 'palestin'],
    lat: 31.9522,
    lng: 35.2332,
  },
  {
    code: 'CY',
    name: 'Chypre',
    query: 'Cyprus',
    reliefweb: 'Cyprus',
    dbKeywords: ['cyprus', 'cypriot', 'nicosia', 'chypre'],
    lat: 35.1264,
    lng: 33.4299,
  },
  {
    code: 'IR',
    name: 'Iran',
    query: 'Iran',
    reliefweb: 'Iran (Islamic Republic of)',
    dbKeywords: ['iran', 'tehran', 'iranian'],
    lat: 32.4279,
    lng: 53.688,
  },
];

interface GdeltArticle {
  url: string;
  title: string;
  seendate: string;
  domain: string;
  language: string;
  sourcecountry?: string;
  tone?: number;
}

interface RegionalEvent {
  title: string;
  url: string | null;
  date: string | null;
  domain: string | null;
  language: string | null;
  category: 'armed_conflict' | 'political_tension' | 'diplomacy' | 'humanitarian';
  confidence: number;
  tone: number | null;
  latitude: number;
  longitude: number;
  geoPrecision: 'country';
  geoMethod: 'country-centroid';
  sources: string[];
}

function inferCategory(title: string): 'armed_conflict' | 'political_tension' | 'diplomacy' | 'humanitarian' {
  const t = title.toLowerCase();
  if (/(strike|missile|rocket|drone|airstrike|clash|killed|bomb|attack|troops)/.test(t)) {
    return 'armed_conflict';
  }
  if (/(talks|ceasefire|summit|agreement|negotiation|mediat)/.test(t)) {
    return 'diplomacy';
  }
  if (/(aid|refugee|displaced|humanitarian|unrwa|wfp|unicef|hospital)/.test(t)) {
    return 'humanitarian';
  }
  return 'political_tension';
}

async function fetchGdeltForCountry(countryQuery: string): Promise<GdeltArticle[]> {
  try {
    const query = encodeURIComponent(
      `(${countryQuery}) AND (conflict OR military OR strike OR diplomacy OR humanitarian OR ceasefire OR protest)`
    );
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=ArtList&maxrecords=50&format=json&sort=DateDesc&timespan=7d`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return [];
    const data = (await res.json()) as { articles?: GdeltArticle[] };
    const articles = Array.isArray(data.articles) ? data.articles : [];

    // Prefer high-signal items (tone proxy for strong conflict/cooperation context).
    const filtered = articles.filter((a) => {
      if (typeof a.tone === 'number') return a.tone <= -5 || a.tone >= 5;
      return true;
    });

    if (filtered.length > 0) return filtered.slice(0, 8);

    // Fallback when tone filter is too strict.
    if (articles.length > 0) return articles.slice(0, 8);

    // Final fallback: looser query only on country mention.
    const fallbackQuery = encodeURIComponent(countryQuery);
    const fallbackUrl = `https://api.gdeltproject.org/api/v2/doc/doc?query=${fallbackQuery}&mode=ArtList&maxrecords=20&format=json&sort=DateDesc&timespan=7d`;
    const fallbackRes = await fetch(fallbackUrl, { signal: AbortSignal.timeout(10_000) });
    if (!fallbackRes.ok) return [];
    const fallbackData = (await fallbackRes.json()) as { articles?: GdeltArticle[] };
    return Array.isArray(fallbackData.articles) ? fallbackData.articles.slice(0, 5) : [];
  } catch {
    return [];
  }
}

async function fetchReliefWebForCountry(countryName: string): Promise<Array<{ title: string; url: string | null; date: string | null; source: string | null }>> {
  try {
    const body = {
      filter: { field: 'country.name', value: countryName },
      sort: ['date:desc'],
      fields: { include: ['title', 'date.created', 'source', 'url_alias'] },
      limit: 8,
    };
    const res = await fetch('https://api.reliefweb.int/v1/reports?appname=SNakib-lebanonmonitor-sn7k2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: Array<any> };
    return (json.data ?? []).map((item) => ({
      title: item?.fields?.title ?? '',
      url: item?.fields?.url_alias ? `https://reliefweb.int${item.fields.url_alias}` : null,
      date: item?.fields?.date?.created ?? null,
      source: Array.isArray(item?.fields?.source) ? item.fields.source.map((s: any) => s.name).join(', ') : null,
    }));
  } catch {
    return [];
  }
}

async function fetchDbRegionalForCountry(keywords: string[]): Promise<Array<{ title: string; occurredAt: string | null; source: string | null; category: string | null }>> {
  if (!isDbConfigured()) return [];
  return withClient(async (client) => {
    const where = keywords.map((_, i) => `LOWER(e.canonical_title) LIKE $${i + 1}`).join(' OR ');
    const params = keywords.map((k) => `%${k.toLowerCase()}%`);
    const { rows } = await client.query<{
      canonical_title: string;
      occurred_at: string | null;
      event_type: string | null;
      source: string | null;
    }>(
      `SELECT
         e.canonical_title,
         e.occurred_at,
         e.event_type,
         e.metadata->>'source' AS source
       FROM event e
       WHERE e.is_active = true
         AND e.occurred_at >= NOW() - INTERVAL '7 days'
         AND (${where})
       ORDER BY e.occurred_at DESC
       LIMIT 15`,
      params
    );
    return rows.map((r) => ({
      title: r.canonical_title,
      occurredAt: r.occurred_at,
      source: r.source ?? null,
      category: r.event_type ?? null,
    }));
  }).catch(() => []);
}

function normalizeTitleKey(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/gi, ' ').trim().slice(0, 120);
}

function computeConfidence(input: { tone: number | null; sources: string[]; date: string | null }): number {
  const toneSignal = input.tone == null ? 0.55 : Math.min(1, Math.abs(input.tone) / 10);
  const sourceSignal = Math.min(1, 0.45 + input.sources.length * 0.2);
  const ageHours = input.date ? Math.max(0, (Date.now() - new Date(input.date).getTime()) / 36e5) : 72;
  const recencySignal = ageHours <= 24 ? 1 : ageHours <= 72 ? 0.8 : 0.6;
  return Number(Math.min(1, (toneSignal + sourceSignal + recencySignal) / 3).toFixed(2));
}

function fuseRegionalEvents(country: typeof COUNTRIES[number], inputs: {
  gdelt: GdeltArticle[];
  reliefweb: Array<{ title: string; url: string | null; date: string | null; source: string | null }>;
  db: Array<{ title: string; occurredAt: string | null; source: string | null; category: string | null }>;
}): RegionalEvent[] {
  const map = new Map<string, RegionalEvent>();

  for (const a of inputs.gdelt) {
    const key = normalizeTitleKey(a.title);
    map.set(key, {
      title: a.title,
      url: a.url ?? null,
      date: a.seendate ?? null,
      domain: a.domain ?? null,
      language: a.language ?? null,
      category: inferCategory(a.title),
      confidence: 0.65,
      tone: typeof a.tone === 'number' ? a.tone : null,
      latitude: country.lat,
      longitude: country.lng,
      geoPrecision: 'country',
      geoMethod: 'country-centroid',
      sources: ['gdelt'],
    });
  }

  for (const r of inputs.reliefweb) {
    const key = normalizeTitleKey(r.title);
    const existing = map.get(key);
    if (existing) {
      existing.sources = Array.from(new Set([...existing.sources, 'reliefweb']));
      existing.url = existing.url ?? r.url;
      existing.date = existing.date ?? r.date;
      existing.category = existing.category === 'armed_conflict' ? 'armed_conflict' : 'humanitarian';
      continue;
    }
    map.set(key, {
      title: r.title,
      url: r.url,
      date: r.date,
      domain: r.source ?? 'reliefweb',
      language: null,
      category: inferCategory(r.title),
      confidence: 0.62,
      tone: null,
      latitude: country.lat,
      longitude: country.lng,
      geoPrecision: 'country',
      geoMethod: 'country-centroid',
      sources: ['reliefweb'],
    });
  }

  for (const d of inputs.db) {
    const key = normalizeTitleKey(d.title);
    const existing = map.get(key);
    if (existing) {
      existing.sources = Array.from(new Set([...existing.sources, 'db']));
      existing.date = existing.date ?? d.occurredAt;
      continue;
    }
    map.set(key, {
      title: d.title,
      url: null,
      date: d.occurredAt,
      domain: d.source ?? 'db',
      language: null,
      category: inferCategory(d.title),
      confidence: 0.58,
      tone: null,
      latitude: country.lat,
      longitude: country.lng,
      geoPrecision: 'country',
      geoMethod: 'country-centroid',
      sources: ['db'],
    });
  }

  return Array.from(map.values())
    .map((e) => ({
      ...e,
      confidence: computeConfidence({ tone: e.tone, sources: e.sources, date: e.date }),
    }))
    .sort((a, b) => {
      const tA = a.date ? new Date(a.date).getTime() : 0;
      const tB = b.date ? new Date(b.date).getTime() : 0;
      if (tB !== tA) return tB - tA;
      return b.confidence - a.confidence;
    })
    .slice(0, 10);
}

export async function GET() {
  try {
    const data = await cachedFetch(
      'lm:regional',
      async () => {
        const results = await Promise.allSettled(
          COUNTRIES.map(async (country) => {
            const [gdelt, reliefweb, db] = await Promise.all([
              fetchGdeltForCountry(country.query),
              fetchReliefWebForCountry(country.reliefweb),
              fetchDbRegionalForCountry(country.dbKeywords),
            ]);
            const fused = fuseRegionalEvents(country, { gdelt, reliefweb, db });
            return {
              code: country.code,
              name: country.name,
              events: fused,
              eventCount: fused.length,
              sourcesUsed: {
                gdelt: gdelt.length,
                reliefweb: reliefweb.length,
                db: db.length,
              },
            };
          })
        );

        return results
          .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
          .map((r) => r.value);
      },
      { ttl: 600 }
    );

    return NextResponse.json(
      {
        updatedAt: new Date().toISOString(),
        countries: data ?? [],
      },
      {
        headers: { 'Cache-Control': 's-maxage=600, stale-while-revalidate=1200' },
      }
    );
  } catch (err) {
    console.error('Regional API error:', err);
    return NextResponse.json({ updatedAt: new Date().toISOString(), countries: [] });
  }
}
