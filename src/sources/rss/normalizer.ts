/**
 * Normalizes RSS items to LebanonEvent[].
 */

import type { LebanonEvent } from '@/types/events';
import { classifyByKeywords } from '@/lib/classification/classifier';
import { LEBANON_CITIES } from '@/config/lebanon';
import { normalizeText } from '@/lib/text-normalize';
import { resolveCityCoords } from './config';
import type { RssItem } from './types';
import { RSS_CONFIG } from './config';

const CULTURE_FEEDS = new Set(['Agenda Culturel', 'Beirut.com', 'Mondanite', "L'Orient Littéraire"]);
const SOLIDARITY_FEEDS = new Set([
  'UNDP Lebanon',
  'UNICEF Lebanon',
  'UNRWA',
  'UNHCR Lebanon',
  'WFP Lebanon',
  'ICRC',
  'ReliefWeb Lebanon',
  'GN Lebanon Solidarity',
  'GN Lebanon Reconstruction',
  'GN Lebanon Ceasefire',
]);

const CULTURE_KEYWORDS = /(concert|exposition|festival|vernissage|th[ée][âa]tre|cin[ée]ma|musique|spectacle|performance|gallery|exhibit|art\s|artist|book\s?launch|litt[ée]r|po[ée]sie|danse|ballet|opera|museum|mus[ée]e|patrimoine|heritage|film|documentary|documentaire|atelier|workshop|conference|conf[ée]rence|screening)/i;
const SOLIDARITY_KEYWORDS = /(aid\s|humanitarian|distribution|relief\s|food\s(aid|distribution)|medical\s(aid|team)|vaccin|school\s(reopened|opening)|cash assistance|displaced|support\s(for|to)|don(ation|s)|solidarity|solidarit[ée]|b[ée]n[ée]vol|volunteer|refu(gee|gi[ée])|shelter|abri|accueil|convoy|acheminement|assistance|aide\s(humanitaire|alimentaire|m[ée]dicale)|livraison|rescue|sauvetage|[ée]vacuation\s(safe|civilian)|secour|croix.rouge|red\s?cross|m[ée]decins\s?sans|UNHCR|UNICEF|WFP|UNRWA|OMS|WHO|donor|fundraising|funded|donated|delivered|trained|enrolled|graduated)/i;
const RECONSTRUCTION_KEYWORDS = /(reconstruction|rehabilitation|rebuild|project\s?launch|inauguration|restauration|r[ée]habilitation|infrastructure\s(restored|repaired)|reopen|r[ée]ouverture|restored|remise\s?en\s?[ée]tat|replant|reforestation|reboisement|[ée]nergie\s?(solaire|renouvelable)|solar|renewable|restoration|repaired|renovated|rebuilt|reopened)/i;
const DIPLOMACY_POSITIVE_KEYWORDS = /(ceasefire|cessez.le.feu|accord|agreement|peace\s?(talk|deal|agreement|process)|paix|n[ée]gociation|dialogue|reconnaissance|recognition|election|[ée]lection|vote|d[ée]mocratie|democracy|lib[ée]ration|liberation|retrait|withdrawal|truce|tr[êe]ve)/i;
const WAR_NEGATIVE_KEYWORDS = /(strike|strikes|killed|dead|attack|attacks|bomb|bombing|missile|rocket|drone|raid|airstrike|shelling|clash|battle|casualt)/i;

function classifyRssContent(input: {
  feedName?: string;
  text: string;
  baseClassification: LebanonEvent['classification'];
  baseConfidence: number;
}): {
  classification: LebanonEvent['classification'];
  confidence: number;
  category: LebanonEvent['category'];
} {
  const feed = input.feedName ?? '';
  const text = input.text;
  const isHumanitarianFeed = SOLIDARITY_FEEDS.has(feed);

  if (CULTURE_FEEDS.has(feed) || CULTURE_KEYWORDS.test(text)) {
    return { classification: 'lumiere', confidence: Math.max(input.baseConfidence, 0.82), category: 'cultural_event' };
  }
  if (isHumanitarianFeed && !WAR_NEGATIVE_KEYWORDS.test(text)) {
    return { classification: 'lumiere', confidence: Math.max(input.baseConfidence, 0.82), category: 'solidarity' };
  }
  if (SOLIDARITY_FEEDS.has(feed) || SOLIDARITY_KEYWORDS.test(text)) {
    return { classification: 'lumiere', confidence: Math.max(input.baseConfidence, 0.8), category: 'solidarity' };
  }
  if (RECONSTRUCTION_KEYWORDS.test(text)) {
    return { classification: 'lumiere', confidence: Math.max(input.baseConfidence, 0.78), category: 'reconstruction' };
  }
  if (DIPLOMACY_POSITIVE_KEYWORDS.test(text)) {
    return { classification: 'lumiere', confidence: Math.max(input.baseConfidence, 0.75), category: 'institutional_progress' };
  }

  if (input.baseClassification === 'lumiere') {
    return { classification: 'lumiere', confidence: input.baseConfidence, category: 'cultural_event' };
  }
  if (input.baseClassification === 'ombre') {
    return { classification: 'ombre', confidence: input.baseConfidence, category: 'political_tension' };
  }
  return { classification: 'neutre', confidence: input.baseConfidence, category: 'neutral' };
}

export function normalize(
  items: Array<RssItem & { feedName?: string }>,
  fetchedAt: Date
): LebanonEvent[] {
  const events: LebanonEvent[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const title = normalizeText(item.title) || 'Untitled';
    const snippet = normalizeText(item.contentSnippet ?? '');
    const text = `${title} ${snippet}`;
    const { classification: baseClassification, confidence: baseConfidence } = classifyByKeywords(text);
    const { classification, confidence, category } = classifyRssContent({
      feedName: item.feedName,
      text,
      baseClassification,
      baseConfidence,
    });
    const resolved = resolveCityCoords(title, snippet);
    const lat = resolved?.lat ?? LEBANON_CITIES.Beirut.lat;
    const lng = resolved?.lng ?? LEBANON_CITIES.Beirut.lng;

    const id = `rss-${(item.link ?? title).replace(/[^a-zA-Z0-9]/g, '_').slice(0, 60)}-${i}`;

    events.push({
      id,
      source: 'rss',
      title,
      description: snippet || undefined,
      url: item.link,
      timestamp: item.pubDate ? new Date(item.pubDate) : new Date(),
      latitude: lat,
      longitude: lng,
      classification,
      confidence,
      category,
      severity: 'low',
      metadata: {
        fetchedAt,
        ttlSeconds: RSS_CONFIG.ttlSeconds,
        sourceReliability: 'medium',
        geoPrecision: resolved?.geoPrecision ?? 'country',
        resolvedPlaceName: resolved?.resolvedPlaceName ?? 'Lebanon',
        evidence: {
          geocodeMethod: resolved?.geocodeMethod ?? 'country_fallback',
          geocodeConfidence: resolved?.geocodeConfidence ?? 0.3,
        },
        extractedEntities: {
          persons: [],
          parties: [],
          cities: resolved?.resolvedPlaceName ? [resolved.resolvedPlaceName] : [],
          organizations: item.feedName ? [item.feedName] : [],
        },
      },
    });
  }

  return events;
}
