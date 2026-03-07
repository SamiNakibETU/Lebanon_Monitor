export interface UCDPEvent {
  id?: number;
  country?: string;
  latitude?: number;
  longitude?: number;
  date_start?: string;
  date_end?: string;
  type_of_violence?: number;
  deaths_a?: number;
  deaths_b?: number;
  deaths_civilians?: number;
  best?: number;
  low?: number;
  high?: number;
}
