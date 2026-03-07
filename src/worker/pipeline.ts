/**
 * Worker pipeline orchestrator — ingest → normalize → classify → dedupe → store.
 */

import { runIngest } from './ingest';
import { runNormalize } from './normalize';
import { classifyEvent, needsLlmClassification } from './classify';
import { classifyWithClaude } from './classify-llm';
import { findDuplicate } from './deduplicate';
import { storeNewEvent, linkToExistingEvent } from './store';
import { translateAndStore } from './translate';
import { runIndicators } from './indicators';
import { runCluster } from './cluster';
import { logSourceHealth, logPipelineRun } from './health';
import { logger } from '@/lib/logger';
import { EVENT_SOURCE_NAMES } from '@/sources/connector-registry';
import type { LebanonEvent } from '@/types/events';

export async function runPipeline(): Promise<void> {
  const start = Date.now();
  const startedAt = new Date();
  let eventsCreated = 0;
  let eventsUpdated = 0;
  const sourcesRun: string[] = [];

  try {
    const { rawIds, statuses, indicators } = await runIngest();
    sourcesRun.push(...Object.keys(rawIds));

    await logSourceHealth(statuses);

    const newItems = await runNormalize(rawIds);
    logger.info('Normalize produced new items', { count: newItems.length });

    const toProcess = newItems.filter(({ event }) => EVENT_SOURCE_NAMES.has(event.source));

    const needsLlm = toProcess
      .map((item, i) => ({ ...item, index: i }))
      .filter(({ event }) => needsLlmClassification(event.title));

    const llmResults =
      needsLlm.length > 0 && process.env.ANTHROPIC_API_KEY
        ? await classifyWithClaude(needsLlm)
        : new Map<number, never>();

    for (let i = 0; i < toProcess.length; i++) {
      const { sourceItem, event } = toProcess[i]!;
      let classified: LebanonEvent;

      const llmRes = llmResults.get(i);

      if (llmRes) {
        classified = {
          ...event,
          classification: llmRes.classification,
          confidence: llmRes.confidence,
          category: llmRes.category as LebanonEvent['category'],
          severity: llmRes.severity,
        };
      } else {
        classified = classifyEvent(event);
      }

      const duplicate = await findDuplicate(classified);

      if (duplicate) {
        await linkToExistingEvent(sourceItem, duplicate.eventId, classified, duplicate.confidence);
        eventsUpdated++;
      } else {
        const { eventId, title, summary } = await storeNewEvent(sourceItem, classified);
        eventsCreated++;
        translateAndStore(eventId, title, summary).catch(() => {});
      }
    }

    await runIndicators(indicators);

    await runCluster().catch((err) =>
      logger.warn('Clustering failed (non-fatal)', { err: err instanceof Error ? err.message : String(err) })
    );

    await logPipelineRun({
      status: 'success',
      sourcesRun,
      rawCount: Object.keys(rawIds).length,
      eventsCreated,
      eventsUpdated,
      startedAt,
    });

    logger.info('Pipeline complete', {
      durationMs: Date.now() - start,
      eventsCreated,
      eventsUpdated,
    });
  } catch (err) {
    logger.error('Pipeline failed', {
      error: err instanceof Error ? err.message : String(err),
    });

    await logPipelineRun({
      status: 'failure',
      sourcesRun,
      rawCount: 0,
      eventsCreated,
      eventsUpdated,
      startedAt,
      errorDetails: { message: err instanceof Error ? err.message : String(err) },
    }).catch(() => {});

    throw err;
  }
}
