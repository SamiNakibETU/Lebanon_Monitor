#!/usr/bin/env node
/**
 * Vérification complète : type-check, tests, DB, health API.
 *
 * Usage:
 *   npm run verify
 *   npm run verify -- https://ton-app.railway.app     (Health API prod)
 *
 * DB: utilise DATABASE_PUBLIC_URL ou DATABASE_URL depuis .env.local.
 *     Pour Railway depuis ta machine : DATABASE_PUBLIC_URL (proxy rlwy.net).
 *
 * PowerShell: set HEALTH_URL=... ne marche pas. Utilise l'argument :
 *   npm run verify -- https://ton-app.railway.app
 */

import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnvLocal() {
  const path = join(root, '.env.local');
  if (!existsSync(path)) return;
  const content = readFileSync(path, 'utf8');
  for (const line of content.split('\n')) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
}

function run(cmd, args = [], opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: 'inherit',
      shell: true,
      cwd: root,
      ...opts,
    });
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`Exit ${code}`))));
  });
}

async function fetchHealth(baseUrl) {
  try {
    const res = await fetch(`${baseUrl}/api/v2/health`, { cache: 'no-store' });
    const data = await res.json();
    return data;
  } catch (e) {
    return null;
  }
}

async function main() {
  console.log('=== Lebanon Monitor — Vérification complète ===\n');

  // 1. Type check
  console.log('1. Type-check...');
  try {
    await run('npm', ['run', 'type-check']);
    console.log('   ✓ Type-check OK\n');
  } catch {
    console.error('   ✗ Type-check échoué\n');
    process.exit(1);
  }

  // 2. Tests
  console.log('2. Tests...');
  try {
    await run('npm', ['run', 'test']);
    console.log('   ✓ Tests OK\n');
  } catch {
    console.error('   ✗ Tests échoués\n');
    process.exit(1);
  }

  // 3. DB (charge .env.local pour db:check)
  loadEnvLocal();
  const hasDb = !!(
    process.env.DATABASE_URL ||
    process.env.DATABASE_PUBLIC_URL ||
    process.env.DATABASE_PRIVATE_URL
  );

  if (hasDb) {
    console.log('3. Base de données... (DATABASE_PUBLIC_URL pour Railway depuis local)');
    try {
      await run('npm', ['run', 'db:check']);
      console.log('   ✓ DB OK\n');
    } catch {
      console.error('   ✗ DB non joignable (OK en local si Postgres pas lancé — sur Railway ça marche)\n');
      // Ne pas exit : vérif continue pour health API
    }
  } else {
    console.log('3. Base de données... (skipped — DATABASE_URL non défini)\n');
  }

  // 4. Sources / APIs — URL en argument (npm run verify -- https://ton-app.railway.app) ou HEALTH_URL
  const healthUrl = process.argv[2] || process.env.HEALTH_URL || 'http://localhost:3000';
  console.log(`4. Health API (${healthUrl})...`);

  const health = await fetchHealth(healthUrl);
  if (health) {
    const s = health.summary || {};
    console.log(`   OK: ${s.ok ?? 0}, Erreurs: ${s.error ?? 0}, Skipped: ${s.skipped ?? 0}`);
    if (health.database) {
      console.log(`   Database: ${health.database.status}${health.database.error ? ` (${health.database.error})` : ''}`);
    }
    if (s.error > 0 && health.apis) {
      const errs = health.apis.filter((a) => a.status === 'error');
      errs.slice(0, 5).forEach((a) => console.log(`   - ${a.source}: ${a.error?.slice(0, 60) ?? a.statusCode}`));
    }
    console.log('   ✓ Health récupéré\n');
  } else {
    console.log('   (Serveur non démarré — lance "npm run dev" puis GET /api/v2/health)\n');
  }

  console.log('=== Vérification terminée ===');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
