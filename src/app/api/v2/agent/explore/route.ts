/**
 * Agent explore — constrained exploration with focus on place/actor/episode/vitality.
 * Uses context packs, Groq, guards. No uncited facts.
 */

export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { agentExploreRequestSchema } from '@/lib/agents/schemas';
import {
  toolGetPlace,
  toolGetEpisode,
  toolGetVitality,
} from '@/lib/agents/tools';
import { callGroq, getSanitizedGroqKey } from '@/lib/groq-client';
import { capCitations, truncateContent, shouldIncludeUncertainty } from '@/lib/agents/guards';
import { withClient, isDbConfigured } from '@/db/client';
import { buildActorContext } from '@/lib/retrieval/context-packs/actor-context';

async function getActorContext(entityId: string) {
  if (!isDbConfigured()) return null;
  return withClient((client) => buildActorContext(client, entityId));
}

export async function POST(request: NextRequest) {
  if (!getSanitizedGroqKey()) {
    return NextResponse.json(
      { error: 'GROQ_API_KEY not configured', code: 503 },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', code: 400 },
      { status: 400 }
    );
  }

  const parsed = agentExploreRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten(), code: 400 },
      { status: 400 }
    );
  }

  const { query, focus, id } = parsed.data;

  try {
    let contextParts: string[] = [];
    let citations: string[] = [];
    let truncated = false;

    if (focus === 'place' && id) {
      const res = await toolGetPlace(id);
      if (res) {
        contextParts = Array.isArray(res.data) ? res.data as string[] : [];
        citations = res.citations;
        truncated = res.truncated ?? false;
      }
    } else if (focus === 'actor' && id) {
      const pack = await getActorContext(id);
      if (pack) {
        contextParts = [...pack.facts, ...pack.claims];
        citations = pack.citations;
      }
    } else if (focus === 'episode' && id) {
      const res = await toolGetEpisode(id);
      if (res) {
        contextParts = Array.isArray(res.data) ? res.data as string[] : [];
        citations = res.citations;
        truncated = res.truncated ?? false;
      }
    } else if (focus === 'vitality') {
      const res = await toolGetVitality(id);
      contextParts = Array.isArray(res.data) ? res.data as string[] : [];
      citations = res.citations;
      truncated = res.truncated ?? false;
    } else {
      const res = await toolGetVitality();
      contextParts = Array.isArray(res.data) ? res.data as string[] : [];
      citations = res.citations;
      truncated = res.truncated ?? false;
    }

    const contextBlock = contextParts.join('\n').slice(0, 6000);

    const systemPrompt = [
      'Tu es analyste OSINT pour le Liban. Tu explores un contexte donné.',
      'RÈGLES:',
      '1. Cite TOUJOURS avec [event:id], [episode:id], [place:id], [actor:id], [claim:id].',
      '2. Aucun fait sans citation.',
      '3. Si données partielles, section "Incertitudes" en fin.',
      '4. Style: concis, factuel, français. Max 200 mots.',
    ].join('\n');

    const userPrompt = [
      `Exploration: ${query}`,
      '',
      'Contexte:',
      contextBlock || '(Aucun contexte disponible)',
      '',
      'Réponds en citant les sources.',
    ].join('\n');

    const raw = await callGroq({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 500,
      timeoutMs: 20_000,
    });

    const content = raw ? truncateContent(raw, 3500) : 'Exploration indisponible.';
    const cappedCitations = capCitations(citations, 50);
    const hasUncertainty = shouldIncludeUncertainty(cappedCitations, truncated, false);

    return NextResponse.json({
      content,
      citations: cappedCitations,
      uncertainty: hasUncertainty
        ? 'Données potentiellement partielles.'
        : undefined,
      truncated,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Agent explore error:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 500 },
      { status: 500 }
    );
  }
}
