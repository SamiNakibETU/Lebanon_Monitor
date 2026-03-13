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
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch {
    return null;
  }
}

function parseArgs(argv) {
  const flags = new Set(argv.filter((a) => a.startsWith('--')));
  const urlArg = argv.find((a) => !a.startsWith('--'));
  return { flags, urlArg };
}

async function main() {
  const { flags, urlArg } = parseArgs(process.argv.slice(2));
  const skipBuild = flags.has('--skip-build');
  const skipDb = flags.has('--skip-db');
  const healthRequired = flags.has('--require-health') || Boolean(urlArg) || Boolean(process.env.HEALTH_URL);

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

  // 3. Build (optionnel)
  if (skipBuild) {
    console.log('3. Build... (skipped --skip-build)\n');
  } else {
    console.log('3. Build...');
    try {
      await run('npm', ['run', 'build']);
      console.log('   ✓ Build OK\n');
    } catch {
      console.error('   ✗ Build échoué\n');
      process.exit(1);
    }
  }

  // 4. DB (charge .env.local pour db:check)
  loadEnvLocal();
  const hasDb = !!(
    process.env.DATABASE_URL ||
    process.env.DATABASE_PUBLIC_URL ||
    process.env.DATABASE_PRIVATE_URL
  );

  if (skipDb) {
    console.log('4. Base de données... (skipped --skip-db)\n');
  } else if (hasDb) {
    console.log('4. Base de données... (DATABASE_PUBLIC_URL pour Railway depuis local)');
    try {
      await run('npm', ['run', 'db:check']);
      console.log('   ✓ DB OK\n');
    } catch {
      console.error('   ✗ DB non joignable\n');
      process.exit(1);
    }
  } else {
    console.log('4. Base de données... (skipped — DATABASE_URL non défini)\n');
  }

  // 5. Sources / APIs — URL en argument (npm run verify -- https://ton-app.railway.app) ou HEALTH_URL
  const healthUrl = urlArg || process.env.HEALTH_URL || 'http://localhost:3000';
  console.log(`5. Health API (${healthUrl})...`);

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
    if (healthRequired) {
      console.error('   ✗ Health indisponible\n');
      process.exit(1);
    }
    console.log('   (Serveur non démarré — lance "npm run dev" puis GET /api/v2/health)\n');
  }

  console.log('=== Vérification terminée ===');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
