/**
 * Twitter/Nitter source configuration.
 */

import { DEFAULT_COORDS } from '@/config/lebanon';

export const NITTER_INSTANCES = [
  'https://nitter.net',
  'https://nitter.privacyredirect.com',
];

export const LEBANON_HANDLES = [
  'LBCgroup',
  'AlJadeedLive',
  'LBCI_NEWS',
  'mtvlebanon',
  'NNA_Lebanon',
  'Lebanon24',
  'The961',
  'LorientLeJour',
] as const;

export const TWITTER_CONFIG = {
  ttlSeconds: 15 * 60,
  maxItemsPerHandle: 15,
  defaultCoords: DEFAULT_COORDS,
} as const;
