/**
 * API health check — vérifie les APIs externes et la config.
 * GET /api/v2/health
 *
 * Résumé des logs :
 * - 404 ReliefWeb : appname ou URL API incorrecte
 * - 403 UCDP : token invalide ou périmé
 * - 403 GDELT/ACLED : clé ou quota
 * - 401 : authentification (Anthropic, etc.)
 */

import { NextResponse } from 'next/server';
import { CONNECTORS } from '@/sources/connector-registry';
import { getSanitizedAnthropicKey } from '@/lib/anthropic';
import { isRedisConfigured } from '@/lib/redis';
import { healthCheck as dbHealthCheck } from '@/db/client';

export interface HealthEntry {
  source: string;
  status: 'ok' | 'error' | 'skipped';
  statusCode?: number;
  durationMs?: number;
  error?: string;
}

/** Interprétation des erreurs courantes pour le debugging. */
const ERROR_HINTS: Record<string, string> = {
  '404': 'ReliefWeb: vérifier RELIEFWEB_APPNAME (doit être approuvé) ou URL API v2.',
  '403': 'UCDP/GDELT/ACLED: token invalide, périmé ou quota dépassé.',
  '401': 'Authentification: clé API incorrecte (Anthropic, etc.).',
};

export async function GET() {
  const hasDbUrl = !!(
    process.env.DATABASE_URL ||
    process.env.DATABASE_PUBLIC_URL ||
    process.env.DATABASE_PRIVATE_URL
  );

  const env: Record<string, 'ok' | 'missing' | 'invalid'> = {};
  env.DATABASE_URL = hasDbUrl ? 'ok' : 'missing';
  env.ANTHROPIC_API_KEY = getSanitizedAnthropicKey() ? 'ok' : 'missing';
  env.REDIS = isRedisConfigured() ? 'ok' : 'missing';
  env.RELIEFWEB_APPNAME = process.env.RELIEFWEB_APPNAME ? 'ok' : 'missing';
  env.UCDP_ACCESS_TOKEN = process.env.UCDP_ACCESS_TOKEN ? 'ok' : 'missing';
  env.FIRMS_MAP_KEY = process.env.FIRMS_MAP_KEY ? 'ok' : 'missing';
  env.CF_API_TOKEN = process.env.CF_API_TOKEN ? 'ok' : 'missing';
  env.OPENAQ_API_KEY = process.env.OPENAQ_API_KEY ? 'ok' : 'missing';

  const results: HealthEntry[] = [];

  for (const connector of CONNECTORS) {
    try {
      const result = await connector.fetch();
      const status = result.status === 'skipped' ? 'skipped' : result.ok ? 'ok' : 'error';
      const statusCode = result.error?.message?.match(/HTTP (\d{3})/)?.[1]
        ? parseInt(result.error.message.match(/HTTP (\d{3})/)?.[1] ?? '0', 10)
        : undefined;

      results.push({
        source: connector.name,
        status,
        statusCode: statusCode || undefined,
        durationMs: result.responseTimeMs,
        error: result.error?.message?.slice(0, 150),
      });
    } catch (e) {
      results.push({
        source: connector.name,
        status: 'error',
        durationMs: undefined,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  const okCount = results.filter((r) => r.status === 'ok').length;
  const errCount = results.filter((r) => r.status === 'error').length;

  const errorsByCode = Object.fromEntries(
    Object.entries(ERROR_HINTS).map(([code, hint]) => [
      code,
      { hint, sources: results.filter((r) => r.statusCode === parseInt(code, 10)).map((r) => r.source) },
    ])
  );

  let database: { status: 'ok' | 'error' | 'skipped'; error?: string } = { status: 'skipped' };
  if (hasDbUrl) {
    try {
      const dbResult = await dbHealthCheck();
      database = dbResult.ok
        ? { status: 'ok' }
        : { status: 'error', error: dbResult.error };
    } catch (e) {
      database = { status: 'error', error: e instanceof Error ? e.message : String(e) };
    }
  }

  return NextResponse.json(
    {
      env,
      database,
      apis: results,
      summary: {
        ok: okCount,
        error: errCount,
        skipped: results.filter((r) => r.status === 'skipped').length,
        total: results.length,
      },
      errorsByCode,
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}
