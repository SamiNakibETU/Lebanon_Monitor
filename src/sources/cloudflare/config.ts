/**
 * Cloudflare Radar API configuration.
 */

import { DEFAULT_COORDS } from '@/config/lebanon';

export const CLOUDFLARE_CONFIG = {
  baseUrl: 'https://api.cloudflare.com/client/v4/radar/annotations/outages',
  params: { location: 'LB', limit: '10', dateRange: '7d' },
  ttlSeconds: 30 * 60, // 30 minutes
  defaultCoords: DEFAULT_COORDS,
} as const;
