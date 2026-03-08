/**
 * Anthropic API key sanitization.
 * Railway/dotenv can inject spaces, quotes, CRLF — API rejects them.
 * Handles invisible chars, newlines, trailing spaces.
 */

export function getSanitizedAnthropicKey(): string | null {
  const raw = process.env.ANTHROPIC_API_KEY;
  if (!raw || typeof raw !== 'string') return null;

  let key = raw
    .replace(/^["']|["']$/g, '')
    .replace(/\s+/g, '')
    .replace(/\r\n|\r|\n/g, '')
    .trim();

  if (key.length < 20) return null;
  if (!key.startsWith('sk-ant-')) return null;

  return key;
}
