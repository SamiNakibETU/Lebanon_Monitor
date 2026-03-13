/**
 * Citations — format object references for agent output.
 */

export type CitationType = 'event' | 'episode' | 'place' | 'actor' | 'claim';

export function formatCitation(type: CitationType, id: string): string {
  return `[${type}:${id}]`;
}

export function parseCitation(ref: string): { type: CitationType; id: string } | null {
  const m = ref.match(/^\[(event|episode|place|actor|claim):([^\]]+)\]$/);
  if (!m) return null;
  return { type: m[1] as CitationType, id: m[2] ?? '' };
}
