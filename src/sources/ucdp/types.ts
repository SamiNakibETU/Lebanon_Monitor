/**
 * UCDP GED API types.
 * Not wired to registry until DB is stable.
 */

export interface UcdpGedEvent {
  id: number;
  relid: string;
  year: number;
  country: string;
  country_id: number;
  latitude: number;
  longitude: number;
  date_start: string;
  date_end: string;
  deaths_a?: number;
  deaths_b?: number;
  deaths_civilians?: number;
  deaths_unknown?: number;
  best?: number;
  type_of_violence?: number;
  side_a?: string;
  side_b?: string;
  source_headline?: string;
}

export interface UcdpGedResponse {
  TotalCount: number;
  TotalPages: number;
  Result: UcdpGedEvent[];
}
