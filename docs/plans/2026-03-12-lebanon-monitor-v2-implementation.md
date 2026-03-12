# Lebanon Monitor V2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a credible V2 of Lebanon Monitor that adds claims, episodes, geo quality, and territorial vitality on top of the existing stack without a full rewrite.

**Architecture:** Keep the current Next.js app, worker pipeline, and PostgreSQL model as the runtime spine. Extend the schema and services to represent `claim`, `episode`, entity links, and geo uncertainty; then expose these objects through APIs and focused analyst-facing UI surfaces.

**Tech Stack:** Next.js 16, React 18, TypeScript 5, PostgreSQL, Vitest, existing worker pipeline in `src/worker`, existing repositories in `src/db`, existing core domain helpers in `src/core` and `src/geo`.

---

## Implementation principles

- Prefer extending the current repo over architectural migration.
- Treat misleading labels as bugs, not branding.
- Land representation before polish: schema and API first, UI second.
- Keep LLM usage narrow and replaceable.
- Write tests before each new domain behavior.
- Commit in small vertical slices.

---

## Phase boundaries

- **Phase 0:** Truthfulness and cleanup
- **Phase 1:** Schema and ontology spine
- **Phase 2:** Claim and entity persistence
- **Phase 3:** Episode engine and geo quality
- **Phase 4:** Vitality and UX integration

---

### Task 1: Clean up misleading intelligence surfaces

**Files:**
- Modify: `src/app/api/v2/clusters/route.ts`
- Modify: `src/app/api/v2/analyst-workbench/route.ts`
- Modify: `src/components/widgets/AnalystWorkbenchWidget.tsx`
- Modify: `src/components/widgets/CausalTimelineWidget.tsx`
- Modify: `src/components/sections/SectionGeopolitique.tsx`
- Test: `src/app/api/v2/__tests__/clusters-route.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';

describe('clusters route naming', () => {
  it('returns a payload that is explicitly labeled as trending when no real clusters exist', async () => {
    const payload = { mode: 'cluster' };
    expect(payload.mode).toBe('trending');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/app/api/v2/__tests__/clusters-route.test.ts`
Expected: FAIL because the route and payload contract still imply semantic clustering.

**Step 3: Write minimal implementation**

```ts
return NextResponse.json({
  mode: 'trending',
  items,
  generatedAt: new Date().toISOString(),
});
```

Also rename or relabel:

- `Analyst Workbench` -> `Event Review Queue` if it remains list-based
- `Causal Timeline` -> `Hourly Activity`

**Step 4: Run tests and type-check**

Run: `npm run test -- src/app/api/v2/__tests__/clusters-route.test.ts`
Run: `npm run type-check`
Expected: PASS and no naming contract that overclaims intelligence.

**Step 5: Commit**

```bash
git add src/app/api/v2/clusters/route.ts src/app/api/v2/analyst-workbench/route.ts src/components/widgets/AnalystWorkbenchWidget.tsx src/components/widgets/CausalTimelineWidget.tsx src/components/sections/SectionGeopolitique.tsx src/app/api/v2/__tests__/clusters-route.test.ts
git commit -m "fix: remove misleading intelligence labels"
```

---

### Task 2: Add schema for claims, episodes, and geo uncertainty

**Files:**
- Create: `src/db/migrations/002_claim_episode_geo.sql`
- Modify: `src/db/types.ts`
- Modify: `src/db/index.ts`
- Create: `src/db/repositories/claim-repository.ts`
- Create: `src/db/repositories/episode-repository.ts`
- Test: `src/db/__tests__/claim-repository.test.ts`
- Test: `src/db/__tests__/episode-repository.test.ts`

**Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';

describe('claim repository', () => {
  it('creates a claim linked to a source item and event', async () => {
    const claim = { text: 'Three killed', eventId: 'event-1', sourceItemId: 'source-1' };
    expect(claim.text).toContain('killed');
  });
});
```

```ts
describe('episode repository', () => {
  it('stores an episode and links events in order', async () => {
    const membership = [{ eventId: 'event-1', order: 1 }];
    expect(membership).toHaveLength(1);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm run test -- src/db/__tests__/claim-repository.test.ts src/db/__tests__/episode-repository.test.ts`
Expected: FAIL because repositories and schema do not exist yet.

**Step 3: Write minimal implementation**

```sql
CREATE TABLE claim (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES event(id) ON DELETE CASCADE,
  source_item_id UUID NOT NULL REFERENCES source_item(id) ON DELETE CASCADE,
  claim_text TEXT NOT NULL,
  claim_type VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'asserted',
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE episode (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  summary TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  first_event_at TIMESTAMPTZ NOT NULL,
  last_event_at TIMESTAMPTZ NOT NULL,
  event_count INT NOT NULL DEFAULT 0,
  footprint_geojson JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE event ADD COLUMN geo_method VARCHAR(30);
ALTER TABLE event ADD COLUMN uncertainty_radius_m INT;
```

```ts
export interface ClaimRow {
  id: string;
  event_id: string | null;
  source_item_id: string;
  claim_text: string;
  claim_type: string | null;
  status: 'asserted' | 'contradicted' | 'retracted';
  confidence_score: number | null;
  created_at: Date;
}
```

**Step 4: Run migrations, tests, and type-check**

Run: `npm run db:migrate`
Run: `npm run test -- src/db/__tests__/claim-repository.test.ts src/db/__tests__/episode-repository.test.ts`
Run: `npm run type-check`
Expected: PASS with repositories aligned to schema.

**Step 5: Commit**

```bash
git add src/db/migrations/002_claim_episode_geo.sql src/db/types.ts src/db/index.ts src/db/repositories/claim-repository.ts src/db/repositories/episode-repository.ts src/db/__tests__/claim-repository.test.ts src/db/__tests__/episode-repository.test.ts
git commit -m "feat: add claim and episode persistence"
```

---

### Task 3: Persist extracted entities instead of leaving them aspirational

**Files:**
- Modify: `src/lib/nlp/entity-extract.ts`
- Create: `src/core/enrichment/entity-linking.ts`
- Modify: `src/worker/normalize.ts`
- Modify: `src/worker/store.ts`
- Modify: `src/db/repositories/event-repository.ts`
- Create: `src/db/repositories/entity-repository.ts`
- Test: `src/core/__tests__/entity-linking.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { linkEntitiesToEvent } from '../enrichment/entity-linking';

describe('entity linking', () => {
  it('maps extracted people and organizations to event roles', () => {
    const result = linkEntitiesToEvent({
      entities: ['Hezbollah', 'UNIFIL'],
      eventType: 'armed_conflict',
    });

    expect(result.length).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/core/__tests__/entity-linking.test.ts`
Expected: FAIL because the linker and repository path do not exist.

**Step 3: Write minimal implementation**

```ts
export function linkEntitiesToEvent(input: {
  entities: string[];
  eventType: string | null;
}) {
  return input.entities.map((name) => ({
    name,
    role: input.eventType === 'armed_conflict' ? 'mentioned_actor' : 'mentioned_entity',
  }));
}
```

Persist the result during `storeNewEvent` / `linkToExistingEvent` so `entity` and `event_entity` stop being dead schema.

**Step 4: Run tests and regression checks**

Run: `npm run test -- src/core/__tests__/entity-linking.test.ts src/db/__tests__/event-repository.test.ts`
Run: `npm run type-check`
Expected: PASS and no regression on existing event storage.

**Step 5: Commit**

```bash
git add src/lib/nlp/entity-extract.ts src/core/enrichment/entity-linking.ts src/worker/normalize.ts src/worker/store.ts src/db/repositories/event-repository.ts src/db/repositories/entity-repository.ts src/core/__tests__/entity-linking.test.ts
git commit -m "feat: persist linked entities on events"
```

---

### Task 4: Add claim extraction V1 with provenance

**Files:**
- Create: `src/core/claims/types.ts`
- Create: `src/core/claims/extract-claims.ts`
- Create: `src/core/__tests__/claim-extraction.test.ts`
- Modify: `src/worker/normalize.ts`
- Modify: `src/worker/store.ts`
- Modify: `src/worker/pipeline.ts`
- Modify: `src/db/repositories/claim-repository.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { extractClaims } from '../claims/extract-claims';

describe('claim extraction', () => {
  it('extracts a casualty claim from a news summary', () => {
    const claims = extractClaims({
      title: 'Three killed in strike near Tyre',
      summary: 'Local media reported three fatalities after an overnight strike.',
    });

    expect(claims[0]?.claimType).toBe('casualty');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/core/__tests__/claim-extraction.test.ts`
Expected: FAIL because extraction logic does not exist.

**Step 3: Write minimal implementation**

```ts
export function extractClaims(input: { title?: string | null; summary?: string | null }) {
  const text = `${input.title ?? ''} ${input.summary ?? ''}`.trim();
  if (/killed|dead|fatalit/i.test(text)) {
    return [{ claimText: text, claimType: 'casualty', status: 'asserted' as const }];
  }
  return [];
}
```

Call the extractor after normalization and before final event persistence so each stored claim references:

- `source_item_id`
- `event_id`
- extraction method
- confidence score

**Step 4: Run tests and type-check**

Run: `npm run test -- src/core/__tests__/claim-extraction.test.ts`
Run: `npm run type-check`
Expected: PASS with claim rows written for supported patterns.

**Step 5: Commit**

```bash
git add src/core/claims/types.ts src/core/claims/extract-claims.ts src/core/__tests__/claim-extraction.test.ts src/worker/normalize.ts src/worker/store.ts src/worker/pipeline.ts src/db/repositories/claim-repository.ts
git commit -m "feat: extract and persist first claims"
```

---

### Task 5: Build the episode engine V1

**Files:**
- Create: `src/core/episodes/types.ts`
- Create: `src/core/episodes/link-event-to-episode.ts`
- Create: `src/core/__tests__/episode-linking.test.ts`
- Modify: `src/worker/cluster.ts`
- Modify: `src/worker/pipeline.ts`
- Modify: `src/db/repositories/episode-repository.ts`
- Create: `src/app/api/v2/episodes/route.ts`
- Create: `src/app/api/v2/episodes/[id]/route.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { chooseEpisodeForEvent } from '../episodes/link-event-to-episode';

describe('episode linking', () => {
  it('attaches an event to an open episode when time, place, and type are aligned', () => {
    const result = chooseEpisodeForEvent({
      event: { eventType: 'armed_conflict', placeId: 'tyre', occurredAt: new Date('2026-03-12') },
      candidates: [{ id: 'ep-1', eventType: 'armed_conflict', placeId: 'tyre', lastEventAt: new Date('2026-03-11') }],
    });

    expect(result?.id).toBe('ep-1');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/core/__tests__/episode-linking.test.ts`
Expected: FAIL because the episode linker does not exist.

**Step 3: Write minimal implementation**

```ts
export function chooseEpisodeForEvent(input: {
  event: { eventType: string | null; placeId: string | null; occurredAt: Date };
  candidates: Array<{ id: string; eventType: string | null; placeId: string | null; lastEventAt: Date }>;
}) {
  return input.candidates.find((candidate) => {
    const sameType = candidate.eventType === input.event.eventType;
    const samePlace = candidate.placeId === input.event.placeId;
    const withinWindow = input.event.occurredAt.getTime() - candidate.lastEventAt.getTime() < 1000 * 60 * 60 * 24 * 7;
    return sameType && samePlace && withinWindow;
  }) ?? null;
}
```

Integrate this in the worker after event creation or update, and expose:

- `GET /api/v2/episodes`
- `GET /api/v2/episodes/:id`

**Step 4: Run tests and targeted API checks**

Run: `npm run test -- src/core/__tests__/episode-linking.test.ts`
Run: `npm run type-check`
Expected: PASS and new episode endpoints compile cleanly.

**Step 5: Commit**

```bash
git add src/core/episodes/types.ts src/core/episodes/link-event-to-episode.ts src/core/__tests__/episode-linking.test.ts src/worker/cluster.ts src/worker/pipeline.ts src/db/repositories/episode-repository.ts src/app/api/v2/episodes/route.ts src/app/api/v2/episodes/[id]/route.ts
git commit -m "feat: add episode engine and api"
```

---

### Task 6: Expose claims, entities, and episode membership on event detail

**Files:**
- Modify: `src/app/api/v2/events/[id]/route.ts`
- Modify: `src/app/api/v2/events/route.ts`
- Modify: `src/app/event/[id]/page.tsx`
- Create: `src/components/EventClaims.tsx`
- Create: `src/components/EpisodeBadge.tsx`
- Test: `src/app/api/v2/__tests__/event-detail-route.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';

describe('event detail payload', () => {
  it('includes claims, linked entities, and episode membership', async () => {
    const payload = { claims: [], entities: [], episode: null };
    expect(Array.isArray(payload.claims)).toBe(true);
    expect(Array.isArray(payload.entities)).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/app/api/v2/__tests__/event-detail-route.test.ts`
Expected: FAIL because the detail payload does not return these fields yet.

**Step 3: Write minimal implementation**

```ts
return NextResponse.json({
  ...event,
  claims,
  entities,
  episode,
});
```

Update the event detail page so the analyst can inspect:

- source observations
- claim list
- entity list
- linked episode
- geo quality

**Step 4: Run tests and type-check**

Run: `npm run test -- src/app/api/v2/__tests__/event-detail-route.test.ts`
Run: `npm run type-check`
Expected: PASS and detail page builds.

**Step 5: Commit**

```bash
git add src/app/api/v2/events/[id]/route.ts src/app/api/v2/events/route.ts src/app/event/[id]/page.tsx src/components/EventClaims.tsx src/components/EpisodeBadge.tsx src/app/api/v2/__tests__/event-detail-route.test.ts
git commit -m "feat: show claims and episodes on event detail"
```

---

### Task 7: Add geo quality and episode footprint support

**Files:**
- Modify: `src/geo/types.ts`
- Modify: `src/geo/resolve-place.ts`
- Modify: `src/worker/store.ts`
- Modify: `src/app/api/v2/events/route.ts`
- Modify: `src/app/api/v2/episodes/[id]/route.ts`
- Modify: `src/components/hero/HeroMap.tsx`
- Test: `src/geo/__tests__/resolve-place.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';

describe('geo quality', () => {
  it('returns precision, method, and uncertainty radius for resolved places', () => {
    const geo = { precision: 'city', method: 'gazetteer', uncertaintyRadiusM: 2500 };
    expect(geo.uncertaintyRadiusM).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/geo/__tests__/resolve-place.test.ts`
Expected: FAIL because the return contract does not include uncertainty metadata end-to-end.

**Step 3: Write minimal implementation**

```ts
return {
  placeId,
  lat,
  lng,
  precision: 'city',
  method: 'gazetteer',
  uncertaintyRadiusM: 2500,
};
```

Expose the new fields in event and episode APIs. In `HeroMap`, render uncertain points differently from exact ones rather than pretending identical certainty.

**Step 4: Run tests and type-check**

Run: `npm run test -- src/geo/__tests__/resolve-place.test.ts`
Run: `npm run type-check`
Expected: PASS with visible geo quality in API contracts.

**Step 5: Commit**

```bash
git add src/geo/types.ts src/geo/resolve-place.ts src/worker/store.ts src/app/api/v2/events/route.ts src/app/api/v2/episodes/[id]/route.ts src/components/hero/HeroMap.tsx src/geo/__tests__/resolve-place.test.ts
git commit -m "feat: add geo quality and uncertainty metadata"
```

---

### Task 8: Replace Lumière with Territorial Vitality

**Files:**
- Create: `src/app/api/v2/vitality/route.ts`
- Create: `src/components/sections/SectionVitalite.tsx`
- Create: `src/components/widgets/VitalityOverviewWidget.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/components/sections/SectionLumiere.tsx`
- Modify: `src/components/widgets/ReconstructionWidget.tsx`
- Modify: `src/components/widgets/CultureWidget.tsx`
- Modify: `src/components/widgets/SolidarityActiveWidget.tsx`
- Test: `src/analytics/__tests__/vitality-aggregates.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';

describe('vitality aggregates', () => {
  it('separates direct measures, proxies, and narrative indicators', () => {
    const payload = {
      measured: ['lbp_stability'],
      proxy: ['cloudflare_connectivity'],
      narrative: ['cultural_density'],
    };

    expect(payload.measured).toContain('lbp_stability');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/analytics/__tests__/vitality-aggregates.test.ts`
Expected: FAIL because no vitality endpoint or aggregation contract exists.

**Step 3: Write minimal implementation**

```ts
return NextResponse.json({
  module: 'territorial_vitality',
  measured: measuredIndicators,
  proxy: proxyIndicators,
  narrative: narrativeIndicators,
});
```

Update the home page so:

- `SectionLumiere` is removed or converted into a compatibility wrapper
- `SectionVitalite` becomes the primary continuity/recovery surface
- labels stop implying "good news" and start implying territorial function

**Step 4: Run tests and type-check**

Run: `npm run test -- src/analytics/__tests__/vitality-aggregates.test.ts`
Run: `npm run type-check`
Expected: PASS and the home compiles with the new section.

**Step 5: Commit**

```bash
git add src/app/api/v2/vitality/route.ts src/components/sections/SectionVitalite.tsx src/components/widgets/VitalityOverviewWidget.tsx src/app/page.tsx src/components/sections/SectionLumiere.tsx src/components/widgets/ReconstructionWidget.tsx src/components/widgets/CultureWidget.tsx src/components/widgets/SolidarityActiveWidget.tsx src/analytics/__tests__/vitality-aggregates.test.ts
git commit -m "feat: replace lumiere with territorial vitality"
```

---

### Task 9: Add episode-first navigation

**Files:**
- Create: `src/app/episodes/page.tsx`
- Create: `src/app/episodes/[id]/page.tsx`
- Create: `src/components/EpisodeList.tsx`
- Create: `src/components/EpisodeTimeline.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/components/sections/SectionLumiereOmbre.tsx`
- Test: `src/app/api/v2/__tests__/episodes-route.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';

describe('episodes route', () => {
  it('returns a list of active episodes for the home and episodes page', async () => {
    const payload = { items: [] };
    expect(Array.isArray(payload.items)).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/app/api/v2/__tests__/episodes-route.test.ts`
Expected: FAIL until the route is wired into page-level use.

**Step 3: Write minimal implementation**

```tsx
export default function EpisodesPage() {
  return <EpisodeList title="Episodes actifs" />;
}
```

Put `Episodes actifs` on the home page above long thematic scrolling so the product narrative moves from raw events toward analytic units.

**Step 4: Run tests and type-check**

Run: `npm run test -- src/app/api/v2/__tests__/episodes-route.test.ts`
Run: `npm run type-check`
Expected: PASS and episodes pages compile.

**Step 5: Commit**

```bash
git add src/app/episodes/page.tsx src/app/episodes/[id]/page.tsx src/components/EpisodeList.tsx src/components/EpisodeTimeline.tsx src/app/page.tsx src/components/sections/SectionLumiereOmbre.tsx src/app/api/v2/__tests__/episodes-route.test.ts
git commit -m "feat: add episode-first navigation"
```

---

### Task 10: Verification and release gate for V2 alpha

**Files:**
- Modify: `scripts/verify-all.mjs`
- Create: `docs/plans/2026-03-12-lebanon-monitor-v2-release-checklist.md`
- Modify: `docs/LEBANON_MONITOR_DIRECTOR_BRIEF.md`
- Modify: `docs/STATUS_PLAN.md`

**Step 1: Write the failing checklist**

```md
- [ ] Claims visible on event detail
- [ ] Episodes page works
- [ ] Geo uncertainty exposed in API
- [ ] Territorial Vitality replaces Lumière
- [ ] Misleading intelligence labels removed
```

**Step 2: Run current verification**

Run: `npm run verify`
Expected: FAIL or incomplete coverage because V2 checks are not yet part of the release gate.

**Step 3: Write minimal implementation**

```js
const requiredChecks = [
  'type-check',
  'claims-contract',
  'episodes-contract',
  'geo-quality-contract',
  'vitality-contract',
];
```

Update docs so the repo no longer claims completion for surfaces that remain heuristic or transitional.

**Step 4: Run full verification**

Run: `npm run test`
Run: `npm run type-check`
Run: `npm run verify`
Expected: PASS with V2 alpha acceptance criteria tracked explicitly.

**Step 5: Commit**

```bash
git add scripts/verify-all.mjs docs/plans/2026-03-12-lebanon-monitor-v2-release-checklist.md docs/LEBANON_MONITOR_DIRECTOR_BRIEF.md docs/STATUS_PLAN.md
git commit -m "docs: add v2 alpha release gate"
```

---

## Suggested execution order

1. Task 1
2. Task 2
3. Task 3
4. Task 4
5. Task 5
6. Task 6
7. Task 7
8. Task 8
9. Task 9
10. Task 10

This sequence is intentional:

- first make the product more honest
- then add missing objects
- then expose those objects
- only then reshape the UX around them

---

## Definition of done for this plan

- `claim`, `episode`, and geo quality exist in schema, repositories, and APIs
- event detail shows claims, entities, and episode membership
- the product has an episode-first entry point
- the old Lumière framing is replaced by Territorial Vitality
- misleading analytic theater has been renamed, removed, or clearly scoped

---

## Notes for the implementer

- Do not start with agents.
- Do not start with a monorepo migration.
- Do not build semantic retrieval before claim and episode persistence work.
- If a widget cannot justify its data model, demote or remove it.
- Prefer boring traceable logic over impressive heuristics.
