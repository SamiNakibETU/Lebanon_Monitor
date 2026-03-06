/**
 * Lightweight entity extraction for Lebanese names, parties, cities.
 */

import { LEBANON_CITIES } from '@/config/lebanon';

const POLITICIANS = [
  'Nabih Berri', 'Najib Mikati', 'Hassan Nasrallah', 'Gebran Bassil',
  'Samir Geagea', 'Walid Jumblatt', 'Michel Aoun', 'Saad Hariri',
  'Nawaf Salam', 'Ibrahim Kanaan', 'Ziyad Baroud', 'Raya Haffar',
  'Jamil Sayyed', 'Amal Movement', 'Marada', 'Tashnag',
];

const PARTIES = [
  'Hezbollah', 'Amal', 'FPM', 'Free Patriotic Movement', 'Future Movement',
  'FL', 'Kataeb', 'PSP', 'Progressive Socialist Party', 'Lebanese Forces',
  'Marada', 'Tashnag', 'SSNP', 'LCP', 'Jumblatt',
];

const ORGS = [
  'UNIFIL', 'LAF', 'ISF', 'BDL', 'Banque du Liban', 'Electricité du Liban',
  'EDL', 'UNHCR', 'WFP', 'UN', 'IMF', 'World Bank',
];

export interface ExtractedEntities {
  persons: string[];
  parties: string[];
  cities: string[];
  organizations: string[];
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findMatches(text: string, terms: string[]): string[] {
  const found = new Set<string>();
  for (const term of terms) {
    const re = new RegExp(`\\b${escapeRegex(term)}\\b`, 'gi');
    const m = text.match(re);
    if (m) {
      found.add(term);
    }
  }
  return Array.from(found);
}

function findCities(text: string): string[] {
  const found: string[] = [];
  const lower = text.toLowerCase();
  for (const [city] of Object.entries(LEBANON_CITIES)) {
    if (lower.includes(city.toLowerCase())) found.push(city);
  }
  if (lower.includes('beirut') && !found.includes('Beirut')) found.push('Beirut');
  if (lower.includes('tripoli') && !found.includes('Tripoli')) found.push('Tripoli');
  if (lower.includes('sidon') || lower.includes('saida')) {
    if (!found.includes('Sidon')) found.push('Sidon');
  }
  if (lower.includes('tyre') || lower.includes('sour')) {
    if (!found.includes('Tyre')) found.push('Tyre');
  }
  return found;
}

/**
 * Extract Lebanese entities from text.
 */
export function extractEntities(text: string): ExtractedEntities {
  return {
    persons: findMatches(text, POLITICIANS),
    parties: findMatches(text, PARTIES),
    cities: findCities(text),
    organizations: findMatches(text, ORGS),
  };
}
