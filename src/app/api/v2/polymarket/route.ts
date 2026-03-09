/**
 * Polymarket Lebanon — fetches prediction markets related to Lebanon from Gamma API.
 * Filters by title/slug/description containing "lebanon" or Israel-Lebanon conflict.
 */

import { NextResponse } from 'next/server';
import { cachedFetch } from '@/lib/cache';

const GAMMA_URL = 'https://gamma-api.polymarket.com/events';

interface GammaMarket {
  id: string;
  question: string;
  slug: string;
  outcomePrices?: string;
  closed?: boolean;
  volume?: string | number;
}

interface GammaEvent {
  id: string;
  slug: string;
  title: string;
  description?: string;
  markets?: GammaMarket[];
}

export interface PolymarketItem {
  id: string;
  question: string;
  slug: string;
  yesProb: number;
  noProb: number;
  eventSlug: string;
  volume?: number;
}

const LEBANON_KEYWORDS = ['lebanon', 'lebanese', 'beirut', 'hezbollah', 'litani'];
const GEOPOLITICAL_KEYWORDS = [
  'lebanon', 'hezbollah', 'israel', 'iran', 'ceasefire', 'middle east',
  'war', 'nuclear', 'trump', 'netanyahu', 'sanctions', 'oil', 'attack',
  'bombing', 'invasion', 'syria', 'unifil', 'hamas', 'gaza',
];

function matchesLebanon(ev: GammaEvent): boolean {
  const haystack = [
    ev.title ?? '',
    ev.slug ?? '',
    ev.description ?? '',
  ]
    .join(' ')
    .toLowerCase();
  return LEBANON_KEYWORDS.some((k) => haystack.includes(k));
}

function matchesGeopolitics(ev: GammaEvent): boolean {
  const haystack = [
    ev.title ?? '',
    ev.slug ?? '',
    ev.description ?? '',
  ]
    .join(' ')
    .toLowerCase();
  return GEOPOLITICAL_KEYWORDS.some((k) => haystack.includes(k));
}

function parseOutcomePrices(outcomePrices?: string): { yes: number; no: number } {
  try {
    const arr = JSON.parse(outcomePrices ?? '["0.5","0.5"]') as string[];
    const yes = Math.round(parseFloat(arr[0] ?? '0.5') * 100) / 100;
    const no = Math.round(parseFloat(arr[1] ?? '0.5') * 100) / 100;
    return { yes, no };
  } catch {
    return { yes: 0.5, no: 0.5 };
  }
}

export async function GET() {
  try {
    const data = await cachedFetch(
      'lm:polymarket',
      async () => {
        const res = await fetch(
          `${GAMMA_URL}?active=true&closed=false&limit=200&order=volume24hr&ascending=false`,
          { cache: 'no-store' }
        );
        if (!res.ok) return { markets: [] };
        const events: GammaEvent[] = await res.json();
        const items: PolymarketItem[] = [];

        for (const ev of events) {
          if (!Array.isArray(ev.markets)) continue;
          const openMarket = ev.markets.find((m) => !m.closed);
          if (!openMarket) continue;
          if (!matchesLebanon(ev) && !matchesGeopolitics(ev)) continue;
          const { yes } = parseOutcomePrices(openMarket.outcomePrices);
          items.push({
            id: openMarket.id,
            question: openMarket.question,
            slug: openMarket.slug,
            yesProb: yes,
            noProb: 1 - yes,
            eventSlug: ev.slug,
            volume: typeof openMarket.volume === 'string' ? parseFloat(openMarket.volume) : openMarket.volume,
          });
        }

        items.sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0));
        if (items.length > 0) return { markets: items.slice(0, 6) };

        const fallbackItems: PolymarketItem[] = [];
        for (const ev of events) {
          if (!Array.isArray(ev.markets)) continue;
          const openMarket = ev.markets.find((m) => !m.closed);
          if (!openMarket) continue;
          const { yes } = parseOutcomePrices(openMarket.outcomePrices);
          const vol = typeof openMarket.volume === 'string' ? parseFloat(openMarket.volume) : openMarket.volume;
          fallbackItems.push({
            id: openMarket.id,
            question: openMarket.question,
            slug: openMarket.slug,
            yesProb: yes,
            noProb: 1 - yes,
            eventSlug: ev.slug,
            volume: vol,
          });
        }
        fallbackItems.sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0));
        return { markets: fallbackItems.slice(0, 3) };
      },
      { ttl: 300 }
    );

    return NextResponse.json(data ?? { markets: [] }, {
      headers: { 'Cache-Control': 's-maxage=300, stale-if-error=86400' },
    });
  } catch {
    return NextResponse.json({ markets: [] }, {
      status: 200,
      headers: { 'Cache-Control': 's-maxage=60, stale-if-error=86400' },
    });
  }
}
