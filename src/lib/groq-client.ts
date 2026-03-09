/**
 * Centralized Groq API client for Lebanon Monitor.
 * OpenAI-compatible chat completions endpoint.
 */

const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.1-8b-instant';

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqRequest {
  messages: GroqMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  timeoutMs?: number;
}

export function getSanitizedGroqKey(): string | null {
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key || key.length < 10) return null;
  return key;
}

export async function callGroq(req: GroqRequest): Promise<string | null> {
  const apiKey = getSanitizedGroqKey();
  if (!apiKey) return null;

  const body = {
    model: req.model ?? DEFAULT_MODEL,
    temperature: req.temperature ?? 0,
    max_tokens: req.max_tokens ?? 1024,
    messages: req.messages,
  };

  const timeoutMs = req.timeoutMs ?? 10_000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(GROQ_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Groq API ${res.status}: ${text}`);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Groq call failed: ${msg}`);
  } finally {
    clearTimeout(timeout);
  }
}
