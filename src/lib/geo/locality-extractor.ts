import { LEBANON_CITIES } from '@/config/lebanon';
import { callGroq, getSanitizedGroqKey } from '@/lib/groq-client';

export interface LocalityMatch {
  name: string;
  lat: number;
  lng: number;
  method: 'exact' | 'fuzzy' | 'llm';
}

function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\u0600-\u06ff\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i]![0] = i;
  for (let j = 0; j <= b.length; j++) dp[0]![j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(
        dp[i - 1]![j]! + 1,
        dp[i]![j - 1]! + 1,
        dp[i - 1]![j - 1]! + cost
      );
    }
  }
  return dp[a.length]![b.length]!;
}

function exactMatch(text: string): LocalityMatch | null {
  const n = normalize(text);
  for (const [name, coords] of Object.entries(LEBANON_CITIES)) {
    const key = normalize(name);
    if (key.length < 3) continue;
    if (n.includes(key)) {
      return { name, lat: coords.lat, lng: coords.lng, method: 'exact' };
    }
  }
  return null;
}

function fuzzyMatch(text: string): LocalityMatch | null {
  const n = normalize(text);
  const words = n.split(' ').filter(Boolean);
  const chunks = new Set<string>(words);
  for (let i = 0; i < words.length - 1; i++) {
    chunks.add(`${words[i]} ${words[i + 1]}`);
  }

  let best: LocalityMatch | null = null;
  let bestDistance = 99;

  for (const token of chunks) {
    if (token.length < 4) continue;
    for (const [name, coords] of Object.entries(LEBANON_CITIES)) {
      const key = normalize(name);
      if (Math.abs(token.length - key.length) > 3) continue;
      const d = levenshtein(token, key);
      if (d <= 2 && d < bestDistance) {
        bestDistance = d;
        best = { name, lat: coords.lat, lng: coords.lng, method: 'fuzzy' };
      }
    }
  }

  return best;
}

async function llmMatch(title: string, description?: string): Promise<LocalityMatch | null> {
  if (!getSanitizedGroqKey()) return null;
  const prompt = [
    'Extract the most specific Lebanese locality from this text.',
    'Return JSON only: {"locality":"<name or NULL>"}',
    `Title: ${title}`,
    `Description: ${description ?? ''}`,
  ].join('\n');
  const out = await callGroq({
    messages: [
      { role: 'system', content: 'You extract localities for OSINT geocoding. Return strict JSON only.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0,
    max_tokens: 80,
    timeoutMs: 10_000,
  });
  if (!out) return null;
  const jsonChunk = out.match(/\{[\s\S]*\}/)?.[0];
  if (!jsonChunk) return null;
  try {
    const parsed = JSON.parse(jsonChunk) as { locality?: string | null };
    const locality = typeof parsed.locality === 'string' ? parsed.locality.trim() : '';
    if (!locality || /^null$/i.test(locality)) return null;
    const key = Object.keys(LEBANON_CITIES).find((k) => normalize(k) === normalize(locality));
    if (!key) return null;
    const coords = LEBANON_CITIES[key]!;
    return { name: key, lat: coords.lat, lng: coords.lng, method: 'llm' };
  } catch {
    return null;
  }
}

export async function extractBestLocality(input: {
  title: string;
  description?: string;
  allowLlm?: boolean;
}): Promise<LocalityMatch | null> {
  const text = `${input.title} ${input.description ?? ''}`.trim();
  if (!text) return null;
  const exact = exactMatch(text);
  if (exact) return exact;
  const fuzzy = fuzzyMatch(text);
  if (fuzzy) return fuzzy;
  if (input.allowLlm) return llmMatch(input.title, input.description);
  return null;
}

