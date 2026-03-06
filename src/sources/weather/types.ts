/**
 * OpenWeatherMap API response types.
 */

export interface OwmResponse {
  main?: { temp?: number };
  weather?: Array<{ main?: string }>;
  wind?: { speed?: number };
  coord?: { lat?: number; lon?: number };
  name?: string;
}
