/**
 * Anthropic API key sanitization.
 * Railway/dotenv can inject spaces or quotes — API rejects them.
 * Format attendu: sk-ant-api03-xxxx sans espaces ni guillemets.
 */

const VALID_PREFIX = 'sk-ant-';

export function getSanitizedAnthropicKey(): string | null {
  const raw = process.env.ANTHROPIC_API_KEY;
  if (!raw || typeof raw !== 'string') return null;

  let key = raw.trim();
  if (key.startsWith('"') && key.endsWith('"')) key = key.slice(1, -1);
  if (key.startsWith("'") && key.endsWith("'")) key = key.slice(1, -1);
  key = key.trim();

  if (!key.startsWith(VALID_PREFIX)) return null;
  return key;
}
