import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch(
      'https://search.worldbank.org/api/v2/projects?format=json&fl=id,project_name,totalamt,status,approval_date&countrycode_exact=LB&rows=10&os=0',
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) throw new Error(`WB API: ${res.status}`);
    const raw = await res.json();
    const projectMap = raw.projects ?? {};
    const projects = Object.values(projectMap)
      .filter((p: unknown): p is Record<string, unknown> => p !== null && typeof p === 'object' && 'id' in p)
      .map((p) => ({
        id: p.id,
        name: p.project_name ?? '',
        amount: p.totalamt ?? 0,
        status: p.status ?? '',
        approvalDate: p.approval_date ?? '',
      }));
    const total = Number(raw.total) || projects.length;
    return NextResponse.json(
      { projects, total },
      { headers: { 'Cache-Control': 's-maxage=86400, stale-while-revalidate=172800' } }
    );
  } catch (err) {
    console.error('World Bank API error:', err);
    return NextResponse.json({ projects: [], total: 0 });
  }
}
