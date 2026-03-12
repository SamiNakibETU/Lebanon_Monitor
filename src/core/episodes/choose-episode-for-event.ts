/**
 * Episode linking — choose or create episode for an event.
 * Phase 3 — analytic clusters by type, place (or governorate), and time window.
 */

const TIME_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days — event can join if within 7d of last
const OPEN_WINDOW_MS = 48 * 60 * 60 * 1000; // 48h — only "open" episodes (recently active)

export interface EpisodeCandidate {
  id: string;
  eventType: string | null;
  placeKey: string;
  governorateKey?: string | null;
  lastEventAt: Date;
}

export interface EventForLinking {
  id: string;
  eventType: string | null;
  occurredAt: Date;
  metadata?: {
    resolvedPlaceName?: string | null;
    admin1?: string | null;
    latitude?: number;
    longitude?: number;
  } | null;
}

/**
 * Map place name to Lebanese governorate for matching at admin1 level.
 */
export function placeToGovernorate(placeKey: string): string | null {
  const p = placeKey.toLowerCase();
  if (['tripoli', 'zgharta', 'ehden', 'batroun', 'koura', 'bcharre'].includes(p)) return 'North';
  if (['sidon', 'saida', 'tyre', 'sour', 'jezzine'].includes(p)) return 'South';
  if (['nabatieh', 'marjayoun', 'bint jbeil', 'khiam', 'hasbaya'].includes(p)) return 'Nabatieh';
  if (['zahle', 'baalbek', 'hermel', 'arsal', 'qaa', 'chtoura', 'anjar'].includes(p)) return 'Bekaa';
  if (['jounieh', 'byblos', 'jbeil', 'baabda', 'aley', 'beiteddine', 'hammana'].includes(p)) return 'Mount Lebanon';
  if (['beirut', 'beyrouth', 'achrafieh', 'hamra', 'dahieh'].includes(p)) return 'Beirut';
  return null;
}

function placeMatches(a: string, b: string, govA: string | null, govB: string | null): boolean {
  if (a === b) return true;
  if (govA && govB && govA === govB) return true;
  return false;
}

/**
 * Find an episode that accepts this event (same type, same place or governorate, within time window).
 * Only considers "open" episodes (last event within 48h).
 */
export function chooseEpisodeForEvent(
  event: EventForLinking,
  candidates: EpisodeCandidate[],
  now = new Date()
): EpisodeCandidate | null {
  const placeKey = getPlaceKey(event);
  const eventGov = event.metadata?.admin1 ?? placeToGovernorate(placeKey);
  const openCutoff = now.getTime() - OPEN_WINDOW_MS;

  return candidates.find((c) => {
    const isOpen = c.lastEventAt.getTime() >= openCutoff;
    if (!isOpen) return false;
    const sameType = (c.eventType ?? '') === (event.eventType ?? '');
    const samePlace = placeMatches(placeKey, c.placeKey, eventGov, c.governorateKey ?? null);
    const withinWindow = event.occurredAt.getTime() - c.lastEventAt.getTime() <= TIME_WINDOW_MS;
    return sameType && samePlace && withinWindow;
  }) ?? null;
}

export function getPlaceKey(event: EventForLinking): string {
  const meta = event.metadata;
  const place = meta?.resolvedPlaceName?.trim();
  if (place) return place;
  const lat = meta?.latitude;
  const lng = meta?.longitude;
  if (typeof lat === 'number' && typeof lng === 'number') {
    return `${lat.toFixed(2)},${lng.toFixed(2)}`;
  }
  return 'unknown';
}
