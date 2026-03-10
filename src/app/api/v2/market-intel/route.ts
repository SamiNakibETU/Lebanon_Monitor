import { NextResponse } from 'next/server';
import { cachedFetch } from '@/lib/cache';
import { withClient, isDbConfigured } from '@/db/client';
import { callGroq, getSanitizedGroqKey } from '@/lib/groq-client';
import { fetchLbpRate } from '@/sources/lbp-rate/fetcher';

interface PolymarketSignal {
  question: string;
  eventSlug: string;
  yesProb: number;
  delta24h: number | null;
}

async function fetchBrentPrice(): Promise<number | null> {
  const candidates = [
    'https://stooq.com/q/l/?s=brent&i=d',
    'https://query1.finance.yahoo.com/v8/finance/chart=BZ=F?range=5d&interval=1d',
  ];

  for (const url of candidates) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(7000), cache: 'no-store' });
      if (!res.ok) continue;
      const txt = await res.text();
      const lines = txt.split('\n').map((l) => l.trim()).filter(Boolean);
      if (url.includes('stooq') && lines.length >= 2) {
        const row = lines[1]!.split(',');
        const close = Number(row[4]);
        if (Number.isFinite(close) && close > 0) return close;
      }
      if (url.includes('yahoo')) {
        const json = JSON.parse(txt) as Record<string, unknown>;
        const result = (((json.chart as Record<string, unknown>)?.result as Array<Record<string, unknown>> | undefined)?.[0] ?? {}) as Record<string, unknown>;
        const quote = ((((result.indicators as Record<string, unknown>)?.quote as Array<Record<string, unknown>> | undefined)?.[0] ?? {}) as Record<string, unknown>);
        const close = (quote.close as number[] | undefined)?.filter((n) => Number.isFinite(n)).slice(-1)[0] ?? null;
        if (typeof close === 'number' && close > 0) return close;
      }
    } catch {
      // ignore and continue
    }
  }
  return null;
}

async function fetchGoldPrice(): Promise<number | null> {
  try {
    const res = await fetch('https://api.gold-api.com/price/XAU', { signal: AbortSignal.timeout(7000), cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json() as Record<string, unknown>;
    const price = Number(json.price ?? NaN);
    return Number.isFinite(price) ? price : null;
  } catch {
    return null;
  }
}

async function fetchPolymarketSignal(): Promise<PolymarketSignal | null> {
  try {
    const res = await fetch('https://gamma-api.polymarket.com/events?active=true&closed=false&limit=50&order=volume24hr&ascending=false', {
      signal: AbortSignal.timeout(10_000),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const events = await res.json() as Array<Record<string, unknown>>;
    for (const ev of events) {
      const title = String(ev.title ?? '');
      const hay = `${title} ${String(ev.slug ?? '')}`.toLowerCase();
      if (!/(lebanon|israel|iran|hezbollah|ceasefire|middle east|gaza)/.test(hay)) continue;
      const markets = Array.isArray(ev.markets) ? ev.markets as Array<Record<string, unknown>> : [];
      const m = markets.find((x) => x.closed !== true);
      if (!m) continue;
      const rawPrices = String(m.outcomePrices ?? '["0.5","0.5"]');
      const arr = JSON.parse(rawPrices) as string[];
      const yes = Number(arr[0] ?? 0.5);
      const id = String(m.id ?? '');
      let delta: number | null = null;
      try {
        const histRes = await fetch(`https://clob.polymarket.com/prices-history?market=${encodeURIComponent(id)}&interval=1d`, {
          signal: AbortSignal.timeout(6000),
          cache: 'no-store',
        });
        if (histRes.ok) {
          const hist = await histRes.json() as Record<string, unknown>;
          const rows = (hist.history as Array<Record<string, unknown>> | undefined) ?? [];
          const vals = rows
            .map((r) => Number(r.p ?? r.price ?? NaN))
            .filter((n) => Number.isFinite(n));
          if (vals.length >= 2) {
            delta = Number((yes - vals[vals.length - 2]!).toFixed(4));
          }
        }
      } catch {
        // optional
      }
      return {
        question: String(m.question ?? title),
        eventSlug: String(ev.slug ?? ''),
        yesProb: Number.isFinite(yes) ? yes : 0.5,
        delta24h: delta,
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function buildVerdict(input: {
  lbpDeltaPct: number | null;
  goldDeltaPct: number | null;
  brentDeltaPct: number | null;
  polymarketDeltaPct: number | null;
  events24h: number | null;
  armed24h: number | null;
}): Promise<string> {
  const basis = `LBP ${input.lbpDeltaPct ?? 'n/a'}%, Or ${input.goldDeltaPct ?? 'n/a'}%, Brent ${input.brentDeltaPct ?? 'n/a'}%, Polymarket ${input.polymarketDeltaPct ?? 'n/a'}%, events24h ${input.events24h ?? 'n/a'}, armed24h ${input.armed24h ?? 'n/a'}`;
  if (!getSanitizedGroqKey()) {
    return `Lecture marchés: ${basis}. ${((input.brentDeltaPct ?? 0) > 2 || (input.polymarketDeltaPct ?? 0) > 5) ? 'Signal d’escalade.' : 'Signal mixte/stable.'}`;
  }
  try {
    const out = await callGroq({
      messages: [
        { role: 'system', content: 'Tu produis une phrase OSINT factuelle en français, 35 mots max, sans spéculation.' },
        { role: 'user', content: `Croise ces indicateurs marché + conflit et donne une conclusion opérationnelle: ${basis}` },
      ],
      temperature: 0,
      max_tokens: 90,
      timeoutMs: 10_000,
    });
    return out?.replace(/\s+/g, ' ').trim() ?? `Lecture marchés: ${basis}.`;
  } catch {
    return `Lecture marchés: ${basis}.`;
  }
}

export async function GET() {
  try {
    const payload = await cachedFetch(
      'lm:market-intel:v1',
      async () => {
        const lbp = await fetchLbpRate();
        const lbpRate = lbp.ok ? lbp.data.rate : 89_500;
        const [goldNow, brentNow, polySignal] = await Promise.all([
          fetchGoldPrice(),
          fetchBrentPrice(),
          fetchPolymarketSignal(),
        ]);

        let lbpPrev: number | null = null;
        let events24h: number | null = null;
        let armed24h: number | null = null;

        if (isDbConfigured()) {
          const dbData = await withClient(async (client) => {
            const prev = await client.query<{ value: string }>(
              `SELECT (payload->>'value')::float8::text AS value
               FROM indicator_snapshot
               WHERE indicator_key = 'lbp'
                 AND period_end >= NOW() - INTERVAL '2 days'
               ORDER BY period_end DESC
               OFFSET 1 LIMIT 1`
            );
            const events = await client.query<{ events24h: string; armed24h: string }>(
              `SELECT
                 COUNT(*) FILTER (WHERE occurred_at >= NOW() - INTERVAL '24 hours')::int AS events24h,
                 COUNT(*) FILTER (WHERE occurred_at >= NOW() - INTERVAL '24 hours' AND event_type IN ('armed_conflict','violence'))::int AS armed24h
               FROM event
               WHERE is_active = true`
            );
            return {
              lbpPrev: prev.rows[0]?.value ? Number(prev.rows[0].value) : null,
              events24h: Number(events.rows[0]?.events24h ?? 0),
              armed24h: Number(events.rows[0]?.armed24h ?? 0),
            };
          });
          lbpPrev = dbData.lbpPrev;
          events24h = dbData.events24h;
          armed24h = dbData.armed24h;
        }

        const lbpDeltaPct = lbpPrev && lbpPrev > 0 ? Number((((lbpRate - lbpPrev) / lbpPrev) * 100).toFixed(2)) : null;
        const goldDeltaPct = null;
        const brentDeltaPct = null;
        const polymarketDeltaPct = polySignal?.delta24h != null ? Number((polySignal.delta24h * 100).toFixed(2)) : null;

        const verdict = await buildVerdict({
          lbpDeltaPct,
          goldDeltaPct,
          brentDeltaPct,
          polymarketDeltaPct,
          events24h,
          armed24h,
        });

        return {
          generatedAt: new Date().toISOString(),
          lbp: { rate: lbpRate, delta24hPct: lbpDeltaPct },
          gold: { usdPerOz: goldNow, delta24hPct: goldDeltaPct },
          brent: { usd: brentNow, delta24hPct: brentDeltaPct },
          polymarket: polySignal,
          context: { events24h, armed24h },
          verdict,
        };
      },
      { ttl: 300 }
    );

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' },
    });
  } catch (err) {
    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      lbp: { rate: 89_500, delta24hPct: null },
      gold: { usdPerOz: null, delta24hPct: null },
      brent: { usd: null, delta24hPct: null },
      polymarket: null,
      context: { events24h: null, armed24h: null },
      verdict: 'Données marchés indisponibles.',
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

