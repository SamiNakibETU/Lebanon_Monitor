#!/usr/bin/env node
/**
 * Backfill translations for existing events.
 * Use when HF_API_TOKEN was added after events were ingested.
 *
 * Usage: DATABASE_URL="postgresql://..." HF_API_TOKEN="hf_xxx" node scripts/backfill-translations.mjs
 * Or:    npm run backfill:translations
 *
 * Get DATABASE_PUBLIC_URL from Railway → Postgres → Variables
 * Get HF_API_TOKEN from https://huggingface.co/settings/tokens
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptPath = join(__dirname, '../src/scripts/backfill-translations.ts');

const url = process.env.DATABASE_URL;
const token = process.env.HF_API_TOKEN;

if (!url) {
  console.error('DATABASE_URL is required.');
  console.error('Example: DATABASE_URL="postgresql://..." HF_API_TOKEN="hf_xxx" node scripts/backfill-translations.mjs');
  process.exit(1);
}

if (!token) {
  console.error('HF_API_TOKEN is required for translation.');
  console.error('Get a free token at https://huggingface.co/settings/tokens');
  process.exit(1);
}

console.log('Backfilling translations for existing events...');
console.log('This may take a few minutes (HF API rate limits apply).\n');

const child = spawn('npx', ['tsx', scriptPath], {
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: url, HF_API_TOKEN: token },
  shell: true,
  cwd: join(__dirname, '..'),
});
child.on('close', (code) => process.exit(code ?? 0));
