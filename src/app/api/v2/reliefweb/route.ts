import { NextResponse } from 'next/server';
import { cachedFetch } from '@/lib/cache';

const APPNAME = process.env.RELIEFWEB_APPNAME || 'SNakib-lebanonmonitor-sn7k2';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '15', 10), 50);

  try {
    const data = await cachedFetch(
      `lm:reliefweb:${limit}`,
      async () => {
        const body = {
          filter: {
            field: 'country.name',
            value: 'Lebanon',
          },
          sort: ['date:desc'],
          fields: {
            include: [
              'title',
              'date.created',
              'source',
              'url_alias',
              'body-html',
              'primary_country',
              'disaster_type',
            ],
          },
          limit,
        };

        const res = await fetch(
          `https://api.reliefweb.int/v1/reports?appname=${APPNAME}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(10_000),
          },
        );

        if (!res.ok) throw new Error(`ReliefWeb API error: ${res.status}`);
        const json = await res.json();

        const reports = (json.data ?? []).map((item: any) => ({
          id: item.id,
          title: item.fields?.title ?? '',
          date: item.fields?.date?.created ?? '',
          source: Array.isArray(item.fields?.source)
            ? item.fields.source.map((s: any) => s.name).join(', ')
            : '',
          url: item.fields?.url_alias
            ? `https://reliefweb.int${item.fields.url_alias}`
            : `https://reliefweb.int/node/${item.id}`,
          type: Array.isArray(item.fields?.disaster_type)
            ? item.fields.disaster_type.map((d: any) => d.name)
            : [],
        }));

        return { count: json.totalCount ?? reports.length, reports };
      },
      { ttl: 600 },
    );

    return NextResponse.json(data ?? { count: 0, reports: [] }, {
      headers: { 'Cache-Control': 's-maxage=600, stale-while-revalidate=1200' },
    });
  } catch (err) {
    console.error('ReliefWeb API error:', err);
    return NextResponse.json({ count: 0, reports: [] });
  }
}
