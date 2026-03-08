/**
 * Worker database client — re-exports from main db.
 */

export { getPool, withClient, healthCheck, closePool, isDbConfigured } from '@/db/client';
