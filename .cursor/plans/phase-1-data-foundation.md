# Phase 1 Plan — Data Foundation

## Objective
Build and validate the complete data ingestion layer for Lebanon Monitor. At the end of this phase, all 10 data sources should be independently fetchable, normalized to `LebanonEvent[]`, classified as lumière/ombre/neutre, and testable offline.

## Pre-requisites
- Node.js 20+
- npm/pnpm initialized
- `.env.local` with: `FIRMS_MAP_KEY`, `OWM_API_KEY`, `CF_API_TOKEN` (optional for MVP)

## Step-by-Step Implementation Order

### Step 0: Project Scaffold
1. Initialize Next.js 14 project with TypeScript, App Router, Tailwind
2. Install deps: `rss-parser`, `cheerio`, `zod`, `swr`
3. Install dev deps: `vitest`, `@vitest/coverage-v8`
4. Create directory structure:
```
src/
├── types/
│   ├── events.ts        # LebanonEvent, EventCategory, SourceName
│   └── common.ts        # Result<T,E>, SourceError
├── sources/
│   ├── registry.ts      # source registry + aggregator
│   ├── gdelt/
│   ├── usgs/
│   ├── firms/
│   ├── gdacs/
│   ├── reliefweb/
│   ├── weather/
│   ├── cloudflare/
│   ├── rss/
│   ├── lbp-rate/
│   └── openaq/
├── lib/
│   ├── fetcher.ts       # shared fetch wrapper with timeout + retry
│   ├── logger.ts        # structured logging
│   └── classification/
│       ├── keywords.ts   # dictionaries fr/en/ar
│       └── classifier.ts # shared classification logic
├── app/
│   └── api/
│       └── sources/
│           └── [source]/
│               └── route.ts
└── config/
    └── lebanon.ts       # bounding box, cities, constants
```
5. Configure vitest.config.ts
6. Configure tsconfig with strict mode
7. Add scripts to package.json: `test`, `test:watch`, `lint`, `type-check`

### Step 1: Core Types & Utilities
1. Define `LebanonEvent` interface in `src/types/events.ts`
2. Define `SourceName` enum with all 10 sources
3. Define `EventCategory` enum with all lumière + ombre categories
4. Define `Result<T, E>` type in `src/types/common.ts`
5. Build `src/lib/fetcher.ts` — shared fetch with timeout, AbortController, retry
6. Build `src/lib/logger.ts` — console-based structured logger
7. Build `src/config/lebanon.ts` — bounding box, city coordinates, constants
8. Build keyword dictionaries in `src/lib/classification/keywords.ts`
9. Build shared classifier in `src/lib/classification/classifier.ts`

### Step 2: GDELT Source (Priority 1)
1. Read `docs/API_REFERENCE.md` section on GDELT
2. Implement `src/sources/gdelt/` following the source module structure
3. Test live fetch, save fixture
4. Write and run tests
5. Verify: events have titles, dates, tones, source URLs

### Step 3: USGS Source (Priority 2)
1. Read API_REFERENCE.md section on USGS
2. Implement `src/sources/usgs/` — this one returns GeoJSON, map directly
3. Test live fetch, save fixture
4. Write and run tests
5. Verify: all events within Lebanon bounding box, magnitudes correct

### Step 4: NASA FIRMS Source (Priority 3)
1. Read API_REFERENCE.md section on FIRMS
2. Implement CSV parser for FIRMS response
3. Test live fetch (requires FIRMS_MAP_KEY in .env.local)
4. Write and run tests
5. Verify: fire points within Lebanon, confidence values parsed

### Step 5: RSS Feeds Source (Priority 4)
1. Read API_REFERENCE.md section on RSS
2. Implement multi-feed aggregator using `rss-parser`
3. Filter non-Lebanon articles from international feeds
4. Test all 6 feeds, save fixtures
5. Write and run tests

### Step 6: GDACS Source (Priority 5)
1. Implement `src/sources/gdacs/`
2. Test live fetch, save fixture
3. Write and run tests

### Step 7: ReliefWeb Source (Priority 6)
1. Implement `src/sources/reliefweb/`
2. Test live fetch, save fixture
3. Write and run tests

### Step 8: OpenWeatherMap Source (Priority 7)
1. Implement `src/sources/weather/`
2. Fetch for 4 cities: Beirut, Tripoli, Sidon, Baalbek
3. Test live fetch, save fixture
4. Write and run tests

### Step 9: Remaining Sources (Priorities 8-10)
1. Implement Cloudflare Radar (`src/sources/cloudflare/`)
2. Implement LBP/USD scraper (`src/sources/lbp-rate/`)
3. Implement OpenAQ (`src/sources/openaq/`)
4. Test all, save fixtures, write tests

### Step 10: Source Registry & Aggregation
1. Build `src/sources/registry.ts`:
   - Register all sources with their fetch functions
   - `fetchAll()` → calls all sources in parallel with `Promise.allSettled`
   - Returns unified `LebanonEvent[]` sorted by timestamp
   - Logs: source status, event counts, errors
2. Build health check endpoint: `GET /api/health`
3. Build unified events endpoint: `GET /api/events?source=all&classification=all`

### Step 11: Validation & Cleanup
1. Run all tests: `npx vitest run`
2. Run type check: `npx tsc --noEmit`
3. Run lint: `npx eslint . --fix`
4. Delete any unused files, temp scripts, or stale fixtures
5. Verify `.gitignore` covers: node_modules, .env.local, .next
6. Generate final health check report

## Success Criteria
- [ ] All 10 sources return data (or gracefully handle unavailability)
- [ ] All events normalize to LebanonEvent interface
- [ ] All tests pass (`npx vitest run` = 0 failures)
- [ ] TypeScript compiles cleanly (`npx tsc --noEmit` = 0 errors)
- [ ] `/api/events` returns aggregated events from all sources
- [ ] `/api/health` shows status of each source
- [ ] No hardcoded secrets in code
- [ ] Project structure matches the defined convention
