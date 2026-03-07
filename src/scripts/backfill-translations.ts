/**
 * Backfill translations for existing events.
 * Run: DATABASE_URL="..." HF_API_TOKEN="..." npx tsx src/scripts/backfill-translations.ts
 * Or: npm run backfill:translations (with .env.local)
 */

import { withClient } from '../db/client';
import { translateAndStore } from '../worker/translate';

async function main() {
  if (!process.env.HF_API_TOKEN) {
    console.error('HF_API_TOKEN is required. Set it in .env.local or environment.');
    process.exit(1);
  }

  const { rows } = await withClient((client) =>
    client.query<{ id: string; canonical_title: string; canonical_summary: string | null }>(
      'SELECT id, canonical_title, canonical_summary FROM event WHERE is_active = true ORDER BY occurred_at DESC'
    )
  );

  console.log(`Found ${rows.length} events. Backfilling translations...`);

  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
  let done = 0;
  for (const row of rows) {
    await translateAndStore(row.id, row.canonical_title, row.canonical_summary);
    done++;
    if (done % 10 === 0) {
      console.log(`  ${done}/${rows.length} done`);
    }
    await delay(300); // Avoid HF API rate limit
  }

  console.log(`Done. ${rows.length} events processed.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
