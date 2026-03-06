/**
 * Normalizes event titles for deduplication keys.
 */

/**
 * Normalizes title: lowercase, strip punctuation (keep Arabic), collapse spaces, trim, max 80 chars.
 */
export function normalizeTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s\u0600-\u06FF]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 80);
}
