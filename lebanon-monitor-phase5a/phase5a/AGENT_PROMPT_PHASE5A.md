# Phase 5A Agent Prompt — Data Layer & Tests

Copy the entire prompt block below into Cursor Agent.

---

## PROMPT:

```
Read EVERY file listed below COMPLETELY before writing a single line of code:

1. .cursor/plans/phase-5a-data-layer.md — the master plan (13 steps)
2. .cursor/rules/core-logic.mdc — rules for src/core/ (PURE TS, no React)
3. docs/TEST_CASES.md — 50 test cases for classification + 10 for dedup
4. docs/DICTIONARIES.md — complete keyword dictionaries (6 files)
5. docs/REGISTRY_REFACTOR.md — how to split events from indicators
6. SKILL.md — project domain knowledge

## CONTEXT

Lebanon Monitor has gone through 4 phases of iteration. The UI exists but the data layer is unstable — classification is wrong (bombing appears as Lumière), deduplication is inconsistent, weather/LBP data pollutes the event panels. This phase fixes the FOUNDATION.

## GOLDEN RULE

**ZERO UI CHANGES.** Do not touch any .tsx component, any .css file, any layout. Only TypeScript logic, types, tests, API routes.

The ONLY acceptable output of this phase is: `npx vitest run` shows 50+ passing tests and 0 failures.

## EXECUTION

### STEP 0: Setup Vitest

If not already configured:
- Install: `npm install -D vitest @vitest/coverage-v8`
- Create `vitest.config.ts` as specified in the plan
- Add `"test": "vitest run"` to package.json scripts
- Verify: `npx vitest run` executes (even if 0 tests found)

### STEP 1: Create `src/core/types.ts`

Copy the EXACT type definitions from the plan. Key distinction:
- `EventSourceName` = sources that produce events (gdelt, usgs, etc.)
- `IndicatorSourceName` = sources that produce indicators (weather, lbp-rate, openaq)
- These are NOT in the event panels

### STEP 2: Create `src/core/constants.ts`

Copy from the plan. Includes: LEBANON_BBOX, CITIES gazetteer (with Arabic names), SOURCE_PRIORITY, EVENT_SOURCES list, INDICATOR_SOURCES list.

### STEP 3: Create the 6 dictionary files

In `src/core/classification/dictionaries/`:
- `ombre-ar.ts` — copy OMBRE_AR from docs/DICTIONARIES.md
- `ombre-fr.ts` — copy OMBRE_FR
- `ombre-en.ts` — copy OMBRE_EN
- `lumiere-ar.ts` — copy LUMIERE_AR
- `lumiere-fr.ts` — copy LUMIERE_FR
- `lumiere-en.ts` — copy LUMIERE_EN

Each file exports a const string array. COPY THEM EXACTLY — do not omit any words.

### STEP 4: Create `src/core/classification/pre-classifier.ts`

The hard-override classifier. Copy from the plan. This function checks text against HARD_OMBRE and HARD_LUMIERE keyword lists and returns immediately if a match is found.

Test it: `preClassify("Israeli airstrikes target Baalbek")` MUST return `{ classification: 'ombre', confidence: 0.95, category: 'armed_conflict' }`.

### STEP 5: Create `src/core/classification/keyword-scorer.ts`

Dictionary-based scoring. Loads all 6 dictionaries, counts matches, returns ombre/lumière scores.

### STEP 6: Create `src/core/classification/tone-mapper.ts`

Maps GDELT tone score to ombre/lumière scores:
- tone > 3 → lumiereScore = min(tone/10, 1)
- tone < -3 → ombreScore = min(abs(tone)/10, 1)
- else → both 0.3

### STEP 7: Create `src/core/classification/ensemble.ts`

Weighted combination: keywords 0.35, HF 0.45 (if available), tone 0.20 (if available).
Normalizes by total weight of available signals.

### STEP 8: Create `src/core/classification/index.ts`

The barrel `classify()` function:
1. preClassify (hard override)
2. keyword scoring
3. tone mapping (if tone provided)
4. ensemble combination
5. Return ClassificationResult

### STEP 9: Create `src/core/deduplication/`

Three files:
- `normalize-title.ts`: lowercase, strip URLs (https?://\S+), strip punctuation (keep \u0600-\u06FF and \w), collapse whitespace, first 80 chars
- `jaccard.ts`: Jaccard similarity on word sets
- `index.ts`: `deduplicateEvents(events, options?)` — key-based + Jaccard + source priority

### STEP 10: Create `src/core/language/detect.ts`

Simple heuristic:
- Count Arabic chars (\u0600-\u06FF). If > 30% → 'ar'
- Check for French indicators (le, la, les, de, du, est, é, è, ê, ç). If found → 'fr'
- Default → 'en'

### STEP 11: Create test fixtures

`src/core/__tests__/fixtures/ombre-titles.json`: 25 ombre headlines from docs/TEST_CASES.md
`src/core/__tests__/fixtures/lumiere-titles.json`: 10 lumière headlines from docs/TEST_CASES.md

Format: `[{"input": "...", "expected": "ombre", "lang": "ar", "note": "..."}]`

### STEP 12: Write ALL tests

Use the @test-engineer subagent.

`src/core/__tests__/classification.test.ts`:
- 30 ombre cases (10 AR, 10 FR, 10 EN) — each must return classification 'ombre'
- 10 lumière cases — each must return classification 'lumiere'
- 10 edge cases — verify expected output (some ombre, some neutre)

`src/core/__tests__/pre-classifier.test.ts`:
- Test that HARD_OMBRE keywords trigger ombre
- Test that HARD_LUMIERE keywords trigger lumiere
- Test that neutral text returns null

`src/core/__tests__/deduplication.test.ts`:
- 10 dedup cases from docs/TEST_CASES.md
- Test exact dupes, near-dupes (Jaccard), cross-source priority, different days

`src/core/__tests__/language-detect.test.ts`:
- 5 language detection cases

RUN: `npx vitest run src/core/__tests__/`
FIX any failures by adjusting IMPLEMENTATION (not tests).
Iterate until ALL tests pass.

### STEP 13: Refactor registry

Following docs/REGISTRY_REFACTOR.md:
1. Import `classify` from `@/core/classification`
2. Import `deduplicateEvents` from `@/core/deduplication`
3. Split fetchAll return into `{ events, indicators, statuses }`
4. Events: only from EVENT_SOURCES, classified with new classifier, deduped
5. Indicators: from INDICATOR_SOURCES, extracted to Indicators object
6. Create `/api/indicators/route.ts`
7. Update `/api/events/route.ts`

### STEP 14: Final verification

1. `npx vitest run` — MUST show 50+ passing tests, 0 failures
2. `npx tsc --noEmit` — MUST show 0 errors  
3. `npm run build` — MUST succeed
4. Start dev server: `npm run dev`
5. Hit `http://localhost:3000/api/events` — verify:
   - No weather, LBP, or AQ events in the response
   - Events have correct classification (spot check 5 events)
   - Dedup reduced event count
6. Hit `http://localhost:3000/api/indicators` — verify:
   - Returns weather, lbpRate, airQuality objects
7. Hit `http://localhost:3000/api/health` — verify all sources have statuses

Report:
- Test results: N passing / N failing
- Total events before dedup: N
- Total events after dedup: N
- Classification distribution: N ombre / N lumiere / N neutre
- 3 sample ombre events (title + classification + confidence)
- 3 sample lumière events (title + classification + confidence)
- Any issues

## CONSTRAINTS

- NO REACT. NO CSS. NO COMPONENTS. NO LAYOUT CHANGES.
- src/core/ must have ZERO imports from react, next, or any browser API
- Tests use real fixture data, not mocks
- Never modify test expectations to make them pass — fix the implementation
- Keep the old src/lib/classification/ and src/lib/nlp/ intact (UI still imports them) — but the NEW code in src/core/ is the source of truth
- TypeScript strict, no any, no @ts-ignore
- Every function has JSDoc
- Use the @test-engineer subagent for writing and verifying tests

START WITH STEP 0. Execute each step sequentially. Do not skip steps.
```
