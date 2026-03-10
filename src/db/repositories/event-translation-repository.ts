/**
 * Event translation repository — event_translation CRUD.
 */

import type { PoolClient } from 'pg';

export type Lang = 'ar' | 'fr' | 'en';

export interface EventTranslationRow {
  id: string;
  event_id: string;
  language: string;
  title: string | null;
  summary: string | null;
  translated_at: Date;
  provider: string | null;
}

/**
 * Upsert translation for an event+language.
 */
export async function upsertEventTranslation(
  client: PoolClient,
  input: {
    event_id: string;
    language: Lang;
    title: string;
    summary?: string | null;
    provider?: string | null;
  }
): Promise<void> {
  await client.query(
    `INSERT INTO event_translation (event_id, language, title, summary, provider)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (event_id, language)
     DO UPDATE SET title = EXCLUDED.title, summary = COALESCE(EXCLUDED.summary, event_translation.summary)`,
    [
      input.event_id,
      input.language,
      input.title,
      input.summary ?? null,
      input.provider ?? 'opus-mt',
    ]
  );
}

/**
 * Get translations for an event.
 */
export async function getEventTranslations(
  client: PoolClient,
  eventId: string
): Promise<EventTranslationRow[]> {
  const { rows } = await client.query<EventTranslationRow>(
    'SELECT * FROM event_translation WHERE event_id = $1',
    [eventId]
  );
  return rows;
}

/**
 * Get translations for multiple events in one language.
 */
export async function getTranslationsForEvents(
  client: PoolClient,
  eventIds: string[],
  lang: Lang
): Promise<Map<string, string>> {
  if (eventIds.length === 0) return new Map();
  const { rows } = await client.query<{ event_id: string; title: string }>(
    `SELECT event_id, title FROM event_translation WHERE event_id = ANY($1) AND language = $2`,
    [eventIds, lang]
  );
  return new Map(rows.map((r) => [r.event_id, r.title]));
}

/**
 * Get translated title+summary for multiple events in one language.
 */
export async function getTranslationPayloadsForEvents(
  client: PoolClient,
  eventIds: string[],
  lang: Lang
): Promise<Map<string, { title: string | null; summary: string | null }>> {
  if (eventIds.length === 0) return new Map();
  const { rows } = await client.query<{ event_id: string; title: string | null; summary: string | null }>(
    `SELECT event_id, title, summary
     FROM event_translation
     WHERE event_id = ANY($1) AND language = $2`,
    [eventIds, lang]
  );
  return new Map(rows.map((r) => [r.event_id, { title: r.title, summary: r.summary }]));
}

/**
 * Get translation for event+language, or null.
 */
export async function getEventTranslation(
  client: PoolClient,
  eventId: string,
  lang: Lang
): Promise<EventTranslationRow | null> {
  const { rows } = await client.query<EventTranslationRow>(
    'SELECT * FROM event_translation WHERE event_id = $1 AND language = $2',
    [eventId, lang]
  );
  return rows[0] ?? null;
}
