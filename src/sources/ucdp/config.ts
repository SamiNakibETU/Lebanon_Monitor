/**
 * UCDP GED (Uppsala Conflict Data Program) config.
 */

import { DEFAULT_COORDS } from '@/config/lebanon';

export const UCDP_CONFIG = {
  ttlSeconds: 12 * 60 * 60,
  defaultCoords: DEFAULT_COORDS,
  version: '26.0.1',
  countries: [660, 666, 652, 630, 663] as const,
} as const;
