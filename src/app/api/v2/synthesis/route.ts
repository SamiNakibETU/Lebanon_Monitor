/**
 * API v2 synthesis — AI briefing Lumière/Ombre.
 * Returns cached synthesis from Redis, or generates on cache miss.
 */

import { NextResponse } from 'next/server';
import { getCachedSynthesis, generateSynthesis } from '@/worker/synthesis';

export async function GET() {
  try {
    let result = await getCachedSynthesis();
    if (!result && process.env.ANTHROPIC_API_KEY) {
      result = await generateSynthesis();
    }
    if (!result) {
      return NextResponse.json(
        {
          lumiere: 'Synthèse en cours de génération. Réessayez dans quelques minutes.',
          ombre: 'Synthèse en cours de génération. Réessayez dans quelques minutes.',
          generated_at: new Date().toISOString(),
        },
        {
          headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' },
        }
      );
    }
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=3600' },
    });
  } catch (err) {
    console.error('API v2 synthesis error', err);
    return NextResponse.json(
      {
        lumiere: 'Erreur de chargement.',
        ombre: 'Erreur de chargement.',
        generated_at: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
