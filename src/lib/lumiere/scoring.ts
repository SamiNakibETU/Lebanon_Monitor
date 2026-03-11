import type { LebanonEvent } from '@/types/events';
import { SOURCE_REGISTRY_BY_NAME } from '@/config/source-registry';

function clamp100(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export interface LumiereScore {
  confidenceLumiere: number;
  impactLumiere: number;
  verificationStatus: 'unverified' | 'partially_verified' | 'verified';
}

export function computeLumiereScore(event: LebanonEvent): LumiereScore | null {
  if (event.classification !== 'lumiere') return null;

  const trust = SOURCE_REGISTRY_BY_NAME.get(event.source)?.trustWeight ?? 0.55;
  const sourceReliability = trust * 100;
  const recencyHours = Math.max(0, (Date.now() - new Date(event.timestamp).getTime()) / 3_600_000);
  const recency = Math.max(0, 100 - recencyHours * 6);
  const geo = scoreGeoPrecision(event.metadata.geoPrecision);
  const corroboration = event.metadata.evidence?.sourceCount ? Math.min(100, event.metadata.evidence.sourceCount * 30) : 30;
  const impactProxy = estimateImpact(event.category, event.title, event.description);

  const confidenceLumiere = clamp100(sourceReliability * 0.35 + recency * 0.2 + geo * 0.2 + corroboration * 0.25);
  const impactLumiere = clamp100(impactProxy * 0.6 + corroboration * 0.2 + sourceReliability * 0.2);
  const verificationStatus: LumiereScore['verificationStatus'] =
    confidenceLumiere >= 78 ? 'verified' : confidenceLumiere >= 55 ? 'partially_verified' : 'unverified';

  return { confidenceLumiere, impactLumiere, verificationStatus };
}

function scoreGeoPrecision(geoPrecision: LebanonEvent['metadata']['geoPrecision']): number {
  switch (geoPrecision) {
    case 'exact_point': return 100;
    case 'neighborhood': return 90;
    case 'city': return 80;
    case 'district': return 65;
    case 'governorate': return 50;
    case 'country': return 30;
    case 'inferred': return 40;
    default: return 20;
  }
}

function estimateImpact(category: LebanonEvent['category'], title: string, description?: string): number {
  const text = `${title} ${description ?? ''}`.toLowerCase();
  const hasScale = /(nationwide|national|thousands|schools|hospitals|network|region|countrywide|statewide)/i.test(text);
  const hasBeneficiaries = /(beneficiar|families|students|patients|households|workers)/i.test(text);

  const baseByCategory: Record<LebanonEvent['category'], number> = {
    aid_delivery_verified: 70,
    service_restoration: 78,
    cultural_resilience: 55,
    sports_cohesion: 52,
    civil_society_mobilization: 62,
    institutional_progress: 68,
    solidarity: 60,
    reconstruction: 74,
    cultural_event: 50,
    economic_positive: 64,
    international_recognition: 66,
    environmental_positive: 58,
    armed_conflict: 0,
    economic_crisis: 0,
    political_tension: 0,
    displacement: 0,
    infrastructure_failure: 0,
    environmental_negative: 0,
    disinformation: 0,
    violence: 0,
    neutral: 35,
  };

  let score = baseByCategory[category] ?? 45;
  if (hasScale) score += 10;
  if (hasBeneficiaries) score += 8;
  return clamp100(score);
}

