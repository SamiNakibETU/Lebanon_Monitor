/**
 * Database layer — client, migrations, repositories.
 */

export { getPool, withClient, healthCheck, closePool, isDbConfigured } from './client';
export { migrate } from './migrate';
export * from './types';
export * from './repositories/event-repository';
export * from './repositories/source-item-repository';
export * from './repositories/indicator-snapshot-repository';
export * from './repositories/event-observation-repository';
export * from './repositories/event-translation-repository';
export * from './repositories/entity-repository';
export * from './repositories/claim-repository';
export * from './repositories/claim-contradiction-repository';
export * from './repositories/episode-repository';
