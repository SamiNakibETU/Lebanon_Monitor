export interface SourceRegistryEntry {
  source: string;
  sourceType: 'news' | 'official' | 'humanitarian' | 'social' | 'economy' | 'conflict' | 'geospatial' | 'indicators';
  license: 'open' | 'mixed' | 'restricted';
  refreshIntervalSec: number;
  trustWeight: number;
  languageProfile: Array<'ar' | 'fr' | 'en' | 'multi'>;
}

export const SOURCE_REGISTRY: SourceRegistryEntry[] = [
  { source: 'gdelt', sourceType: 'news', license: 'open', refreshIntervalSec: 900, trustWeight: 0.58, languageProfile: ['multi'] },
  { source: 'rss', sourceType: 'news', license: 'mixed', refreshIntervalSec: 900, trustWeight: 0.62, languageProfile: ['ar', 'fr', 'en'] },
  { source: 'reliefweb', sourceType: 'humanitarian', license: 'open', refreshIntervalSec: 3600, trustWeight: 0.85, languageProfile: ['multi'] },
  { source: 'ucdp', sourceType: 'conflict', license: 'open', refreshIntervalSec: 43200, trustWeight: 0.9, languageProfile: ['en'] },
  { source: 'twitter', sourceType: 'social', license: 'mixed', refreshIntervalSec: 1800, trustWeight: 0.5, languageProfile: ['ar', 'fr', 'en'] },
  { source: 'telegram', sourceType: 'social', license: 'mixed', refreshIntervalSec: 1800, trustWeight: 0.54, languageProfile: ['ar', 'fr', 'en'] },
  { source: 'firms', sourceType: 'geospatial', license: 'open', refreshIntervalSec: 10800, trustWeight: 0.88, languageProfile: ['en'] },
  { source: 'cloudflare', sourceType: 'indicators', license: 'open', refreshIntervalSec: 1800, trustWeight: 0.82, languageProfile: ['en'] },
  { source: 'lbp-rate', sourceType: 'economy', license: 'mixed', refreshIntervalSec: 3600, trustWeight: 0.7, languageProfile: ['en'] },
  { source: 'openaq', sourceType: 'indicators', license: 'open', refreshIntervalSec: 3600, trustWeight: 0.84, languageProfile: ['en'] },
  { source: 'hapi', sourceType: 'humanitarian', license: 'open', refreshIntervalSec: 21600, trustWeight: 0.83, languageProfile: ['en'] },
  { source: 'acaps', sourceType: 'humanitarian', license: 'mixed', refreshIntervalSec: 21600, trustWeight: 0.8, languageProfile: ['en'] },
  { source: 'official-statements', sourceType: 'official', license: 'open', refreshIntervalSec: 3600, trustWeight: 0.9, languageProfile: ['ar', 'fr', 'en'] },
];

export const SOURCE_REGISTRY_BY_NAME = new Map(SOURCE_REGISTRY.map((s) => [s.source, s]));

