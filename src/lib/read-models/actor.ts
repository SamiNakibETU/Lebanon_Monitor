/**
 * Actor read model — entity as analyst-facing actor with evidence and counts.
 * Phase 6 — maps entity table to actor UX; roles from event_entity.
 */

import type { EntityRow } from '@/db/types';

export type ActorEntityType = 'person' | 'organization' | 'place';

export interface ActorReadModel {
  id: string;
  label: string;
  entityType: ActorEntityType | null;
  eventCount: number;
  episodeCount: number;
  claimCount: number;
  contradictionCount: number;
  sourceDiversity: number;
  roles: string[];
  evidenceNote: 'relational';
}

export interface ActorRoleAggregation {
  role: string | null;
  count: number;
}

/**
 * Build actor read model from EntityRow and aggregated stats.
 */
export function buildActorReadModel(
  entity: EntityRow,
  stats: {
    eventCount: number;
    episodeCount: number;
    claimCount: number;
    contradictionCount: number;
    sourceDiversity: number;
    roleAggregations: ActorRoleAggregation[];
  }
): ActorReadModel {
  const roles = stats.roleAggregations
    .map((r) => r.role)
    .filter((r): r is string => r != null && r !== '')
    .filter((r, i, arr) => arr.indexOf(r) === i);

  return {
    id: entity.id,
    label: entity.name,
    entityType: (entity.entity_type as ActorEntityType | null) ?? null,
    eventCount: stats.eventCount,
    episodeCount: stats.episodeCount,
    claimCount: stats.claimCount,
    contradictionCount: stats.contradictionCount,
    sourceDiversity: stats.sourceDiversity,
    roles,
    evidenceNote: 'relational',
  };
}
