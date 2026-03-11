import { withClient, isDbConfigured } from '@/db/client';
import { listEvents } from '@/db/repositories/event-repository';
import { fetchPublicTwitterRss, type SocialCaptureItem } from '@/sources/social/public-twitter';

export interface SocialEventLink extends SocialCaptureItem {
  linkedEventId: string | null;
  linkedEventTitle: string | null;
  linkScore: number;
}

function normalizeKey(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/gi, ' ').trim();
}

function computeLinkScore(tweetText: string, eventTitle: string, eventPlace?: string | null): number {
  const a = new Set(normalizeKey(tweetText).split(' ').filter((t) => t.length > 2));
  const b = new Set(normalizeKey(`${eventTitle} ${eventPlace ?? ''}`).split(' ').filter((t) => t.length > 2));
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const token of a) if (b.has(token)) inter++;
  const union = new Set([...a, ...b]).size;
  return union > 0 ? inter / union : 0;
}

export async function runSocialMediaIngest(): Promise<SocialEventLink[]> {
  const tweets = await fetchPublicTwitterRss();
  if (!isDbConfigured() || tweets.length === 0) {
    return tweets.map((t) => ({ ...t, linkedEventId: null, linkedEventTitle: null, linkScore: 0 }));
  }

  const events = await withClient(async (client) => {
    const out = await listEvents(client, { limit: 120, from_date: new Date(Date.now() - 48 * 60 * 60 * 1000) });
    return out.events;
  });

  return tweets.map((tweet) => {
    let bestId: string | null = null;
    let bestTitle: string | null = null;
    let bestScore = 0;
    for (const event of events) {
      const meta = (event.metadata ?? {}) as Record<string, unknown>;
      const place = typeof meta.resolvedPlaceName === 'string' ? meta.resolvedPlaceName : null;
      const score = computeLinkScore(tweet.text, event.canonical_title, place);
      if (score > bestScore) {
        bestScore = score;
        bestId = event.id;
        bestTitle = event.canonical_title;
      }
    }
    return {
      ...tweet,
      linkedEventId: bestScore >= 0.08 ? bestId : null,
      linkedEventTitle: bestScore >= 0.08 ? bestTitle : null,
      linkScore: Number(bestScore.toFixed(3)),
    };
  });
}

