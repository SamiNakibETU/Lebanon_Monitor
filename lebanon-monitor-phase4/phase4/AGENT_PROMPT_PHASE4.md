# Phase 4 Agent Prompt — Lebanon Monitor

Copy the prompt below and paste it into Cursor Agent.

---

## PROMPT:

```
Read ALL of the following files carefully before writing any code:
- .cursor/plans/phase-4-critical-fixes.md (the complete plan with 7 stages)
- docs/CLASSIFICATION_FIX.md (complete keyword dictionaries and classification pipeline fix)
- .cursor/rules/design-system.mdc (visual design rules — already in project)
- SKILL.md (project domain knowledge — already in project)

This is Phase 4 of Lebanon Monitor. The dashboard is functional but has CRITICAL bugs. Execute the 7 stages in order.

---

### STAGE 1 — FIX CLASSIFICATION (THIS IS THE #1 PRIORITY)

The classification is BROKEN. Bombing news appears as "Lumière / Culture". Fix this:

1. Open `src/lib/classification/keywords.ts`. Replace the keyword dictionaries with the COMPLETE dictionaries from `docs/CLASSIFICATION_FIX.md`. The Arabic keywords are especially important — add ALL of them. Every single one.

2. Open the classifier file (either `src/lib/classification/classifier.ts` or `src/lib/nlp/classifier-enhanced.ts`). Add a `preClassify()` function that checks for hard ombre/lumière keywords BEFORE the ensemble. If ANY hard ombre keyword is found in the text, return ombre immediately with confidence 0.95 and category 'armed_conflict'. See docs/CLASSIFICATION_FIX.md for the implementation.

3. Fix the DEFAULT CATEGORY. Find where the default category is set to 'cultural_event' or 'culture' and change it:
   - If ombre → default category = 'political_tension'  
   - If lumiere → default category = 'institutional_progress'
   - If neutre → default category stays neutre

4. REMOVE weather events from the main event feed. In `src/sources/registry.ts` or in `fetchAll()`, filter out events where `source === 'weather'` from the events array. Weather data should ONLY appear in the header indicators (SharedHeader), not as events in the panels.

5. Same for `lbp-rate` and `openaq` — remove from event panels, keep in header only.

After this stage, run `npm run dev` and check `/api/events`. Verify:
- No military/bombing events have classification 'lumiere'
- No weather events in the response
- Category is never 'cultural_event' for conflict news

---

### STAGE 2 — DEDUPLICATION

Many identical tweets appear multiple times. Fix this:

1. In `src/sources/registry.ts`, add a `deduplicateEvents()` function after `fetchAll()`.

2. Dedup logic:
   - Normalize title: lowercase, remove punctuation (keep Arabic chars \u0600-\u06FF), trim, take first 80 chars
   - Create key: `${normalizedTitle}-${dateYYYYMMDD}`
   - If two events have same key, keep the one with higher source priority (RSS > GDELT > Twitter)
   - Also: if Jaccard similarity between two titles on the same day > 0.6, merge them

3. Apply dedup BEFORE returning from `fetchAll()`.

4. Expected result: event count drops from ~104 to ~40-60 unique events.

---

### STAGE 3 — REBUILD CHARTS

The analytics section is invisible/broken. Build real charts:

1. Create `src/components/charts/SummaryStats.tsx`:
   - 4 stat cards in a row: Total events | Sources active | Avg confidence | Top category
   - Large number (text-3xl, tabular-nums), small label below (text-xs, uppercase, muted)
   - Accept `theme: 'light' | 'dark'` prop for styling

2. Create `src/components/charts/TimelineChart.tsx`:
   - Recharts AreaChart showing events over last 7 days (group by 6-hour bins)
   - No gridlines, no Y axis, minimal X axis (date labels only)
   - Fill: panel accent color at 0.15 opacity
   - Stroke: 1.5px panel accent
   - Container: `<div style={{ minHeight: 180, minWidth: 200 }}>`

3. Create `src/components/charts/CategoryBars.tsx`:
   - Horizontal bar chart of top 5 categories for this panel
   - Simple bars with accent color, label left, count right
   - No axis lines

4. Create `src/components/charts/SourceBreakdown.tsx`:
   - Mini horizontal bars showing event count per source
   - Only show sources that contributed events to this panel

5. Integrate into `LumierePanel.tsx` and `OmbrePanel.tsx`:
   - After the map, before the event list
   - Layout: SummaryStats (1 row) → TimelineChart + CategoryBars (side by side) → SourceBreakdown
   - Each chart section has a subtle divider line (1px border, opacity 0.06)

CRITICAL: Every Recharts chart must be inside a container with explicit `minHeight` in pixels. NEVER use `height="100%"` on ResponsiveContainer.

---

### STAGE 4 — FIX CCTV/LIVE SECTION

The iframe is blocked by SkylineWebcams. Replace with working approach:

1. Replace `LiveFeedStrip.tsx` with `LiveFeedPanel.tsx`:
   - Show at the TOP of the Ombre panel (before the map)
   - Small section (100px height) with a preview thumbnail and "LIVE" badge
   - Click opens SkylineWebcams in a new tab
   - Also try YouTube live embed for LBCI: `https://www.youtube.com/embed/live_stream?channel=UCbkECzOnnSjHEkMBiOGfGBw`
   - If YouTube embed works, show it inline (200px height, 100% width)
   - If not, show thumbnail + "Watch Live" link

2. Remove the center strip concept from `SplitLayout.tsx` (the `center` prop). It's confusing UX.

3. Delete `LiveFeedStrip.tsx`.

---

### STAGE 5 — POLISH EVENT CARDS

Improve the event list readability:

1. Update `EventList.tsx` (or create new `EventCard.tsx`):
   - Left: small colored dot (6px, rounded-full) — green for lumière, rose for ombre, gray for neutre
   - Line 1: Source badge (tiny text, muted) + category + relative time ("2h ago" / "il y a 2h")
   - Line 2-3: Title, max 2 lines, text-overflow ellipsis
   - On hover: subtle bg shift (light panel: bg-gray-100, dark panel: bg-white/5)
   - On click: expand to show description + URL link + confidence score badge
   - Transition: height animation 200ms ease

2. Add relative time formatter:
```typescript
function relativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}j`;
}
```

---

### STAGE 6 — HEADER IMPROVEMENTS

1. In `SharedHeader.tsx`:
   - Show weather for Beirut only (not all cities) — fetch from the weather source
   - LBP rate with trend arrow: ▲ (rising = bad, ombre color) or ▼ (falling = good, lumiere color)
   - Source status dots: 11 small dots, colored green/yellow/red based on source status
   - Remove raw source filter if cluttered — replace with a cleaner dropdown

---

### STAGE 7 — FINAL VERIFICATION

1. `npm run clean` (delete .next cache)
2. `npm run build` — must succeed with zero errors
3. `npm run dev` — verify:
   - Lumière panel contains ONLY positive events (no bombing, no military)
   - Ombre panel contains ONLY negative events
   - No weather events in either panel
   - Charts render correctly with data
   - No duplicate events
   - CCTV section shows something (YouTube or thumbnail)
   - Event cards are readable with proper hierarchy
4. Report:
   - Total events after dedup
   - Classification distribution: N lumière / N ombre / N neutre
   - Sample: 3 lumière events and 3 ombre events with their titles
   - Any remaining issues

---

IMPORTANT CONSTRAINTS:
- Fix classification FIRST before anything else — it's the foundation
- TypeScript strict mode, no @ts-ignore
- Follow design-system.mdc rules (no shadows, minimal borders, Inter font)
- Every chart container: minHeight in pixels, never height="100%"
- After every stage, verify the app renders without crashing
- If something fails, continue to the next stage and note the issue

Start with Stage 1 NOW.
```
