/**
 * Human-readable labels for sources, categories, etc.
 */

import type { SourceName, EventCategory } from '@/types/events';

export const SOURCE_LABELS: Record<SourceName, string> = {
  gdelt: 'GDELT',
  usgs: 'USGS',
  firms: 'FIRMS',
  rss: 'RSS',
  gdacs: 'GDACS',
  reliefweb: 'ReliefWeb',
  weather: 'Weather',
  cloudflare: 'Cloudflare',
  'lbp-rate': 'LBP Rate',
  openaq: 'OpenAQ',
  twitter: 'Twitter/X',
  acled: 'ACLED',
  ucdp: 'UCDP',
  telegram: 'Telegram',
};

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  aid_delivery_verified: 'Aide vérifiée',
  service_restoration: 'Services restaurés',
  cultural_resilience: 'Résilience culturelle',
  sports_cohesion: 'Cohésion sportive',
  civil_society_mobilization: 'Mobilisation civile',
  cultural_event: 'Culture',
  reconstruction: 'Reconstruction',
  institutional_progress: 'Institutions',
  solidarity: 'Solidarité',
  economic_positive: 'Économie +',
  international_recognition: 'Reconnaissance',
  environmental_positive: 'Environnement +',
  armed_conflict: 'Conflit armé',
  economic_crisis: 'Crise économique',
  political_tension: 'Tension politique',
  displacement: 'Déplacement',
  infrastructure_failure: 'Infrastructure',
  environmental_negative: 'Environnement −',
  disinformation: 'Désinformation',
  violence: 'Violence',
  neutral: 'Neutre',
};
