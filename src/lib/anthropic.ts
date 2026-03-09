/**
 * Anthropic API key sanitization.
 * Railway/dotenv can inject spaces, quotes, CRLF — API rejects them.
 * Handles invisible chars, newlines, trailing spaces, zero-width chars, BOM.
 */

export type AnthropicKeyStatus =
  | 'ok'
  | 'missing_env'
  | 'too_short'
  | 'wrong_prefix'
  | 'empty_after_strip';

export function getAnthropicKeyStatus(): AnthropicKeyStatus {
  const raw = process.env.ANTHROPIC_API_KEY;
  if (!raw || typeof raw !== 'string') return 'missing_env';

  const key = raw
    .replace(/^["']|["']$/g, '')
    // strip whitespace, zero-width space, NBSP, BOM, other invisible Unicode
    .replace(/[\s\u200B\u200C\u200D\uFEFF\u00A0\u2028\u2029]/g, '')
    .replace(/\r\n|\r|\n/g, '')
    .trim();

  if (key.length === 0) return 'empty_after_strip';
  if (key.length < 20) return 'too_short';
  if (!key.startsWith('sk-ant-')) return 'wrong_prefix';

  return 'ok';
}

export function getSanitizedAnthropicKey(): string | null {
  const raw = process.env.ANTHROPIC_API_KEY;
  if (!raw || typeof raw !== 'string') return null;

  const key = raw
    .replace(/^["']|["']$/g, '')
    .replace(/[\s\u200B\u200C\u200D\uFEFF\u00A0\u2028\u2029]/g, '')
    .replace(/\r\n|\r|\n/g, '')
    .trim();

  if (key.length < 20) return null;
  if (!key.startsWith('sk-ant-')) return null;

  return key;
}
