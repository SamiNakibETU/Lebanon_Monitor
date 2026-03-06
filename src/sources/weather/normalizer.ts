/**
 * Normalizes weather data to LebanonEvent[].
 */

import type { LebanonEvent } from '@/types/events';
import { WEATHER_CONFIG } from './config';
import type { OwmResponse } from './types';

function classifyWeather(data: OwmResponse): { classification: LebanonEvent['classification']; severity: LebanonEvent['severity'] } {
  const temp = data.main?.temp ?? 20;
  const windSpeed = (data.wind?.speed ?? 0) * 3.6; // m/s to km/h

  if (temp > 40 || temp < 0 || windSpeed > 80) {
    return { classification: 'ombre', severity: temp > 40 || windSpeed > 80 ? 'high' : 'medium' };
  }
  return { classification: 'neutre', severity: 'low' };
}

export function normalize(
  items: Array<{ city: string; lat: number; lng: number; data: OwmResponse }>,
  fetchedAt: Date
): LebanonEvent[] {
  const events: LebanonEvent[] = [];

  for (const item of items) {
    const { classification, severity } = classifyWeather(item.data);
    const temp = item.data.main?.temp ?? 0;
    const condition = item.data.weather?.[0]?.main ?? 'Unknown';

    events.push({
      id: `weather-${item.city.toLowerCase()}-${fetchedAt.getTime()}`,
      source: 'weather',
      title: `${item.city}: ${temp.toFixed(0)}°C, ${condition}`,
      timestamp: fetchedAt,
      latitude: item.lat,
      longitude: item.lng,
      classification,
      confidence: 0.7,
      category: 'neutral',
      severity,
      metadata: {
        fetchedAt,
        ttlSeconds: WEATHER_CONFIG.ttlSeconds,
        sourceReliability: 'high',
      },
    });
  }

  return events;
}
