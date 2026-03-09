import { NextResponse } from 'next/server';
import { cachedFetch } from '@/lib/cache';

const COUNTRIES = [
  { code: 'LB', name: 'Liban', flag: '🇱🇧' },
  { code: 'IL', name: 'Israël', flag: '🇮🇱' },
  { code: 'SY', name: 'Syrie', flag: '🇸🇾' },
  { code: 'JO', name: 'Jordanie', flag: '🇯🇴' },
  { code: 'PS', name: 'Palestine', flag: '🇵🇸' },
  { code: 'CY', name: 'Chypre', flag: '🇨🇾' },
];

interface GdeltArticle {
  url: string;
  title: string;
  seendate: string;
  domain: string;
  language: string;
  sourcecountry?: string;
}

async function fetchGdeltForCountry(countryName: string): Promise<GdeltArticle[]> {
  try {
    const query = encodeURIComponent(`${countryName} conflict OR crisis OR military OR diplomacy`);
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=ArtList&maxrecords=10&format=json&sort=DateDesc&timespan=3d`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.articles ?? []).slice(0, 5);
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
            const articles = await fetchGdeltForCountry(country.name);
            return {
              ...country,
              events: articles.map((a) => ({
                title: a.title,
                url: a.url,
                date: a.seendate,
                domain: a.domain,
                language: a.language,
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

    return NextResponse.json({ countries: data ?? [] }, {
      headers: { 'Cache-Control': 's-maxage=600, stale-while-revalidate=1200' },
    });
  } catch (err) {
    console.error('Regional API error:', err);
    return NextResponse.json({ countries: [] });
  }
}
