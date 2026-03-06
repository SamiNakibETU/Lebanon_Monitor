/**
 * LBP/USD rate scraper configuration.
 */

import { DEFAULT_COORDS } from '@/config/lebanon';

export const LBP_RATE_CONFIG = {
  urls: ['https://lirarate.org/', 'https://lbprate.com/'],
  ttlSeconds: 60 * 60,
  defaultCoords: DEFAULT_COORDS,
} as const;
