/**
 * Text normalization helpers for feed/source content.
 * Fixes common mojibake and decodes basic HTML entities.
 */

function scoreBadEncoding(s: string): number {
  let score = 0;
  score += (s.match(/�/g) ?? []).length * 4;
  score += (s.match(/Ã|Â|â€|â€™|â€œ|â€\u009d|Ð|Ñ/g) ?? []).length * 2;
  return score;
}

function decodeBasicEntities(s: string): string {
  return s
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;/gi, ' ');
}

/**
 * Attempts to recover UTF-8 text interpreted as Latin-1.
 */
function tryLatin1ToUtf8(s: string): string {
  try {
    return Buffer.from(s, 'latin1').toString('utf8');
  } catch {
    return s;
  }
}

export function normalizeText(input: string | null | undefined): string {
  const raw = (input ?? '').trim();
  if (!raw) return '';

  const entityDecoded = decodeBasicEntities(raw);
  const repaired = tryLatin1ToUtf8(entityDecoded);

  const best =
    scoreBadEncoding(repaired) < scoreBadEncoding(entityDecoded) ? repaired : entityDecoded;

  return best.replace(/\s+/g, ' ').trim();
}

