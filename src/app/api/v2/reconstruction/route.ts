import { NextResponse } from 'next/server';

const GOVERNORATE_COORDS: Array<{ key: RegExp; lat: number; lng: number; name: string }> = [
  { key: /beirut/i, lat: 33.8938, lng: 35.5018, name: 'Beirut' },
  { key: /mount lebanon|baabda|metn|keserwan|jbeil/i, lat: 33.95, lng: 35.7, name: 'Mount Lebanon' },
  { key: /north|tripoli|akkar|zgharta|batroun/i, lat: 34.4, lng: 35.85, name: 'North' },
  { key: /south|saida|sidon|tyre|nabatiyeh/i, lat: 33.3, lng: 35.3, name: 'South' },
  { key: /bekaa|baalbek|hermel|zahle/i, lat: 33.85, lng: 36.0, name: 'Bekaa' },
];

function inferProjectLocation(text: string): { lat: number; lng: number; governorate: string; geoPrecision: 'governorate' | 'country' } {
  for (const g of GOVERNORATE_COORDS) {
    if (g.key.test(text)) return { lat: g.lat, lng: g.lng, governorate: g.name, geoPrecision: 'governorate' };
  }
  return { lat: 33.8547, lng: 35.8623, governorate: 'Lebanon', geoPrecision: 'country' };
}

export async function GET() {
  try {
    const res = await fetch(
      'https://search.worldbank.org/api/v2/projects?format=json&fl=id,project_name,totalamt,status,approval_date,closingdate,boardapprovaldate,sector_name,countryshortname,project_abstract,impagency&countrycode_exact=LB&rows=60&os=0',
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) throw new Error(`WB API: ${res.status}`);
    const raw = await res.json();
    const projectMap = raw.projects ?? {};
    const projects = Object.values(projectMap)
      .filter((p: unknown): p is Record<string, unknown> => p !== null && typeof p === 'object' && 'id' in p)
      .map((p) => {
        const name = String(p.project_name ?? '');
        const sector = String(p.sector_name ?? 'N/A');
        const abstract = String(p.project_abstract ?? '');
        const location = inferProjectLocation(`${name} ${abstract}`);
        const amount = Number(p.totalamt ?? 0);
        const approvalDate = String(p.approval_date ?? p.boardapprovaldate ?? '');
        const closingDate = String(p.closingdate ?? '');
        const now = Date.now();
        const startTs = approvalDate ? new Date(approvalDate).getTime() : now;
        const endTs = closingDate ? new Date(closingDate).getTime() : now;
        const progressPct =
          Number.isFinite(startTs) && Number.isFinite(endTs) && endTs > startTs
            ? Math.max(0, Math.min(100, ((now - startTs) / (endTs - startTs)) * 100))
            : null;

        return {
          id: p.id,
          name,
          amount,
          status: String(p.status ?? ''),
          approvalDate,
          closingDate: closingDate || null,
          sector,
          implementingAgency: String(p.impagency ?? ''),
          progressPct: progressPct == null ? null : Number(progressPct.toFixed(1)),
          latitude: location.lat,
          longitude: location.lng,
          governorate: location.governorate,
          geoPrecision: location.geoPrecision,
        };
      });
    const total = Number(raw.total) || projects.length;
    return NextResponse.json(
      { projects, total, updatedAt: new Date().toISOString() },
      { headers: { 'Cache-Control': 's-maxage=86400, stale-while-revalidate=172800' } }
    );
  } catch (err) {
    console.error('World Bank API error:', err);
    return NextResponse.json({ projects: [], total: 0, updatedAt: new Date().toISOString() });
  }
}
