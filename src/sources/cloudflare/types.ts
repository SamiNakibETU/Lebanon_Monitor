/**
 * Cloudflare Radar outages API types.
 */

export interface CloudflareOutage {
  startDate?: string;
  endDate?: string;
  scope?: string;
  asns?: number[];
  locations?: string[];
}
