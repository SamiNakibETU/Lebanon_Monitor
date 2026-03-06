# Phase 4 — Critical Fixes + Analytics + Polish

## Current State (from screenshots)
- Split layout works (light left, dark right, hover expansion)
- 104 events ingested, LBP 89 700 displayed
- BUT: Classification is BROKEN — bombing/military news appears in Lumière panel as "Culture"
- BUT: No visible charts/analytics anywhere
- BUT: CCTV strip doesn't render (iframe blocked)
- BUT: Massive duplicate tweets in both panels
- BUT: Event lists are raw text walls with no visual hierarchy

## Priority Order (highest impact first)

---

## STAGE 1 — FIX CLASSIFICATION (CRITICAL)

The classification system is fundamentally broken. Israeli airstrikes, Hezbollah military activity, and bombing news are appearing as "Lumière / Culture". This destroys the entire concept.

### Root Cause Analysis
The keyword classifier and/or HF ensemble is producing wrong results. Most likely:
1. The keyword dictionaries have gaps — military/conflict terms in Arabic/French are missing
2. The category assignment defaults to "Culture" when no category matches
3. The HF model (cardiffnlp/twitter-xlm-roberta-base-sentiment) may misclassify Arabic conflict reporting as neutral/positive

### Fix 1: Expand Ombre keyword dictionaries

In `src/lib/classification/keywords.ts`, ensure these terms FORCE ombre classification:

**Arabic ombre keywords (MUST ADD)**:
```
قصف، غارة، صاروخ، اشتباك، انفجار، شهيد، قتيل، جريح، نزوح، 
دمار، حرب، عدوان، اجتياح، قنبلة، بارود، مدفعية، طائرة حربية،
استهداف، تفجير، إرهاب، ميليشيا، حزب الله، مقاومة، عملية عسكرية،
تهجير، لاجئ، حصار، أزمة، انهيار، فساد، سرقة، احتجاج، مظاهرة
```

**French ombre keywords (MUST ADD)**:
```
bombardement, frappe, missile, roquette, attentat, explosion, 
victime, blessé, tué, mort, déplacé, réfugié, conflit, guerre, 
agression, invasion, militaire, armée, soldat, tir, obus, artillerie,
Hezbollah, milice, opération militaire, raid aérien, dégâts,
crise, effondrement, corruption, manifestation, émeute, pénurie,
israélien, aérien, banlieue sud, infrastructure
```

**English ombre keywords (MUST ADD)**:
```
airstrike, bombing, missile, rocket, shelling, explosion, 
casualty, killed, wounded, displaced, refugee, conflict, war,
military, army, soldier, attack, raid, offensive, invasion,
Hezbollah, militia, IDF, Israeli, strike, target, destruction,
crisis, collapse, corruption, protest, riot, shortage, evacuation
```

### Fix 2: Category assignment logic

The default category MUST NOT be "Culture". Change the default:
```typescript
// In classifier.ts or classifier-enhanced.ts
// WRONG:
const defaultCategory = 'cultural_event';
// CORRECT:
const defaultCategory = 'neutre'; // or determine from classification
```

Category assignment rules:
- If classification === 'ombre' AND no specific category matched → `political_tension` (safe default for Lebanese context)
- If classification === 'lumiere' AND no specific category matched → `institutional_progress`
- If classification === 'neutre' → leave category as `neutre`

### Fix 3: Hard override for obvious cases

Add a pre-classifier that catches obvious cases BEFORE the ensemble:
```typescript
function preClassify(text: string): Classification | null {
  const lowerText = text.toLowerCase();
  
  // Obvious ombre — military action keywords in any language
  const hardOmbre = [
    'airstrike', 'bombing', 'missile', 'attack', 'killed',
    'frappe', 'bombardement', 'missile', 'tué', 'victime',
    'قصف', 'غارة', 'صاروخ', 'شهيد', 'قتيل', 'انفجار',
    'hezbollah military', 'israeli strike', 'evacuation',
  ];
  
  if (hardOmbre.some(kw => lowerText.includes(kw))) {
    return { classification: 'ombre', confidence: 0.95, category: 'armed_conflict' };
  }
  
  // Obvious lumière
  const hardLumiere = [
    'inauguration', 'festival', 'award', 'reconstruction', 'donation',
    'inauguration', 'festival', 'prix', 'reconstruction', 'don',
    'افتتاح', 'مهرجان', 'جائزة', 'إعمار', 'تبرع',
  ];
  
  if (hardLumiere.some(kw => lowerText.includes(kw))) {
    return { classification: 'lumiere', confidence: 0.9, category: 'cultural_event' };
  }
  
  return null; // proceed to ensemble
}
```

### Fix 4: Weather events

Weather events (source === 'weather') should NEVER be classified as "Lumière / Culture".
- Clear/sunny weather → `neutre` with category `environmental_positive` or just skip display
- Extreme weather (>40°C, storm, flood) → `ombre` with category `environmental_negative`
- Normal weather → either `neutre` or don't show in the event list at all (show only in the header indicators)

**Decision**: Remove weather from the main event feed. Show weather ONLY in the header/indicators area, not as events in the Lumière/Ombre panels. Weather is context, not an event.

---

## STAGE 2 — DEDUPLICATION

### Problem
Multiple tweets from different Nitter handles report the same news. The same tweet text appears 3-5 times in the list.

### Fix
In `src/sources/registry.ts`, after `fetchAll()`, add a deduplication step:

```typescript
function deduplicateEvents(events: LebanonEvent[]): LebanonEvent[] {
  const seen = new Map<string, LebanonEvent>();
  
  for (const event of events) {
    // Create a dedup key from normalized title + date
    const normalizedTitle = event.title
      .toLowerCase()
      .replace(/[^\w\s\u0600-\u06FF]/g, '') // keep alphanumeric + Arabic
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 80); // first 80 chars
    
    const dateKey = new Date(event.timestamp).toISOString().split('T')[0]; // YYYY-MM-DD
    const dedupKey = `${normalizedTitle}-${dateKey}`;
    
    const existing = seen.get(dedupKey);
    if (!existing || getSourcePriority(event.source) > getSourcePriority(existing.source)) {
      seen.set(dedupKey, event); // keep higher priority source
    }
  }
  
  return Array.from(seen.values());
}

// Source priority: higher = more trusted
function getSourcePriority(source: SourceName): number {
  const priorities: Record<SourceName, number> = {
    rss: 10, reliefweb: 9, gdelt: 8, usgs: 10, firms: 10,
    gdacs: 10, weather: 5, cloudflare: 9, twitter: 3, 
    'lbp-rate': 7, openaq: 7,
  };
  return priorities[source] ?? 5;
}
```

Also add Jaccard similarity for near-duplicates:
```typescript
function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\s+/));
  const setB = new Set(b.toLowerCase().split(/\s+/));
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

// In dedup loop: if jaccardSimilarity > 0.6 between two titles on same day → merge
```

---

## STAGE 3 — ANALYTICS SECTION (CHARTS)

The charts are either invisible or too small. Rebuild the entire analytics layer.

### Architecture
Each panel (Lumière and Ombre) gets a collapsible analytics section between the map and the event list. The analytics section contains 3 rows of charts.

### Charts to build/rebuild

**Row 1 — Summary stats (4 cards per panel)**:
```
| Total events | Sources active | Avg confidence | Top category |
```
Each card: large number (48px, tabular-nums), small label below (11px, uppercase, muted).

**Row 2 — Primary charts (2 per panel)**:
- Left chart: **Area chart** — events over time (last 7 days, grouped by 6h bins)
  - X axis: date labels only (no gridlines)
  - Y axis: hidden
  - Fill: lumière accent at 0.15 opacity (or ombre accent)
  - Stroke: 1.5px, accent color
  
- Right chart: **Horizontal bar chart** — top 5 categories
  - Bars: accent color at 0.8 opacity
  - Labels: category name left, count right
  - No axis lines

**Row 3 — Secondary charts**:
- Left: **Source breakdown** — tiny horizontal bars showing event count per source
- Right: **Classification confidence** — histogram of confidence scores (0-1)

### Implementation
- Each chart in its own component in `src/components/charts/`
- Every chart wrapped in `<div style={{ minHeight: 160 }}>` 
- Use Recharts with ZERO gridlines, ZERO axis lines (only tick labels)
- Colors: use panel accent (green for Lumière, rose for Ombre)
- Responsive: on mobile, charts stack vertically

---

## STAGE 4 — CCTV FIX

### Problem
SkylineWebcams blocks iframe embedding (X-Frame-Options).

### Solution
Replace the iframe approach with a **thumbnail + link** pattern:

1. Fetch a preview image from SkylineWebcams (or use a static preview image)
2. Show the preview image with a "LIVE" badge and camera icon
3. Click opens the webcam in a new tab
4. Also add YouTube live stream embeds (these actually work in iframes)

### Implementation
```typescript
// src/components/LiveFeedPanel.tsx (replaces LiveFeedStrip)
const FEEDS = [
  {
    name: 'Beirut Panorama',
    type: 'webcam',
    previewUrl: '/images/beirut-skyline-preview.jpg', // static fallback
    liveUrl: 'https://www.skylinewebcams.com/en/webcam/lebanon/beirut/beirut/beirut.html',
  },
  {
    name: 'LBCI Live',
    type: 'youtube',
    channelId: 'UCbkECzOnnSjHEkMBiOGfGBw', // LBCI
    embedUrl: 'https://www.youtube.com/embed/live_stream?channel=UCbkECzOnnSjHEkMBiOGfGBw',
  },
];
```

### Placement
Don't use the center strip (confusing UX). Instead:
- Add a small "LIVE" section at the top of the Ombre panel (above the map)
- Show 1-2 thumbnails with "LIVE" badges
- Click to expand inline (YouTube) or open new tab (webcam)

---

## STAGE 5 — EVENT LIST POLISH

### Current problem
Events are raw text walls. Need visual hierarchy.

### Fix event cards

```
┌─────────────────────────────────────────┐
│ ● RSS  Tension politique  14:35         │  ← dot (source color) + source + category + time
│ Cabinet Orders Immediate Ban on         │  ← title, max 2 lines, truncate
│ Hezbollah Military Activity...          │
│ ▸ Détails                               │  ← expand toggle
└─────────────────────────────────────────┘
```

Each event card:
- Left: colored dot (green for lumière, rose for ombre, gray for neutre)
- Top line: source badge (small, muted) + category + relative time ("il y a 2h")
- Title: max 2 lines with text-overflow ellipsis
- On expand: full description + source URL link + confidence score
- Hover: subtle background shift (light panel: bg goes slightly darker, dark panel: bg goes slightly lighter)

### Sort
Events sorted by timestamp DESC (newest first). Group by date if spanning multiple days.

---

## STAGE 6 — HEADER IMPROVEMENTS

### Current header is functional but needs data

Fix the header to show real-time indicators:

```
Lebanon Monitor  [●●●●●●●●●●]  LBP 89,700 ▼  Beirut 13°C  AQ --  104 ÉVÉNEMENTS  22:31  [Toutes sources ▾]
```

- Source status dots: green/yellow/red for each source
- LBP rate with arrow (▲ up = bad/ombre, ▼ down = good/lumière, ─ stable)
- Weather for Beirut (single city, not all 4)
- Air quality indicator (if available)
- Event count
- Last update time
- Source filter dropdown

### LBP trend arrow
Compare current rate to rate 24h ago (store in a simple JSON file or in-memory).
If rate increased > 1%: show ▲ in ombre color
If rate decreased > 1%: show ▼ in lumière color
If stable: show ─ in neutral

---

## STAGE 7 — FINAL CLEANUP

1. Remove weather events from the main event panels (show only in header)
2. Remove `LiveFeedStrip.tsx` (replaced by `LiveFeedPanel.tsx`)
3. Remove any dead components from Phase 2 that are no longer used
4. Fix mobile layout: ensure tabs work, charts are readable on small screens
5. Run `npm run clean && npm run build` — must succeed
6. Test: verify Lumière panel shows ONLY positive events, Ombre shows ONLY negative
7. Test: verify no bombing/military news appears in Lumière panel
8. Report final health check + classification accuracy audit

---

## Success Criteria
- [ ] Zero military/conflict events in Lumière panel
- [ ] Zero festival/positive events in Ombre panel
- [ ] Charts visible and readable in both panels
- [ ] No duplicate events in either panel
- [ ] CCTV/live section functional (YouTube embed or thumbnail+link)
- [ ] Build succeeds (`npm run build`)
- [ ] < 50 events after deduplication (down from 104)
- [ ] Classification confidence > 0.7 on average
