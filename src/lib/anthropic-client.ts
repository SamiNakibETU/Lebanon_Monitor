/**
 * Centralized Anthropic API client for Lebanon Monitor.
 * Handles Claude calls for synthesis and classification.
 * Uses system message when available for clearer role definition.
 */

import { getSanitizedAnthropicKey } from './anthropic';

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-3-5-haiku-latest';

export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AnthropicRequest {
  system?: string;
  messages: AnthropicMessage[];
  model?: string;
  max_tokens?: number;
  /** 0 = deterministic (classification, structured output), 1 = creative */
  temperature?: number;
}

export interface AnthropicResponse {
  content: string;
  stop_reason?: string;
}

/**
 * Call Anthropic Messages API.
 * Returns the first text block from the response, or null on error.
 */
export async function callAnthropic(req: AnthropicRequest): Promise<string | null> {
  const apiKey = getSanitizedAnthropicKey();
  if (!apiKey) return null;

  const body: Record<string, unknown> = {
    model: req.model ?? DEFAULT_MODEL,
    max_tokens: req.max_tokens ?? 2048,
    messages: req.messages,
    temperature: req.temperature ?? 0,
  };

  if (req.system && req.system.trim().length > 0) {
    body.system = req.system;
  }

  try {
    const res = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Anthropic API ${res.status}: ${text}`);
    }

    const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const firstBlock = data.content?.find((b) => b.type === 'text');
    const text = firstBlock?.text ?? '';
    return text || null;
  } catch (err) {
    console.error('Anthropic API error:', err);
    return null;
  }
}
