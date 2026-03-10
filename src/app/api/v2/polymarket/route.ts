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
  delta24h?: number | null;
  history7d?: number[];
  signal?: 'escalation' | 'deescalation' | 'stable';
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

async function fetchPriceHistory(marketId: string): Promise<number[]> {
  const urls = [
    `https://clob.polymarket.com/prices-history?market=${encodeURIComponent(marketId)}&interval=1d`,
    `https://clob.polymarket.com/prices-history?token_id=${encodeURIComponent(marketId)}&interval=1d`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
      if (!res.ok) continue;
      const json = await res.json() as Record<string, unknown>;
      const rows =
        (Array.isArray(json.history) ? json.history : null) ??
        (Array.isArray(json.data) ? json.data : null) ??
        (Array.isArray(json.prices) ? json.prices : null);
      if (!rows) continue;
      const parsed = rows
        .map((r) => {
          if (typeof r === 'number') return r;
          if (r && typeof r === 'object') {
            const obj = r as Record<string, unknown>;
            const v = obj.p ?? obj.price ?? obj.value ?? obj.midpoint;
            const n = typeof v === 'string' ? Number(v) : typeof v === 'number' ? v : NaN;
            return Number.isFinite(n) ? n : null;
          }
          return null;
        })
        .filter((n): n is number => typeof n === 'number' && Number.isFinite(n))
        .slice(-7);
      if (parsed.length > 0) return parsed;
    } catch {
      // best-effort only
    }
  }
  return [];
}

function computeDelta24h(history: number[], currentYes: number): number | null {
  if (history.length >= 2) {
    const prev = history[history.length - 2]!;
    return Number((currentYes - prev).toFixed(4));
  }
  return null;
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
          const history = await fetchPriceHistory(openMarket.id);
          const delta24h = computeDelta24h(history, yes);
          items.push({
            id: openMarket.id,
            question: openMarket.question,
            slug: openMarket.slug,
            yesProb: yes,
            noProb: 1 - yes,
            eventSlug: ev.slug,
            volume: typeof openMarket.volume === 'string' ? parseFloat(openMarket.volume) : openMarket.volume,
            delta24h,
            history7d: history,
            signal: delta24h == null ? 'stable' : delta24h >= 0.05 ? 'escalation' : delta24h <= -0.05 ? 'deescalation' : 'stable',
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
          const history = await fetchPriceHistory(openMarket.id);
          const delta24h = computeDelta24h(history, yes);
          fallbackItems.push({
            id: openMarket.id,
            question: openMarket.question,
            slug: openMarket.slug,
            yesProb: yes,
            noProb: 1 - yes,
            eventSlug: ev.slug,
            volume: vol,
            delta24h,
            history7d: history,
            signal: delta24h == null ? 'stable' : delta24h >= 0.05 ? 'escalation' : delta24h <= -0.05 ? 'deescalation' : 'stable',
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
