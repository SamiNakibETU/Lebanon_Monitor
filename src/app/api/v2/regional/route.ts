import { NextResponse } from 'next/server';
import { cachedFetch } from '@/lib/cache';

const COUNTRIES = [
  { code: 'LB', name: 'Liban', query: 'Lebanon', lat: 33.8547, lng: 35.8623 },
  { code: 'IL', name: 'Israel', query: 'Israel', lat: 31.0461, lng: 34.8516 },
  { code: 'SY', name: 'Syrie', query: 'Syria', lat: 34.8021, lng: 38.9968 },
  { code: 'JO', name: 'Jordanie', query: 'Jordan', lat: 30.5852, lng: 36.2384 },
  { code: 'PS', name: 'Palestine', query: 'Palestine OR Gaza OR West Bank', lat: 31.9522, lng: 35.2332 },
  { code: 'CY', name: 'Chypre', query: 'Cyprus', lat: 35.1264, lng: 33.4299 },
  { code: 'IR', name: 'Iran', query: 'Iran', lat: 32.4279, lng: 53.688 },
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
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=ArtList&maxrecords=25&format=json&sort=DateDesc&timespan=72h`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return [];
    const data = (await res.json()) as { articles?: GdeltArticle[] };
    const articles = Array.isArray(data.articles) ? data.articles : [];

    // Prefer high-signal items (tone proxy for strong conflict/cooperation context).
    const filtered = articles.filter((a) => {
      if (typeof a.tone === 'number') return a.tone <= -5 || a.tone >= 5;
      return true;
    });

    return filtered.slice(0, 8);
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const data = await cachedFetch(
      'lm:regional',
      async () => {
        const results = await Promise.allSettled(
          COUNTRIES.map(async (country) => {
            const articles = await fetchGdeltForCountry(country.query);
            return {
              code: country.code,
              name: country.name,
              events: articles.map((a) => ({
                title: a.title,
                url: a.url,
                date: a.seendate,
                domain: a.domain,
                language: a.language,
                category: inferCategory(a.title),
                confidence: typeof a.tone === 'number' ? Math.min(1, Math.abs(a.tone) / 10) : 0.65,
                tone: typeof a.tone === 'number' ? a.tone : null,
                latitude: country.lat,
                longitude: country.lng,
                geoPrecision: 'country',
                geoMethod: 'country-centroid',
              })),
              eventCount: articles.length,
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
