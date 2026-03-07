/**
 * Worker entry point — runs pipeline every 5 minutes.
 * Run as: npx tsx src/worker/index.ts
 * Or: npm run worker -- --once (single run, for Railway Cron)
 */

import { runPipeline } from './pipeline';
import { closePool } from './db';
import { logger } from '@/lib/logger';

const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const isOnce = process.argv.includes('--once');

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    logger.error('DATABASE_URL not set');
    process.exit(1);
  }

  logger.info('Worker starting', { intervalMinutes: isOnce ? 0 : 5, mode: isOnce ? 'once' : 'loop' });

  const run = async (): Promise<void> => {
    try {
      await runPipeline();
    } catch (err: unknown) {
      logger.error('Pipeline error', { err: err instanceof Error ? err.message : String(err) });
    }
  };

  await run();

  if (isOnce) {
    await closePool();
    process.exit(0);
  }

  const handle = setInterval(run, INTERVAL_MS);

  const shutdown = (): void => {
    clearInterval(handle);
    closePool().finally(() => process.exit(0));
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err: unknown) => {
  logger.error('Worker failed to start', {
    err: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});
