/**
 * Agent synthesis — constrained analyst synthesis with citations.
 * Uses retrieval + context pack, Groq, guards. No uncited facts.
 */

export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { agentSynthesisRequestSchema } from '@/lib/agents/schemas';
import { toolRunRetrieval, toolGetVitality } from '@/lib/agents/tools';
import { callGroq, getSanitizedGroqKey } from '@/lib/groq-client';
import { buildContextPackFromRetrieval } from '@/lib/retrieval/context-pack';
import { capCitations, truncateContent, shouldIncludeUncertainty } from '@/lib/agents/guards';

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

  const parsed = agentSynthesisRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten(), code: 400 },
      { status: 400 }
    );
  }

  const { query, contextHint } = parsed.data;
  const objectTypes = contextHint
    ? ([contextHint === 'vitality' ? 'events' : contextHint] as const)
    : (['events', 'episodes', 'places', 'actors'] as const);

  try {
    const retrievalResult = await toolRunRetrieval({
      q: query,
      objectTypes: [...objectTypes],
      limit: 25,
      offset: 0,
    });
    const vitalityResult = contextHint === 'vitality' || !contextHint
      ? await toolGetVitality()
      : { data: [], citations: [] as string[], truncated: false };

    const contextParts: string[] = [];
    const allCitations: string[] = [...retrievalResult.citations, ...vitalityResult.citations];

    if (typeof retrievalResult.data === 'object' && retrievalResult.data && 'events' in retrievalResult.data) {
      const d = retrievalResult.data as { events: Array<{ title: string; occurredAt: string }> };
      for (const e of (d.events ?? []).slice(0, 10)) {
        contextParts.push(`- ${e.title} (${e.occurredAt?.slice(0, 10) ?? '—'})`);
      }
    }
    if (Array.isArray(vitalityResult.data)) {
      contextParts.push('--- Vitalité ---');
      for (const f of vitalityResult.data.slice(0, 8)) {
        contextParts.push(`- ${f}`);
      }
    }

    const contextBlock = contextParts.join('\n').slice(0, 8000);

    const systemPrompt = [
      'Tu es analyste OSINT pour le Liban. Tu produis une synthèse factuelle.',
      'RÈGLES STRICTES:',
      '1. Cite TOUJOURS tes sources avec [event:id], [episode:id], [place:id], [actor:id].',
      '2. Aucun fait sans citation.',
      '3. Si les données sont partielles, ajoute une section "Incertitudes" en fin de réponse.',
      '4. Style: concis, factuel, français. Max 250 mots.',
    ].join('\n');

    const userPrompt = [
      `Question: ${query}`,
      '',
      'Contexte (citations disponibles):',
      contextBlock,
      '',
      'Réponds avec des citations. Exemple: "L\'événement X [event:uuid] indique que..."',
    ].join('\n');

    const raw = await callGroq({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 600,
      timeoutMs: 25_000,
    });

    const content = raw ? truncateContent(raw, 4000) : 'Synthèse indisponible.';
    const citations = capCitations(allCitations, 50);
    const hasUncertainty = shouldIncludeUncertainty(
      citations,
      retrievalResult.truncated || vitalityResult.truncated || false,
      false
    );

    return NextResponse.json({
      content,
      citations,
      uncertainty: hasUncertainty
        ? 'Les données ci-dessus peuvent être partielles. Vérifier les sources originales.'
        : undefined,
      truncated: retrievalResult.truncated || vitalityResult.truncated,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Agent synthesis error:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 500 },
      { status: 500 }
    );
  }
}
