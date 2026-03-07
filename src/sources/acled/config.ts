/**
 * ACLED (Armed Conflict Location & Event Data) config.
 */

import { DEFAULT_COORDS } from '@/config/lebanon';

export const ACLED_CONFIG = {
  ttlSeconds: 3600,
  defaultCoords: DEFAULT_COORDS,
} as const;
