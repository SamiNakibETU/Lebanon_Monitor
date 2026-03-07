/**
 * RSS feed configuration.
 */

import { LEBANON_CITIES } from '@/config/lebanon';

export const RSS_FEEDS = [
  { url: 'https://today.lorientlejour.com/feed/', name: 'L\'Orient Today' },
  { url: 'https://www.agendaculturel.com/rss', name: 'Agenda Culturel' },
  { url: 'http://nna-leb.gov.lb/en/rss', name: 'NNA' },
  { url: 'https://www.aljazeera.com/xml/rss/all.xml', name: 'Al Jazeera' },
  { url: 'https://www.france24.com/en/rss', name: 'France 24' },
  { url: 'https://www.dailystar.com.lb/rss', name: 'Daily Star Lebanon' },
  { url: 'https://www.mtv.com.lb/en/?feed=rss', name: 'MTV Lebanon' },
  { url: 'https://www.beirut.com/feed/', name: 'Beirut.com' },
  { url: 'https://www.executive-magazine.com/feed', name: 'Executive Magazine' },
] as const;

export const RSS_USER_AGENT =
  'Mozilla/5.0 (compatible; LebanonMonitor/1.0; +https://github.com/lebanon-monitor)';

export const RSS_CONFIG = {
  ttlSeconds: 15 * 60,
} as const;

export function getCityCoords(title: string, description?: string): { lat: number; lng: number } {
  const text = `${title} ${description ?? ''}`.toLowerCase();
  for (const [city, coords] of Object.entries(LEBANON_CITIES)) {
    if (text.includes(city.toLowerCase())) return coords;
  }
  if (text.includes('tripoli')) return LEBANON_CITIES.Tripoli;
  if (text.includes('sidon') || text.includes('saida')) return LEBANON_CITIES.Sidon;
  if (text.includes('tyre') || text.includes('sour')) return LEBANON_CITIES.Tyre;
  if (text.includes('baalbek')) return LEBANON_CITIES.Baalbek;
  if (text.includes('jounieh')) return LEBANON_CITIES.Jounieh;
  return LEBANON_CITIES.Beirut;
}
