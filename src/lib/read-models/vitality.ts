/**
 * Vitality read model — territorial continuity, recovery, capacity.
 * Separates measured, proxy, and narrative signals. Do NOT infer vitality from lumiere polarity.
 */

export interface MeasuredIndicator {
  key: string;
  label: string;
  value: number | string;
  unit: string | null;
  source: string;
  updatedAt: string;
}

export interface ProxyIndicator {
  key: string;
  label: string;
  value: number | string | null;
  unit: string | null;
  source: string;
  updatedAt: string;
  caveat?: string | null;
}

export interface NarrativeSignal {
  id: string;
  title: string;
  source: string | null;
  date: string | null;
  themes: string[];
  url: string | null;
}

export interface SupportingEvent {
  id: string;
  title: string;
  category: string | null;
  occurredAt: string;
}

export interface SupportingPlace {
  name: string;
  governorate?: string;
  geoPrecision: 'governorate' | 'country';
}

export interface VitalityReadModel {
  summary: string;
  measuredIndicators: MeasuredIndicator[];
  proxyIndicators: ProxyIndicator[];
  narrativeSignals: NarrativeSignal[];
  supportingEvents: SupportingEvent[];
  supportingPlaces: SupportingPlace[];
  coverage: string[];
  gaps: string[];
  caveats: string[];
  generatedAt: string;
}
