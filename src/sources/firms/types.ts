/**
 * NASA FIRMS CSV row type.
 */

export interface FirmsRow {
  latitude: number;
  longitude: number;
  bright_ti4?: number;
  acq_date?: string;
  acq_time?: string;
  confidence?: string;
  frp?: number;
  daynight?: string;
}
