# Phase 3 Agent Prompt — Lebanon Monitor

Paste this into Cursor Agent (Composer) to execute Phase 3.

---

## PROMPT:

```
Read ALL of the following files before doing anything:
- .cursor/plans/phase-3-design-nlp-stabilization.md (the complete plan)
- .cursor/rules/design-system.mdc (visual design rules)
- .cursor/rules/nlp-classification.mdc (NLP/LLM rules)
- docs/SOURCE_STABILIZATION.md (fixes for broken sources)
- SKILL.md (project domain knowledge)

You are upgrading Lebanon Monitor from a functional prototype to a polished intelligence platform. Execute the plan in 7 stages:

---

### STAGE 1: Source Stabilization (do this FIRST)

Fix every broken data source following docs/SOURCE_STABILIZATION.md exactly:

1. **GDELT**: Add 6-second minimum interval between requests. Add in-memory cache with 15min TTL. Handle non-JSON responses. Handle 429 with 30s backoff.

2. **ReliefWeb**: Try removing the appname param. Test. If still 403, add a User-Agent header. Test.

3. **RSS**: Fix L'Orient-Le Jour (try /feed URL). Fix MTV Lebanon (try /Feed/RSS). Add User-Agent headers to all RSS fetches.

4. **Recharts**: Find every ResponsiveContainer and ensure its parent has `style={{ minHeight: 200 }}`.

5. **GDACS**: Ensure 204 responses return empty array, not error.

After fixes, run the app (`npm run dev`), hit `/api/health`, and verify which sources now return `ok`. Report the results.

---

### STAGE 2: Design Overhaul — Split Layout

Following .cursor/rules/design-system.mdc, completely rebuild the main page layout:

1. Create `src/components/SplitLayout.tsx`:
   - Flexbox container, full viewport height
   - Left child (Lumière): light bg #f4f4f4
   - Right child (Ombre): dark bg #0a0a0a
   - Mouse tracking: onMouseMove on container
   - If mouse in left 40% → left flex grows to 1.8, right to 1
   - If mouse in right 40% → right flex grows to 1.8, left to 1
   - If center 20% → both flex 1
   - Transition: `transition: flex 0.6s cubic-bezier(0.16, 1, 0.3, 1)`

2. Create `src/components/LumierePanel.tsx`:
   - Light theme components
   - Map with CARTO Positron tiles, green markers for lumière events
   - Positive event list (classification === 'lumiere' only)
   - Mini area chart: lumière events over 7 days
   - Stats: count of positive events, top positive category

3. Create `src/components/OmbrePanel.tsx`:
   - Dark theme components
   - Map with CARTO Dark Matter tiles, rose markers for ombre events
   - Negative event list (classification === 'ombre' only)
   - Mini area chart: ombre events over 7 days
   - Stats: count of negative events, top negative category

4. Create `src/components/SharedHeader.tsx`:
   - Fixed top bar, 48px, translucent
   - Left: "Lebanon Monitor" in Inter font
   - Center: total events, last update
   - Right: source filter dropdown

5. Update `src/app/page.tsx`:
   - Replace current layout with SplitLayout > [LumierePanel, OmbrePanel]
   - SharedHeader above
   - SWR data fetching stays the same

6. Update `src/app/globals.css`:
   - Add all color tokens from design-system.mdc
   - Import Inter font
   - Add animation keyframes
   - Custom scrollbar styles (thin, subtle)

Use the @design-architect subagent for component design decisions.

---

### STAGE 3: More Charts & Visualizations

Add to both panels:

1. **Classification donut** (Recharts PieChart): lumière vs ombre vs neutre ratio
2. **Source reliability grid**: small grid showing each source status (green/yellow/red dots)
3. **Category breakdown bars**: horizontal bars for top 5 categories per panel
4. **LBP/USD mini trend**: tiny sparkline in the header showing 7-day rate trend (fetch from lbp-rate source history)
5. **Event density heatmap** on map: use Leaflet.heat plugin for geographic clustering
6. **Timeline**: horizontal timeline at the bottom showing events chronologically

Ensure every chart has `min-height: 200px` on its container. Use Recharts with minimal styling (no grid, area fill at 0.15 opacity, thin strokes).

---

### STAGE 4: NLP Module

Following .cursor/rules/nlp-classification.mdc:

1. Create `src/lib/nlp/language-detect.ts` — Arabic/French/English detection
2. Create `src/lib/nlp/huggingface.ts` — HF Inference API client:
   - Arabic model: CAMeL-Lab/bert-base-arabic-camelbert-msa-sentiment
   - French model: nlptown/bert-base-multilingual-uncased-sentiment
   - English model: distilbert-base-uncased-finetuned-sst-2-english
   - Batching, caching (LRU 1000 entries), 5s timeout
3. Create `src/lib/nlp/classifier-enhanced.ts` — ensemble: keywords 0.3 + HF 0.5 + tone 0.2
4. Create `src/lib/nlp/entity-extract.ts` — regex for Lebanese names, parties, cities
5. Create `src/lib/nlp/cache.ts` — in-memory LRU

Update the `/api/events` route: after fetching all sources, run enhanced classification on titles. If HF_API_TOKEN not set, fall back to keyword-only (current behavior).

Add `HF_API_TOKEN` to `.env.example`.

Use the @nlp-engineer subagent for NLP implementation.

---

### STAGE 5: CCTV / Live Feeds Panel

1. Create `src/components/LiveFeedStrip.tsx`:
   - Vertical strip in the CENTER between the two panels
   - Default: thin (40px wide), shows a camera icon
   - On hover: expands to 300px, shows:
     - SkylineWebcams Beirut iframe embed
     - Link to open in new tab
   - Transition: same spring curve as panels

2. Optionally: YouTube live embed for LBCI or Al Jadeed channel

---

### STAGE 6: Cleanup & Polish

Use the @cleanup subagent:

1. Delete any old layout components that are replaced (old DashboardSidebar if no longer used)
2. Remove unused imports
3. Fix all TypeScript errors
4. Run `npx tsc --noEmit` — must pass
5. Run `npx eslint . --fix`
6. Verify mobile layout (tabs instead of split)
7. Add loading skeletons (pulsing rectangles) while data loads
8. Add empty states: "No lumière events in the last 24h" etc.

---

### STAGE 7: Final Verification

1. Run `npm run build` — must succeed
2. Run `npm run dev` — verify all panels render
3. Test hover interaction: left expand, right expand, center balanced
4. Check both maps render correctly with different tile providers
5. Check charts render without errors
6. Check NLP classification on sample events
7. Report final source health check table

---

Important constraints:
- Follow the design-system.mdc rules strictly — no shadows, no rounded corners > 4px
- Inter font from Google Fonts or next/font
- All animations: cubic-bezier(0.16, 1, 0.3, 1)
- Never break existing API routes
- Preserve existing data fetching logic, just improve classification
- If a stage fails, continue to the next and report the issue
- TypeScript strict mode, no @ts-ignore

Start with Stage 1 (stabilization) and work through sequentially.
```
