export interface ACLEDEvent {
  data?: Array<{
    id?: string;
    event_date?: string;
    year?: number;
    event_type?: string;
    sub_event_type?: string;
    actor1?: string;
    actor2?: string;
    fatalities?: number;
    latitude?: number;
    longitude?: number;
    location?: string;
    notes?: string;
    source?: string;
    geo_precision?: number;
  }>;
}
