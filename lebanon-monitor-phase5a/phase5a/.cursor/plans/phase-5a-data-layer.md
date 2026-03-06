# Phase 5A — Data Layer Refactor & Test Suite

## Golden Rule
**ZERO UI work in this phase.** No components, no CSS, no layout changes.
Only: types, classification, deduplication, sources, API routes, and TESTS.
The goal: `npx vitest run` passes with 50+ tests before we touch any UI.

---

## Architecture Target

```
src/
├── core/                              # PURE TS — no React, no Next, no fetch
│   ├── types.ts                       # LebanonEvent, SourceName, EventCategory, etc.
│   ├── constants.ts                   # Lebanon bbox, cities, source priorities
│   ├── classification/
│   │   ├── index.ts                   # barrel: classify(text, options) → Classification
│   │   ├── pre-classifier.ts          # HARD keyword override — catches 60%+
│   │   ├── keyword-scorer.ts          # dictionary-based scoring
│   │   ├── tone-mapper.ts             # GDELT tone → classification
│   │   ├── ensemble.ts                # weighted combination of all signals
│   │   └── dictionaries/
│   │       ├── ombre-ar.ts            # Arabic ombre keywords array
│   │       ├── ombre-fr.ts            # French ombre keywords array
│   │       ├── ombre-en.ts            # English ombre keywords array
│   │       ├── lumiere-ar.ts
│   │       ├── lumiere-fr.ts
│   │       └── lumiere-en.ts
│   ├── deduplication/
│   │   ├── index.ts                   # deduplicateEvents(events) → events
│   │   ├── normalize-title.ts         # title normalization
│   │   └── jaccard.ts                 # Jaccard similarity
│   ├── language/
│   │   └── detect.ts                  # detectLanguage(text) → 'ar' | 'fr' | 'en'
│   └── __tests__/
│       ├── classification.test.ts     # 50+ test cases
│       ├── pre-classifier.test.ts     # hard override tests
│       ├── deduplication.test.ts      # dedup tests
│       ├── language-detect.test.ts
│       └── fixtures/
│           ├── ombre-titles.json      # 25 real ombre headlines
│           └── lumiere-titles.json    # 25 real lumière headlines
│
├── sources/
│   ├── registry.ts                    # fetchAll → {events, indicators, statuses}
│   │                                  # events = classified + deduped (NO weather/lbp/aq)
│   │                                  # indicators = weather + lbp + aq (separate)
│   ├── __tests__/
│   │   └── registry.test.ts           # integration test with mock sources
│   └── [each source as before]
│
└── app/api/
    ├── events/route.ts                # GET → {events, total, statuses}
    ├── indicators/route.ts            # GET → {weather, lbpRate, airQuality}
    └── health/route.ts                # GET → source status grid
```

---

## Step-by-Step Execution

### STEP 0 — Setup Vitest (if not already done)

1. Ensure `vitest` and `@vitest/coverage-v8` are installed
2. Create/verify `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/core/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```
3. Add to `package.json` scripts:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

### STEP 1 — Create `src/core/types.ts`

Move/rewrite all shared types here. This file has ZERO imports from external packages.

```typescript
// Source names — only sources that produce EVENTS (not indicators)
export type EventSourceName = 
  | 'gdelt' | 'usgs' | 'firms' | 'rss' | 'gdacs' 
  | 'reliefweb' | 'twitter' | 'cloudflare';

// Sources that produce INDICATORS (shown in header, not in panels)
export type IndicatorSourceName = 'weather' | 'lbp-rate' | 'openaq';

// All sources combined
export type SourceName = EventSourceName | IndicatorSourceName;

export type Classification = 'lumiere' | 'ombre' | 'neutre';

export type OmbreCategory =
  | 'armed_conflict' | 'economic_crisis' | 'political_tension'
  | 'displacement' | 'infrastructure_failure' | 'environmental_negative'
  | 'disinformation' | 'violence';

export type LumiereCategory =
  | 'cultural_event' | 'reconstruction' | 'institutional_progress'
  | 'solidarity' | 'economic_positive' | 'international_recognition'
  | 'environmental_positive';

export type EventCategory = OmbreCategory | LumiereCategory | 'neutre';

export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type SourceReliability = 'high' | 'medium' | 'low';

export interface LebanonEvent {
  id: string;
  source: EventSourceName;
  title: string;
  description?: string;
  url?: string;
  timestamp: Date;
  latitude: number;
  longitude: number;
  classification: Classification;
  confidence: number;
  category: EventCategory;
  severity: Severity;
  rawData?: Record<string, unknown>;
  metadata: {
    fetchedAt: Date;
    ttlSeconds: number;
    sourceReliability: SourceReliability;
  };
}

export interface ClassificationResult {
  classification: Classification;
  confidence: number;
  category: EventCategory;
  method: 'pre-classifier' | 'keyword' | 'ensemble' | 'tone';
}

export interface Indicators {
  weather?: { city: string; temp: number; condition: string; };
  lbpRate?: { rate: number; trend?: 'up' | 'down' | 'stable'; };
  airQuality?: { pm25?: number; location?: string; };
}

export interface SourceStatus {
  source: SourceName;
  status: 'ok' | 'error' | 'rate-limited' | 'no-data' | 'skipped';
  eventCount: number;
  responseTimeMs: number;
  error?: string;
  cached?: boolean;
}
```

### STEP 2 — Create `src/core/constants.ts`

```typescript
export const LEBANON_BBOX = {
  north: 34.69,
  south: 33.05,
  east: 36.62,
  west: 35.10,
} as const;

export const LEBANON_CENTER = { lat: 33.8938, lng: 35.5018 } as const;

export const CITIES: Record<string, { lat: number; lng: number }> = {
  'beirut': { lat: 33.8938, lng: 35.5018 },
  'beyrouth': { lat: 33.8938, lng: 35.5018 },
  'بيروت': { lat: 33.8938, lng: 35.5018 },
  'tripoli': { lat: 34.4332, lng: 35.8498 },
  'طرابلس': { lat: 34.4332, lng: 35.8498 },
  'sidon': { lat: 33.5571, lng: 35.3729 },
  'saida': { lat: 33.5571, lng: 35.3729 },
  'صيدا': { lat: 33.5571, lng: 35.3729 },
  'tyre': { lat: 33.2705, lng: 35.2038 },
  'sour': { lat: 33.2705, lng: 35.2038 },
  'صور': { lat: 33.2705, lng: 35.2038 },
  'baalbek': { lat: 34.0047, lng: 36.2110 },
  'بعلبك': { lat: 34.0047, lng: 36.2110 },
  'jounieh': { lat: 33.9808, lng: 35.6178 },
  'جونيه': { lat: 33.9808, lng: 35.6178 },
  'zahle': { lat: 33.8463, lng: 35.9020 },
  'zahlé': { lat: 33.8463, lng: 35.9020 },
  'زحلة': { lat: 33.8463, lng: 35.9020 },
  'nabatieh': { lat: 33.3779, lng: 35.4839 },
  'النبطية': { lat: 33.3779, lng: 35.4839 },
  'byblos': { lat: 34.1236, lng: 35.6511 },
  'jbeil': { lat: 34.1236, lng: 35.6511 },
  'جبيل': { lat: 34.1236, lng: 35.6511 },
  'dahieh': { lat: 33.8547, lng: 35.5024 },
  'dahiyeh': { lat: 33.8547, lng: 35.5024 },
  'الضاحية': { lat: 33.8547, lng: 35.5024 },
  'south lebanon': { lat: 33.27, lng: 35.40 },
  'sud-liban': { lat: 33.27, lng: 35.40 },
  'جنوب لبنان': { lat: 33.27, lng: 35.40 },
  'bekaa': { lat: 33.85, lng: 36.00 },
  'البقاع': { lat: 33.85, lng: 36.00 },
  'akkar': { lat: 34.55, lng: 36.10 },
  'عكار': { lat: 34.55, lng: 36.10 },
};

export const SOURCE_PRIORITY: Record<string, number> = {
  usgs: 10, firms: 10, gdacs: 10, cloudflare: 9,
  rss: 8, reliefweb: 8, gdelt: 7, 'lbp-rate': 7,
  openaq: 6, weather: 5, twitter: 4,
};

export const EVENT_SOURCES: string[] = [
  'gdelt', 'usgs', 'firms', 'rss', 'gdacs',
  'reliefweb', 'twitter', 'cloudflare',
];

export const INDICATOR_SOURCES: string[] = [
  'weather', 'lbp-rate', 'openaq',
];
```

### STEP 3 — Create classification dictionaries (6 files)

Each file exports a `const` array of strings. See `docs/DICTIONARIES.md` for the complete word lists.

### STEP 4 — Create `src/core/classification/pre-classifier.ts`

This is the MOST IMPORTANT file. It catches obvious cases with near-100% accuracy.

```typescript
import { ClassificationResult } from '../types';

// HARD ombre keywords — if ANY of these appear, it's ombre. Period.
const HARD_OMBRE = [
  // English
  'airstrike', 'airstrikes', 'bombing', 'bombed', 'missile', 'missiles',
  'shelling', 'killed', 'dead', 'death toll', 'casualties', 'wounded',
  'attack', 'attacked', 'explosion', 'blast', 'assassination',
  'invasion', 'ground operation', 'military operation', 'air raid',
  'displaced', 'evacuation', 'evacuated', 'refugee',
  'hezbollah military', 'idf strike', 'israeli strike', 'israeli airstrike',
  // French
  'frappe', 'frappes', 'bombardement', 'bombardé', 'missile',
  'tué', 'tués', 'mort', 'morts', 'victime', 'victimes', 'blessé', 'blessés',
  'attentat', 'explosion', 'assassinat',
  'invasion', 'opération militaire', 'raid aérien',
  'déplacé', 'évacuation', 'réfugié',
  'frappe israélienne', 'armée israélienne',
  // Arabic
  'قصف', 'غارة', 'غارات', 'صاروخ', 'صواريخ',
  'قتل', 'قتيل', 'قتلى', 'شهيد', 'شهداء', 'جريح', 'جرحى', 'ضحايا',
  'تفجير', 'انفجار', 'اغتيال',
  'اجتياح', 'عملية عسكرية', 'غارة جوية',
  'نزوح', 'تهجير', 'إخلاء', 'نازحين', 'لاجئ',
  'الجيش الإسرائيلي', 'استهداف',
];

const HARD_LUMIERE = [
  // English
  'inauguration', 'inaugurated', 'festival', 'concert', 'award', 'prize',
  'reconstruction', 'rebuilt', 'peace agreement', 'ceasefire agreement',
  'donation', 'humanitarian aid received', 'solidarity',
  'new government formed', 'reform passed', 'election results',
  // French
  'inauguration', 'inauguré', 'festival', 'concert', 'prix', 'récompense',
  'reconstruction', 'reconstruit', 'accord de paix', 'cessez-le-feu signé',
  'don', 'aide humanitaire reçue', 'solidarité',
  'nouveau gouvernement', 'réforme adoptée',
  // Arabic
  'افتتاح', 'تدشين', 'مهرجان', 'حفل', 'جائزة', 'تكريم',
  'إعادة إعمار', 'اتفاق سلام', 'وقف إطلاق نار',
  'تبرع', 'مساعدات', 'تضامن',
  'حكومة جديدة', 'إصلاح',
];

export function preClassify(text: string): ClassificationResult | null {
  const lower = text.toLowerCase();
  
  for (const kw of HARD_OMBRE) {
    if (lower.includes(kw.toLowerCase())) {
      return {
        classification: 'ombre',
        confidence: 0.95,
        category: 'armed_conflict',
        method: 'pre-classifier',
      };
    }
  }
  
  for (const kw of HARD_LUMIERE) {
    if (lower.includes(kw.toLowerCase())) {
      return {
        classification: 'lumiere',
        confidence: 0.90,
        category: 'institutional_progress',
        method: 'pre-classifier',
      };
    }
  }
  
  return null;
}
```

### STEP 5 — Create `src/core/classification/keyword-scorer.ts`

Loads all 6 dictionaries. Counts matches. Returns score.

```typescript
import { Classification, EventCategory } from '../types';
import { OMBRE_AR } from './dictionaries/ombre-ar';
import { OMBRE_FR } from './dictionaries/ombre-fr';
import { OMBRE_EN } from './dictionaries/ombre-en';
import { LUMIERE_AR } from './dictionaries/lumiere-ar';
import { LUMIERE_FR } from './dictionaries/lumiere-fr';
import { LUMIERE_EN } from './dictionaries/lumiere-en';

const ALL_OMBRE = [...OMBRE_AR, ...OMBRE_FR, ...OMBRE_EN];
const ALL_LUMIERE = [...LUMIERE_AR, ...LUMIERE_FR, ...LUMIERE_EN];

export function scoreByKeywords(text: string): {
  ombreScore: number;
  lumiereScore: number;
  ombreMatches: string[];
  lumiereMatches: string[];
} {
  const lower = text.toLowerCase();
  const ombreMatches = ALL_OMBRE.filter(kw => lower.includes(kw.toLowerCase()));
  const lumiereMatches = ALL_LUMIERE.filter(kw => lower.includes(kw.toLowerCase()));
  
  // Score: number of matches normalized. More matches = higher confidence.
  const ombreScore = Math.min(ombreMatches.length / 3, 1); // 3 matches = max
  const lumiereScore = Math.min(lumiereMatches.length / 3, 1);
  
  return { ombreScore, lumiereScore, ombreMatches, lumiereMatches };
}
```

### STEP 6 — Create `src/core/classification/ensemble.ts`

Combines pre-classifier, keyword scorer, and optional GDELT tone.

### STEP 7 — Create `src/core/classification/index.ts`

The main `classify()` function that the rest of the app calls.

```typescript
import { ClassificationResult } from '../types';
import { preClassify } from './pre-classifier';
import { scoreByKeywords } from './keyword-scorer';
import { mapTone } from './tone-mapper';

export interface ClassifyOptions {
  tone?: number;       // GDELT tone score
  hfResult?: {         // HF API result (optional, async)
    label: string;
    score: number;
  };
}

export function classify(text: string, options: ClassifyOptions = {}): ClassificationResult {
  // Layer 1: Hard override
  const pre = preClassify(text);
  if (pre) return pre;
  
  // Layer 2: Keyword scoring
  const { ombreScore, lumiereScore } = scoreByKeywords(text);
  
  // Layer 3: GDELT tone (if available)
  const toneResult = options.tone != null ? mapTone(options.tone) : null;
  
  // Layer 4: HF sentiment (if available)
  const hfScore = options.hfResult ? mapHfResult(options.hfResult) : null;
  
  // Ensemble
  let finalOmbre = ombreScore * 0.35;
  let finalLumiere = lumiereScore * 0.35;
  let totalWeight = 0.35;
  
  if (toneResult) {
    finalOmbre += toneResult.ombreScore * 0.20;
    finalLumiere += toneResult.lumiereScore * 0.20;
    totalWeight += 0.20;
  }
  
  if (hfScore) {
    finalOmbre += hfScore.ombreScore * 0.45;
    finalLumiere += hfScore.lumiereScore * 0.45;
    totalWeight += 0.45;
  }
  
  // Normalize
  finalOmbre /= totalWeight;
  finalLumiere /= totalWeight;
  
  // Determine classification
  if (finalOmbre > finalLumiere && finalOmbre > 0.15) {
    return {
      classification: 'ombre',
      confidence: Math.min(finalOmbre + 0.3, 1),
      category: 'political_tension', // default ombre category
      method: 'ensemble',
    };
  }
  
  if (finalLumiere > finalOmbre && finalLumiere > 0.15) {
    return {
      classification: 'lumiere',
      confidence: Math.min(finalLumiere + 0.3, 1),
      category: 'institutional_progress', // default lumière category
      method: 'ensemble',
    };
  }
  
  return {
    classification: 'neutre',
    confidence: 0.5,
    category: 'neutre',
    method: 'ensemble',
  };
}

function mapHfResult(result: { label: string; score: number }): {
  ombreScore: number;
  lumiereScore: number;
} {
  const label = result.label.toLowerCase();
  if (label === 'negative' || label === 'neg' || label.includes('1') || label.includes('2')) {
    return { ombreScore: result.score, lumiereScore: 0 };
  }
  if (label === 'positive' || label === 'pos' || label.includes('4') || label.includes('5')) {
    return { ombreScore: 0, lumiereScore: result.score };
  }
  return { ombreScore: 0.3, lumiereScore: 0.3 }; // neutral
}
```

### STEP 8 — Create deduplication module

`src/core/deduplication/index.ts`, `normalize-title.ts`, `jaccard.ts`

### STEP 9 — Create test fixtures

`src/core/__tests__/fixtures/ombre-titles.json` — 25 real headlines
`src/core/__tests__/fixtures/lumiere-titles.json` — 25 real headlines

### STEP 10 — Write the test suite (50+ tests)

See `docs/TEST_CASES.md` for the complete test specification.

### STEP 11 — Refactor registry

Split `fetchAll()` return into `{ events, indicators, statuses }`.
- `events` = only from EVENT_SOURCES, classified, deduped
- `indicators` = from INDICATOR_SOURCES
- Apply `classify()` from `src/core/classification/` (not the old classifier)

### STEP 12 — Create `/api/indicators/route.ts`

New endpoint, separate from events.

### STEP 13 — Run all tests, fix all failures

`npx vitest run` must show 50+ passing tests and 0 failures.

---

## Success Criteria (HARD REQUIREMENTS)

- [ ] `npx vitest run` → 50+ tests pass, 0 fail
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `classify("Israeli airstrikes target Baalbek")` → ombre
- [ ] `classify("Inauguration d'un centre culturel à Beyrouth")` → lumiere
- [ ] `classify("قصف إسرائيلي يستهدف الضاحية الجنوبية")` → ombre
- [ ] `classify("افتتاح مهرجان بيروت الدولي")` → lumiere
- [ ] `classify("Sidon: 13°C, Clear")` → never appears in events (indicator only)
- [ ] Deduplication reduces 5 identical tweets to 1
- [ ] `/api/events` returns ONLY event sources (no weather, lbp, openaq)
- [ ] `/api/indicators` returns weather, lbp, aq data
- [ ] No import from 'react' anywhere in `src/core/`
