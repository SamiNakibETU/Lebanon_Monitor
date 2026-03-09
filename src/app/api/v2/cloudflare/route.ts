import { NextResponse } from 'next/server';
import { fetchCloudflare } from '@/sources/cloudflare/fetcher';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await fetchCloudflare();
    if (!result.ok) {
      return NextResponse.json(
        { outageCount: null, outages: [], status: 'error' },
        { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' } }
      );
    }

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
  } catch (err) {
    console.error('Cloudflare API error:', err);
    return NextResponse.json({ outageCount: null, outages: [], status: 'error' });
  }
}
