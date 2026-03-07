/**
 * Worker database client — re-exports from main db.
 */

export { getPool, withClient, healthCheck, closePool } from '@/db/client';
