#!/usr/bin/env node
/**
 * Backfill translations for existing events.
 * Use when GROQ_API_KEY was added after events were ingested.
 *
 * Usage: DATABASE_URL="postgresql://..." GROQ_API_KEY="gsk_..." node scripts/backfill-translations.mjs
 * Or:    npm run backfill:translations
 *
 * Get DATABASE_PUBLIC_URL from Railway → Postgres → Variables
 * Get GROQ_API_KEY from https://console.groq.com/keys
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptPath = join(__dirname, '../src/scripts/backfill-translations.ts');

const url = process.env.DATABASE_URL;
const groqKey = process.env.GROQ_API_KEY;

if (!url) {
  console.error('DATABASE_URL is required.');
  console.error('Example: DATABASE_URL="postgresql://..." GROQ_API_KEY="gsk_..." node scripts/backfill-translations.mjs');
  process.exit(1);
}

if (!groqKey) {
  console.error('GROQ_API_KEY is required for translation.');
  console.error('Get a free key at https://console.groq.com/keys');
  process.exit(1);
}

console.log('Backfilling translations for existing events...');
console.log('This may take a few minutes.\n');

const child = spawn('npx', ['tsx', scriptPath], {
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: url, GROQ_API_KEY: groqKey },
  shell: true,
  cwd: join(__dirname, '..'),
});
child.on('close', (code) => process.exit(code ?? 0));
