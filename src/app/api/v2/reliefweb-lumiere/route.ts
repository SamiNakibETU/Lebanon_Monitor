import { NextResponse } from 'next/server';
import { cachedFetch } from '@/lib/cache';

const RELIEFWEB_URL = 'https://api.reliefweb.int/v2/reports';
const APPNAME = process.env.RELIEFWEB_APPNAME ?? 'SNakib-lebanonmonitor-sn7k2';

interface ReliefWebItem {
  id: string;
  title: string;
  url: string | null;
  source: string | null;
  date: string | null;
  themes: string[];
}

function normalizeReliefwebUrl(urlAlias: unknown): string | null {
  if (typeof urlAlias !== 'string' || urlAlias.trim() === '') return null;
  const value = urlAlias.trim();
  if (/^https?:\/\//i.test(value)) return value;
  return `https://reliefweb.int${value.startsWith('/') ? value : `/${value}`}`;
}

async function fetchTheme(theme: string, limit: number): Promise<ReliefWebItem[]> {
  const body = {
    filter: {
      operator: 'AND',
      conditions: [
        { field: 'primary_country.id', value: 137 },
        { field: 'theme.name', value: theme },
      ],
    },
    sort: ['date.created:desc'],
    fields: { include: ['id', 'title', 'date.created', 'source', 'theme', 'url_alias'] },
    limit,
  };

  const res = await fetch(`${RELIEFWEB_URL}?appname=${encodeURIComponent(APPNAME)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: Array<Record<string, unknown>> };
  const items = Array.isArray(json.data) ? json.data : [];

  return items.map((item) => {
    const fields = (item.fields as Record<string, unknown>) ?? {};
    const source = Array.isArray(fields.source)
      ? fields.source
          .map((s) => (s && typeof s === 'object' ? (s as Record<string, unknown>).name : null))
          .filter((x): x is string => typeof x === 'string')
          .join(', ')
      : null;
    const themes = Array.isArray(fields.theme)
      ? fields.theme
          .map((t) => (t && typeof t === 'object' ? (t as Record<string, unknown>).name : null))
          .filter((x): x is string => typeof x === 'string')
      : [];

    return {
      id: String(item.id ?? crypto.randomUUID()),
      title: String(fields.title ?? ''),
      url: normalizeReliefwebUrl(fields.url_alias),
      source,
      date: (fields.date as { created?: string } | undefined)?.created ?? null,
      themes,
    };
  });
}

function dedupe(items: ReliefWebItem[]): ReliefWebItem[] {
  const seen = new Set<string>();
  const out: ReliefWebItem[] = [];
  for (const item of items) {
    const key = item.title.toLowerCase().replace(/\s+/g, ' ').trim();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? 20), 1), 50);

  try {
    const payload = await cachedFetch(
      `lm:reliefweb-lumiere:${limit}`,
      async () => {
        const [recovery, education, health] = await Promise.all([
          fetchTheme('Recovery and Reconstruction', limit),
          fetchTheme('Education', limit),
          fetchTheme('Health', limit),
        ]);

        const merged = dedupe([...recovery, ...education, ...health])
          .sort((a, b) => (new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime()))
          .slice(0, limit);

        return {
          appname: APPNAME,
          generatedAt: new Date().toISOString(),
          count: merged.length,
          themeCounts: {
            recovery: recovery.length,
            education: education.length,
            health: health.length,
          },
          items: merged,
        };
      },
      { ttl: 900 }
    );

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 's-maxage=900, stale-while-revalidate=1800' },
    });
  } catch (err) {
    return NextResponse.json(
      {
        appname: APPNAME,
        generatedAt: new Date().toISOString(),
        count: 0,
        themeCounts: { recovery: 0, education: 0, health: 0 },
        items: [],
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 200 }
    );
  }
}

