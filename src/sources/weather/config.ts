/**
 * OpenWeatherMap configuration.
 */

import { LEBANON_CITIES } from '@/config/lebanon';

export const WEATHER_CITIES = [
  { name: 'Beirut', ...LEBANON_CITIES.Beirut },
  { name: 'Tripoli', ...LEBANON_CITIES.Tripoli },
  { name: 'Sidon', ...LEBANON_CITIES.Sidon },
  { name: 'Baalbek', ...LEBANON_CITIES.Baalbek },
];

export const WEATHER_CONFIG = {
  baseUrl: 'https://api.openweathermap.org/data/2.5/weather',
  ttlSeconds: 60 * 60,
} as const;
