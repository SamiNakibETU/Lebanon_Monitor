/**
 * UNIFIL press releases — last 5 statements.
 */

import { NextResponse } from 'next/server';
import { fetchUnifilPress } from '@/sources/unifil/fetcher';

export async function GET() {
  try {
    const result = await fetchUnifilPress();
    if (!result.ok) {
      return NextResponse.json({ items: [] }, {
        headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=1800' },
      });
    }
    return NextResponse.json({ items: result.items }, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=1800' },
    });
  } catch (err) {
    console.error('UNIFIL API error', err);
    return NextResponse.json({ items: [] }, {
      headers: { 'Cache-Control': 's-maxage=60' },
    });
  }
}
