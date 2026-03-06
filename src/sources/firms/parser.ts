/**
 * Parses NASA FIRMS CSV response.
 */

import type { FirmsRow } from './types';

export function parseCsv(csv: string): FirmsRow[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',');
  const rows: FirmsRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row: Record<string, unknown> = {};
    headers.forEach((h, idx) => {
      const key = h.trim().toLowerCase();
      const val = values[idx]?.trim();
      if (key === 'latitude') row.latitude = parseFloat(val ?? '0');
      else if (key === 'longitude') row.longitude = parseFloat(val ?? '0');
      else if (key === 'bright_ti4') row.bright_ti4 = parseFloat(val ?? '0');
      else if (key === 'acq_date') row.acq_date = val;
      else if (key === 'acq_time') row.acq_time = val;
      else if (key === 'confidence') row.confidence = val;
      else if (key === 'frp') row.frp = parseFloat(val ?? '0');
      else if (key === 'daynight') row.daynight = val;
    });
    rows.push(row as unknown as FirmsRow);
  }

  return rows;
}
