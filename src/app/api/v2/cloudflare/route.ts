import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const token = process.env.CF_API_TOKEN;

    if (token) {
      const { fetchCloudflare } = await import('@/sources/cloudflare/fetcher');
      const result = await fetchCloudflare();
      if (result.ok) {
        const activeOutages = result.data.filter((o) => !o.endDate || new Date(o.endDate) > new Date());
        return NextResponse.json(
          {
            outageCount: activeOutages.length,
            totalRecent: result.data.length,
            outages: result.data.slice(0, 5),
            status: activeOutages.length === 0 ? 'stable' : 'disrupted',
          },
          { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' } }
        );
      }
    }

    const radarRes = await fetch(
      'https://radar.cloudflare.com/api/v1/annotations/outages?limit=5&dateRange=7d&location=LB',
      { signal: AbortSignal.timeout(10_000) }
    );
    if (radarRes.ok) {
      const json = await radarRes.json();
      const annotations = json?.annotations ?? json?.result?.annotations ?? [];
      const outageCount = Array.isArray(annotations) ? annotations.length : 0;
      return NextResponse.json(
        {
          outageCount,
          totalRecent: outageCount,
          outages: [],
          status: outageCount === 0 ? 'stable' : 'disrupted',
        },
        { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' } }
      );
    }

    return NextResponse.json(
      { outageCount: 0, totalRecent: 0, outages: [], status: 'stable' },
      { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' } }
    );
  } catch (err) {
    console.error('Cloudflare API error:', err);
    return NextResponse.json({ outageCount: 0, totalRecent: 0, outages: [], status: 'stable' });
  }
}
