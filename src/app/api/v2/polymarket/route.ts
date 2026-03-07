/**
 * Polymarket Lebanon — fetches prediction markets related to Lebanon from Gamma API.
 * Filters by title/slug/description containing "lebanon" or Israel-Lebanon conflict.
 */

import { NextResponse } from 'next/server';

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

function matchesLebanon(ev: GammaEvent): boolean {
  const haystack = [
    ev.title ?? '',
    ev.slug ?? '',
    ev.description ?? '',
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes('lebanon') || haystack.includes('lebanese');
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
    const res = await fetch(
      `${GAMMA_URL}?active=true&closed=false&limit=50&order=volume24hr&ascending=false`,
      { cache: 'no-store' }
    );
    if (!res.ok) {
      return NextResponse.json({ markets: [] }, { status: 200 });
    }
    const events: GammaEvent[] = await res.json();
    const items: PolymarketItem[] = [];

    for (const ev of events) {
      if (!matchesLebanon(ev) || !Array.isArray(ev.markets)) continue;
      const openMarket = ev.markets.find((m) => !m.closed);
      if (!openMarket) continue;
      const { yes, no } = parseOutcomePrices(openMarket.outcomePrices);
      items.push({
        id: openMarket.id,
        question: openMarket.question,
        slug: openMarket.slug,
        yesProb: yes,
        noProb: no,
        eventSlug: ev.slug,
        volume: typeof openMarket.volume === 'string' ? parseFloat(openMarket.volume) : openMarket.volume,
      });
    }

    return NextResponse.json({ markets: items.slice(0, 6) });
  } catch {
    return NextResponse.json({ markets: [] }, { status: 200 });
  }
}
