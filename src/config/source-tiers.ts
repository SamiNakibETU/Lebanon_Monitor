/**
 * Source tier mapping — reliability from connector registry.
 * T1 = high, T2 = medium, T3 = low.
 */

import { CONNECTORS } from '@/sources/connector-registry';
import type { SourceReliability } from '@/sources/connector-types';

export type SourceTier = 'T1' | 'T2' | 'T3';

function reliabilityToTier(r: SourceReliability): SourceTier {
  if (r === 'high') return 'T1';
  if (r === 'medium') return 'T2';
  return 'T3';
}

const tierMap = new Map<string, SourceTier>(
  CONNECTORS.map((c) => [c.name, reliabilityToTier(c.getSourceReliability())])
);

export function getSourceTier(sourceName: string | null | undefined): SourceTier | null {
  if (!sourceName || typeof sourceName !== 'string') return null;
  return tierMap.get(sourceName.toLowerCase()) ?? null;
}
