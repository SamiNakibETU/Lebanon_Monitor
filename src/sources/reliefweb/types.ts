/**
 * ReliefWeb API response types.
 */

export interface ReliefWebReport {
  id: string;
  fields: {
    title?: string;
    date?: { original?: string };
    source?: Array<{ name?: string }>;
    url?: string;
    theme?: Array<{ name?: string }>;
    'body-html'?: string;
  };
}

export interface ReliefWebResponse {
  data?: ReliefWebReport[];
}
