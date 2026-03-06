/**
 * Common utility types for the data ingestion layer.
 */

export interface SourceError {
  source: string;
  message: string;
  code?: string;
  statusCode?: number;
}

export type Result<T, E = SourceError> =
  | { ok: true; data: T }
  | { ok: false; error: E };

export function ok<T>(data: T): Result<T, never> {
  return { ok: true, data };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}
