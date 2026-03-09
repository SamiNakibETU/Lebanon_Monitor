/**
 * Event enrichment pipeline: language, entities, taxonomy, place resolution.
 * Phase D + E — NLP / enrichissement / géospatial.
 */

import type { LebanonEvent } from '@/types/events';
import type { ExtractedEntities } from '@/lib/nlp/entity-extract';
import { heuristicLanguageProvider } from '@/providers/language';
import { extractEntities } from '@/lib/nlp/entity-extract';
import { resolvePlaceFromCandidates } from '@/geo';
import { LEBANON_CENTER } from '@/core/constants';
import { CATEGORY_TO_TAXONOMY, type TaxonomyCode } from '../taxonomy';

const DEFAULT_COORDS_TOLERANCE = 0.02; // ~2km — consider coords as "default" if within this of Beirut center

export interface EnrichedMetadata {
  originalLanguage?: 'ar' | 'fr' | 'en';
  languageConfidence?: number;
  taxonomyCode?: TaxonomyCode;
  extractedEntities?: ExtractedEntities;
}

/**
 * Enriches an event with language detection, entity extraction, and taxonomy.
 */
export function enrichEvent(event: LebanonEvent): LebanonEvent {
  const text = [event.title, event.description].filter(Boolean).join(' ');
  if (!text) return event;

  const langResult = heuristicLanguageProvider.detectSync?.(text) ?? {
    language: 'en' as const,
    confidence: 0.5,
  };

  const entities = extractEntities(text);

  const taxonomyCode = CATEGORY_TO_TAXONOMY[event.category] as TaxonomyCode | undefined;

  let { latitude, longitude } = event;
  let geoPrecision: LebanonEvent['metadata']['geoPrecision'] = 'unknown';
  let resolvedPlaceName: string | undefined;
  let geocodeMethod: 'source_exact' | 'gazetteer_match' | 'admin_fallback' | 'country_fallback' | 'unknown' = 'unknown';
  let geocodeConfidence = 0.2;
  let admin1: string | undefined;

  if (entities.cities.length > 0) {
    const resolved = resolvePlaceFromCandidates(entities.cities);
    if (resolved) {
      geoPrecision = resolved.geoPrecision;
      resolvedPlaceName = resolved.namePrimary;
      geocodeMethod = resolved.geoPrecision === 'city' || resolved.geoPrecision === 'district'
        ? 'gazetteer_match'
        : 'admin_fallback';
      geocodeConfidence = resolved.geoPrecision === 'city' ? 0.9 : 0.75;
      admin1 = inferAdmin1(resolved.namePrimary);
      const isDefaultCoords =
        Math.abs(event.latitude - LEBANON_CENTER.lat) < DEFAULT_COORDS_TOLERANCE &&
        Math.abs(event.longitude - LEBANON_CENTER.lng) < DEFAULT_COORDS_TOLERANCE;
      if (isDefaultCoords && (resolved.lat !== LEBANON_CENTER.lat || resolved.lng !== LEBANON_CENTER.lng)) {
        latitude = resolved.lat;
        longitude = resolved.lng;
      }
    } else {
      geoPrecision = 'inferred';
      geocodeMethod = 'admin_fallback';
      geocodeConfidence = 0.55;
    }
  } else if (
    Math.abs(event.latitude - LEBANON_CENTER.lat) < DEFAULT_COORDS_TOLERANCE &&
    Math.abs(event.longitude - LEBANON_CENTER.lng) < DEFAULT_COORDS_TOLERANCE
  ) {
    geoPrecision = 'country';
    geocodeMethod = 'country_fallback';
    geocodeConfidence = 0.35;
  }

  return {
    ...event,
    latitude,
    longitude,
    metadata: {
      ...event.metadata,
      originalLanguage: langResult.language,
      languageConfidence: langResult.confidence,
      taxonomyCode,
      extractedEntities: entities,
      geoPrecision,
      resolvedPlaceName,
      ...(admin1 ? { admin1 } : {}),
      evidence: {
        ...(event.metadata.evidence ?? {}),
        geocodeMethod,
        geocodeConfidence,
      },
    },
  };
}

/**
 * Enriches events in batch (sync).
 */
export function enrichEvents(events: LebanonEvent[]): LebanonEvent[] {
  return events.map(enrichEvent);
}

function inferAdmin1(placeName: string): string | undefined {
  const p = placeName.toLowerCase();
  if (['tripoli', 'zgharta', 'ehden', 'batroun', 'koura', 'bcharre'].includes(p)) return 'North';
  if (['sidon', 'saida', 'tyre', 'sour', 'jezzine'].includes(p)) return 'South';
  if (['nabatieh', 'marjayoun', 'bint jbeil', 'khiam', 'hasbaya'].includes(p)) return 'Nabatieh';
  if (['zahle', 'baalbek', 'hermel', 'arsal', 'qaa', 'chtoura', 'anjar'].includes(p)) return 'Bekaa';
  if (['jounieh', 'byblos', 'jbeil', 'baabda', 'aley', 'beiteddine', 'hammana'].includes(p)) return 'Mount Lebanon';
  if (['beirut', 'beyrouth', 'achrafieh', 'hamra', 'dahieh'].includes(p)) return 'Beirut';
  return undefined;
}
