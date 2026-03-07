/**
 * ReliefWeb API configuration.
 */

import { DEFAULT_COORDS } from '@/config/lebanon';

export const RELIEFWEB_CONFIG = {
  baseUrl: 'https://api.reliefweb.int/v2/reports',
  params: {
    appname: process.env.RELIEFWEB_APPNAME ?? 'SNakib-lebanonmonitor-sn7k2',
    'filter[field]': 'country',
    'filter[value]': 'Lebanon',
    limit: '20',
    'sort[]': 'date:desc',
    'fields[include][]': ['title', 'date.original', 'source', 'url', 'theme', 'body-html'],
  },
  ttlSeconds: 60 * 60,
  defaultCoords: DEFAULT_COORDS,
} as const;
