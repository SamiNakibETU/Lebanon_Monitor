/**
 * UCDP GED (Uppsala Conflict Data Program) config.
 */

import { DEFAULT_COORDS } from '@/config/lebanon';

export const UCDP_CONFIG = {
  ttlSeconds: 86400,
  defaultCoords: DEFAULT_COORDS,
} as const;
