#!/usr/bin/env node
/**
 * Run worker once against Railway DB.
 * Usage: node scripts/railway-ingest-once.mjs "postgresql://postgres:xxx@xxx.proxy.rlwy.net:xxxxx/railway"
 * Or:   DATABASE_URL="postgresql://..." node scripts/railway-ingest-once.mjs
 *
 * Get DATABASE_PUBLIC_URL from: Railway → Postgres service → Variables
 */

import { spawn } from 'child_process';

const url = process.argv[2] || process.env.DATABASE_URL;
if (!url) {
  console.error('Usage: node scripts/railway-ingest-once.mjs "postgresql://postgres:xxx@xxx.proxy.rlwy.net:xxxxx/railway"');
  console.error('Or set DATABASE_URL in environment.');
  process.exit(1);
}

const child = spawn('npx', ['tsx', 'src/worker/index.ts', '--once'], {
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: url },
  shell: true,
  cwd: process.cwd(),
});
child.on('close', (code) => process.exit(code ?? 0));
