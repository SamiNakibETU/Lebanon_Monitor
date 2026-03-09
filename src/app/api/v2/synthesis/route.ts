/**
 * API v2 synthesis — AI briefing Lumière/Ombre.
 * Returns cached synthesis from Redis, or generates on cache miss.
 * Claude API can take 15-45s — needs longer timeout.
 */
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { getSanitizedAnthropicKey } from '@/lib/anthropic';
import { getSanitizedGroqKey } from '@/lib/groq-client';
import { isRedisConfigured } from '@/lib/redis';
import { getCachedSynthesis, generateSynthesis } from '@/worker/synthesis';

function placeholder() {
  return {
    lumiere: 'Synthèse en cours de génération. Réessayez dans quelques minutes.',
    ombre: 'Synthèse en cours de génération. Réessayez dans quelques minutes.',
    generated_at: new Date().toISOString(),
  };
}

export async function GET() {
  try {

    let result = await getCachedSynthesis();
    if (result) {
      return NextResponse.json(result, {
        headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=3600' },
      });
    }

    const groqKey = getSanitizedGroqKey();
    const anthropicKey = getSanitizedAnthropicKey();
    if (!groqKey && !anthropicKey) {
      console.warn('Synthesis: neither GROQ_API_KEY nor ANTHROPIC_API_KEY configured');
      return NextResponse.json(placeholder(), {
        headers: { 'Cache-Control': 's-maxage=60' },
      });
    }

    if (!isRedisConfigured()) {
      console.warn('Synthesis: Redis not configured (UPSTASH_REDIS_REST_URL/TOKEN)');
    }

    result = await generateSynthesis();
    if (result) {
      return NextResponse.json(result, {
        headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=3600' },
      });
    }

    console.warn('Synthesis: generateSynthesis returned null (API error or parse failure)');
    return NextResponse.json(placeholder(), {
      headers: { 'Cache-Control': 's-maxage=60' },
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
