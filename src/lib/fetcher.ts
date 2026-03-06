/**
 * Shared fetch wrapper with timeout, AbortController, and retry.
 */

import { type Result, ok, err } from '@/types/common';
import type { SourceError } from '@/types/common';
import { logger } from './logger';

const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;

/**
 * Fetches a URL with timeout and optional retries for 5xx errors.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  config: {
    timeoutMs?: number;
    source?: string;
    retries?: number;
  } = {}
): Promise<Result<Response, SourceError>> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    source = 'unknown',
    retries = MAX_RETRIES,
  } = config;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const fetchOptions: RequestInit = {
    ...options,
    signal: controller.signal,
  };

  let lastError: SourceError | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const start = Date.now();
    try {
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      logger.info('Fetch completed', {
        source,
        url,
        status: response.status,
        durationMs: Date.now() - start,
        attempt: attempt + 1,
      });

      if (response.ok) {
        return ok(response);
      }

      if (response.status >= 400 && response.status < 500) {
        const text = await response.text();
        return err({
          source,
          message: `HTTP ${response.status}: ${text.slice(0, 200)}`,
          statusCode: response.status,
        });
      }

      if (response.status >= 500 && attempt < retries) {
        const backoff = Math.pow(2, attempt) * 1000;
        logger.warn('Retrying after 5xx', {
          source,
          status: response.status,
          attempt: attempt + 1,
          backoffMs: backoff,
        });
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }

      return err({
        source,
        message: `HTTP ${response.status}`,
        statusCode: response.status,
      });
    } catch (e) {
      clearTimeout(timeoutId);
      const message = e instanceof Error ? e.message : String(e);
      lastError = {
        source,
        message,
        code: e instanceof Error && e.name === 'AbortError' ? 'TIMEOUT' : undefined,
      };

      if (attempt < retries) {
        const backoff = Math.pow(2, attempt) * 1000;
        logger.warn('Retrying after fetch error', {
          source,
          message,
          attempt: attempt + 1,
          backoffMs: backoff,
        });
        await new Promise((r) => setTimeout(r, backoff));
      } else {
        break;
      }
    }
  }

  return err(lastError!);
}
