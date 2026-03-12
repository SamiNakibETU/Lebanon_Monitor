# Lebanon Monitor V2 Design

**Status:** Proposed  
**Date:** 2026-03-12  
**Input:** `docs/LEBANON_MONITOR_DIRECTOR_BRIEF.md`

---

## 1. Problem To Solve

Lebanon Monitor has crossed the threshold where adding more widgets creates less value, not more. The pipeline is real, the UI is strong, and the country focus is good, but the product still behaves mostly like an enriched monitoring surface. The next version must create an actual analytic core: claims, events, episodes, places, actors, and territorial vitality represented as explicit objects rather than implied by layout.

The main design objective for V2 is therefore not "make the dashboard smarter". It is:

**Turn the existing monitoring stack into an analyst-first geotemporal system without blowing up scope or replacing the whole architecture.**

---

## 2. Recommended Product Position

### Chosen position

**Analyst-first Lebanon intelligence platform, with a public-facing surface still possible later.**

### Why this position

- The repo already has enough data and structure to support deeper analysis, but not enough maturity to compete as a broad public media product.
- The most defensible advantage is depth on one country, not volume or spectacle.
- Claims, episodes, places, and continuity/vitality are useful to analysts, NGOs, journalists, and program teams. They are overkill for a casual public dashboard.

### What the product must stop trying to be

- A visually impressive but analytically shallow "geopolitical dashboard"
- A media object that confuses editorial tone with analytic structure
- A pseudo-agentic system where heuristics are presented as intelligence

---

## 3. Three Possible V2 Approaches

### Option A — Overlay depth on the existing product

Keep the current app structure, add the missing analytic core in-place, and progressively demote misleading widgets.

**Pros**
- Fastest route to a credible V2
- Reuses working ingestion, DB, APIs, and UI
- Lowest migration risk

**Cons**
- Existing naming and structure can keep leaking old assumptions
- Some UI compromises remain during transition

### Option B — Rebuild around a new graph-first platform

Create a new app and data architecture centered on ontology, graph, and episodes from the start.

**Pros**
- Clean conceptual model
- Fewer legacy compromises

**Cons**
- Too much scope for current maturity
- High risk of months of architectural work without product payoff

### Option C — Split product into public app and analyst app now

Run two UX surfaces immediately on top of the same backend.

**Pros**
- Clear segmentation
- Future-friendly

**Cons**
- Premature complexity
- Doubles product and design surface before the core model is stable

### Recommendation

**Choose Option A now.**  
Build the missing analytic substrate inside the current repo, but let that substrate drive a future split if needed. This is the most credible path because it replaces conceptual weakness before adding organizational or UX complexity.

---

## 4. V2 Scope Decision

### What V2 must include

1. **Phase 0 cleanup**
   Remove or rename misleading surfaces so the product stops overclaiming.
2. **Ontology V1**
   Formalize `Document`, `Source`, `Claim`, `Event`, `Episode`, `Place`, `Actor`, `Infrastructure`, `Signal`.
3. **Claim extraction V1**
   Structured claims attached to source items and events, with provenance and status.
4. **Episode engine V1**
   Group events into episodes using time, place, type, and semantic similarity.
5. **Geospatial credibility V1**
   Add explicit location quality and uncertainty, plus episode footprints.
6. **Territorial Vitality module**
   Replace the current "positive" logic with a continuity/recovery model.
7. **Analyst navigation primitives**
   Add views for episodes, richer event detail, place context, and analyst retrieval entry points.

### What V2 must not include

- Full autonomous multi-agent orchestration
- A complete graph database migration
- Full PostGIS-first redesign before the uncertainty model exists
- A giant monorepo rewrite
- New flashy widgets that are not backed by stronger representation

---

## 5. Core Product Decisions

### Decision 1 — Keep the current runtime spine

Use the current Next.js app, PostgreSQL schema, and worker pipeline as the delivery spine. Extend them rather than replacing them.

**Why:** reduces delivery risk and keeps the plan honest.

### Decision 2 — Add missing objects before improving UX

Create `claim`, `episode`, and richer geo metadata before redesigning the home deeply.

**Why:** otherwise the UX keeps narrating events that the system still cannot represent properly.

### Decision 3 — Treat `event_cluster` as legacy unless proven useful

Do not pretend current clusters are semantic intelligence. Either rename the surface to trending, or build a real episode layer that supersedes the existing cluster story.

**Why:** this is one of the current illusions of sophistication.

### Decision 4 — Replace Lumière with Territorial Vitality

Use continuity, reconstruction, civic activity, and place-level functional signals instead of "positive news".

**Why:** it creates a differentiated analytic lens rather than moral color-coding.

### Decision 5 — Keep AI disciplined and narrow

Use rules for deterministic tasks and LLMs only where ambiguity is real: claim extraction, difficult resolution, synthesis, episode qualification.

**Why:** the current weakness is not model quality first; it is world representation.

---

## 6. Proposed V2 System Shape

### Layer 1 — Ingestion and normalization

Keep the current worker flow and repositories. Preserve `raw_ingest`, `source_item`, `event`, and `event_observation` as the backbone.

### Layer 2 — Claim and entity enrichment

Add claim extraction after normalization and before or alongside event persistence. Persist entity links instead of leaving them aspirational.

### Layer 3 — Event and episode reasoning

Events remain the canonical occurrence unit. Episodes become the narrative-temporal unit analysts actually inspect.

### Layer 4 — Geotemporal context

Every event and episode must carry explicit geo quality, uncertainty, and a spatial representation that is analytically legible.

### Layer 5 — Vitality and signals

Signals stop being mostly "interesting charts" and become either risk signals, continuity signals, or supporting evidence.

### Layer 6 — Product surfaces

Home remains useful but stops being the whole product. Episodes, event detail, and place views become first-class.

---

## 7. Data Design Decisions

### Minimum new tables

- `claim`
- `claim_link` or `claim_contradiction`
- `episode`
- `episode_event`

### Minimum event extensions

- `geo_method`
- `uncertainty_radius_m`
- `geo_footprint_geojson` or a lightweight footprint field for episodes

### Minimum existing tables to start using properly

- `entity`
- `event_entity`
- `place`

### Provenance rule

Nothing can become analytically stronger than its lineage. Every claim, event update, and episode membership decision must point back to source items and timestamps.

---

## 8. UX Design Direction

### Home

Keep the hero map, but reduce its role from "entire product" to "entry surface". Add a clearly bounded `Episodes actifs` band and replace the current Lumière surface with `Vitalité & Reprise`.

### Event detail

The event page should become a real analytic object page:

- canonical description
- source observations
- extracted claims
- linked actors and places
- episode membership
- geo quality

### Episode detail

New core page:

- episode summary
- events timeline
- footprint map
- key claims
- contradictions
- linked places and actors

### Place view

New supporting page:

- recent events
- active episodes
- vitality indicators
- infrastructure dependencies

---

## 9. Delivery Strategy

### Recommended build sequence

1. **Clean misleading surfaces**
2. **Add ontology-backed schema changes**
3. **Persist claims and entities**
4. **Build episode engine and APIs**
5. **Add geo quality and episode footprints**
6. **Replace Lumière with Vitality**
7. **Upgrade UX around episodes, event detail, and places**

### Why this order

It moves from truthfulness to representation, then from representation to product value. That reduces the risk of building new UI on top of old analytic ambiguity.

---

## 10. Acceptance Criteria For V2

V2 is successful if all of the following are true:

- The system can distinguish a `document`, a `claim`, an `event`, and an `episode`.
- A new document can be attached to an existing event and episode with traceable reasoning.
- Event and episode pages show provenance and not just synthesized text.
- Geolocation quality is visible and uncertainty is represented explicitly.
- The old Lumière logic is gone or clearly replaced by a stronger continuity/vitality model.
- Misleading intelligence theater (`clusters`, pseudo-claims, faux-causal widgets) is reduced or renamed.

---

## 11. Key Risks

- **Concept drift:** trying to add too many ontology objects too early
- **LLM overreach:** using extraction prompts to hide weak data modeling
- **UI inertia:** preserving current layout at the expense of product truth
- **Geo overclaiming:** adding more map layers without better location quality
- **Episode complexity:** building clustering logic that is too clever to debug

---

## 12. Immediate Next Artifact

The next artifact should be a strict implementation plan for **Phase 0 through Phase 4 of V2**, with exact files, tests, and ordered tasks. It should assume:

- current repo structure stays in place
- no big monorepo migration
- no graph database yet
- analyst-first value beats surface complexity
