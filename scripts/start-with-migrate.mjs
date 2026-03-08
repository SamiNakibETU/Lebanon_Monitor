#!/usr/bin/env node
/**
 * Run migrations (if DB configured) then start Next.js.
 * Used by Railway: ensures schema exists before serving.
 */
import { spawnSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Load .env.local if present (local dev)
const envPath = join(root, '.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}

const hasDb = !!(
  process.env.DATABASE_URL ||
  process.env.DATABASE_PUBLIC_URL ||
  process.env.DATABASE_PRIVATE_URL
);

if (hasDb) {
  const r = spawnSync('node', ['scripts/run-migrations.mjs'], {
    stdio: 'inherit',
    cwd: root,
  });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

const r2 = spawnSync('npx', ['next', 'start'], {
  stdio: 'inherit',
  cwd: root,
});
process.exit(r2.status ?? 0);
