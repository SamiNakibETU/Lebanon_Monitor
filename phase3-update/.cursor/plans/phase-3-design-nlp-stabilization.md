# Phase 3 Plan — Design Overhaul + NLP + Stabilization + CCTV

## Objective
Transform Lebanon Monitor from a functional prototype into a polished, distinctive intelligence platform with three major upgrades: (A) Norgram-inspired split Lumière/Ombre design, (B) NLP/LLM-powered classification, (C) source stabilization + CCTV feeds.

---

## PART A — DESIGN OVERHAUL: NORGRAM SPLIT LAYOUT

### Design Philosophy
Reference: norgram.co — "essential design", barely-there UI, split composition.

The core interaction: the screen is split vertically into two halves.
- **Left = Lumière** (light background #f4f4f4, dark text)
- **Right = Ombre** (dark background #0a0a0a, light text)

When the cursor hovers over the LEFT side, that side EXPANDS (grows to ~65-70% width) with a smooth spring animation, and the right side compresses. Vice versa for the RIGHT side. When the cursor is in the center or absent, both halves are equal (50/50).

### Implementation

1. **Layout component** (`src/components/SplitLayout.tsx`):
   - Two `<div>` children: Lumière (left) and Ombre (right)
   - Use CSS `flex` with `transition: flex 0.6s cubic-bezier(0.16, 1, 0.3, 1)`
   - Three states: `idle` (50/50), `hover-left` (65/35), `hover-right` (35/65)
   - Track mouse X position relative to viewport center
   - On mobile: vertical split (top/bottom) or tab switch

2. **Left panel (Lumière)**:
   - Light bg (#f4f4f4), charcoal text (#0c0c0c)
   - Map (Leaflet) with CARTO Positron tiles (light theme)
   - Markers: green (#3d6b4a) for lumière events
   - Below map: live positive indicators (LBP stable, festivals, aid received)
   - Event list: positive events only, expandable cards
   - Chart: area chart showing lumière events over 7 days

3. **Right panel (Ombre)**:
   - Dark bg (#0a0a0a), off-white text (#e5e5e5)
   - Map clone OR shared map that tints based on hover side
   - Markers: muted rose (#7a5163) for ombre events
   - Below: live negative indicators (conflicts, outages, LBP drop)
   - Event list: negative events only
   - Chart: area chart showing ombre events over 7 days

4. **Shared header bar** (thin, fixed top):
   - Left: "Lebanon Monitor" in clean sans-serif (Inter or Geist)
   - Center: total events count, last update timestamp
   - Right: classification toggle (all / lumière / ombre), source filter

5. **Typography**:
   - Font: Inter (Google Fonts) or Geist (Vercel)
   - Sizes: 11px labels, 13px body, 16px headings, 48px hero numbers
   - Weight: 400 regular, 500 medium (numbers), 600 semi-bold (headings only)
   - Letter-spacing: 0.02em on uppercase labels
   - Monospace numbers: `font-variant-numeric: tabular-nums`

6. **Additional charts** (integrated into panels):
   - **Classification pie/donut** — shows lumière vs ombre vs neutre ratio
   - **Source reliability heatmap** — grid of sources × last 24h → status color
   - **Category treemap** — proportional boxes by event category
   - **Geospatial heatmap layer** — density of events on map
   - **Timeline sparklines** — mini inline charts next to each source name
   - **LBP/USD trend** — 7-day mini line chart in the header

7. **Animations**:
   - Panel expansion: `cubic-bezier(0.16, 1, 0.3, 1)` (spring-like)
   - Event cards: fade-in with slight translateY on appear
   - Numbers: count-up animation on load
   - Map markers: pulse animation on new events
   - All transitions < 600ms, no animation on reduced-motion

---

## PART B — NLP / LLM CLASSIFICATION UPGRADE

### Current State
Classification is keyword-based only (dictionaries FR/EN/AR + GDELT tone). This works for ~70% of cases but misses nuance, context, and mixed-language Lebanese content.

### Upgrade Strategy

**Layer 1: Hugging Face Inference API (free tier)**

Use the HF Serverless Inference API to run sentiment analysis on article titles/descriptions. This runs server-side in Next.js API routes.

Models to use:
- **Arabic**: `CAMeL-Lab/bert-base-arabic-camelbert-msa-sentiment` — trained on MSA, returns positive/negative/neutral with confidence score. Free via HF Inference API.
- **French**: `nlptown/bert-base-multilingual-uncased-sentiment` — multilingual including French, returns 1-5 star rating. Free via HF Inference API.
- **English**: `distilbert-base-uncased-finetuned-sst-2-english` — fast, accurate, default on HF. Free.

Implementation:
```typescript
// src/lib/nlp/huggingface.ts
const HF_API_URL = 'https://api-inference.huggingface.co/models/';

export async function classifyWithHF(text: string, lang: 'ar' | 'fr' | 'en'): Promise<{
  label: 'positive' | 'negative' | 'neutral';
  score: number;
}> {
  const model = {
    ar: 'CAMeL-Lab/bert-base-arabic-camelbert-msa-sentiment',
    fr: 'nlptown/bert-base-multilingual-uncased-sentiment',
    en: 'distilbert-base-uncased-finetuned-sst-2-english',
  }[lang];
  
  const response = await fetch(`${HF_API_URL}${model}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.HF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: text }),
  });
  // ... parse response, map to lumiere/ombre/neutre
}
```

**Rate limits**: Free tier = ~30k chars/month. Batch requests (send multiple texts in one call). Cache results aggressively (same article = same classification).

**Language detection**: Use a simple heuristic first (Arabic Unicode range → ar, French accents/words → fr, else en). For production: `franc` npm package.

**Layer 2: GPT-4o-mini via Anthropic/OpenAI for enrichment (optional)**

For high-value events (>5 GDELT mentions, or breaking news), call Claude or GPT-4o-mini to:
- Generate a 2-sentence summary
- Extract named entities (people, organizations, locations)
- Classify into fine-grained category
- Assess severity and geopolitical significance

This is OPTIONAL and behind a feature flag. Cost: ~$0.15/1M input tokens.

**Layer 3: Client-side embeddings (like World Monitor)**

Use Transformers.js with `all-MiniLM-L6-v2` to:
- Embed headlines in the browser
- Enable semantic search ("find events about electricity")
- Cluster similar events for deduplication
- Store in IndexedDB (capped at 5000 vectors)

This is a Phase 4 feature but plant the architecture now.

### NLP Module Structure
```
src/lib/nlp/
├── index.ts
├── language-detect.ts    # detect ar/fr/en from text
├── huggingface.ts        # HF Inference API client
├── classifier-enhanced.ts # combines keywords + HF + tone
├── entity-extract.ts     # extract persons, orgs, locations from text
├── geocoder.ts           # map location names → lat/lng
└── cache.ts              # in-memory LRU cache for NLP results
```

### Updated Classification Pipeline
```
Text in → Language detect → Keyword classifier (fast, sync)
                          → HF Sentiment API (async, cached)
                          → GDELT tone (if available)
                          ↓
                     Ensemble: weighted average of all signals
                          ↓
                  { classification, confidence, category }
```

Weights: keywords 0.3, HF sentiment 0.5, GDELT tone 0.2.
If HF API unavailable: fallback to keywords + tone only.

---

## PART C — SOURCE STABILIZATION

### Known Issues (from project summary)

| Source | Issue | Fix |
|--------|-------|-----|
| GDELT | 429 rate limit | Add 5s minimum interval between calls, cache 15min |
| ReliefWeb | 403 appname | Register proper appname or use without, try empty appname |
| RSS L'Orient-Le Jour | 403 | Add User-Agent header mimicking browser |
| RSS MTV Lebanon | 404 | Check URL, use sitemap to find correct RSS |
| OpenAQ | v3 migration | Already done, verify API key works |
| GDACS | 204 No Content | Normal when no disasters — handle gracefully, show "Aucune alerte" |
| Recharts | width -1 | Set min-height: 200px on chart containers |

### Specific Fixes

1. **GDELT**: Implement request queue with 5s spacing. If 429, backoff 30s. Cache response for 15 min. Show "cached" badge in UI when serving stale data.

2. **ReliefWeb**: Change appname to just `lebanon-monitor`. If still 403, try request without appname param. Test: `https://api.reliefweb.int/v1/reports?filter[field]=country&filter[value]=Lebanon&limit=5`

3. **RSS**: Add headers: `User-Agent: Mozilla/5.0 (compatible; LebanonMonitor/1.0)`. For L'Orient-Le Jour: try `https://www.lorientlejour.com/feed` instead of `/rss`. For MTV: try `https://www.mtv.com.lb/Feed/RSS`.

4. **Recharts**: Wrap every `ResponsiveContainer` in a div with `style={{ minHeight: 200, minWidth: 200 }}`.

5. **Error resilience**: Every source should have a `status` field in the API response. UI shows green/yellow/red dots. Yellow = cached/stale. Red = error. Never crash the whole dashboard because one source fails.

---

## PART D — CCTV / LIVE FEEDS

### Available Live Feeds for Lebanon

| Source | URL | Type | Notes |
|--------|-----|------|-------|
| SkylineWebcams Beirut | `skylinewebcams.com/en/webcam/lebanon/beirut/beirut/beirut.html` | Embed iframe | 1080p, panoramic |
| IPLiveCams Beirut | `iplivecams.com/live-cams/beirut-lebanon/` | Embed | Skyline view |
| GeoCam Beirut | `geocam.ru/en/in/beirut/` | Directory | Multiple cameras |
| Insecam Lebanon | `insecam.org/en/bycountry/LB/` | Directory | Public unsecured cameras |

### Implementation

1. **Live feeds panel**: New component `LiveFeedPanel` with:
   - Embeddable iframe for SkylineWebcams (they allow embedding)
   - Thumbnail grid of available camera feeds
   - Click to expand to full-width view

2. **YouTube Live News**: Embed live streams from Lebanese channels:
   - LBCI: search YouTube API for "LBCI live" → embed
   - Al Jadeed: "Al Jadeed live Lebanon"
   - MTV Lebanon: "MTV Lebanon live"
   
   YouTube embed: `<iframe src="https://www.youtube.com/embed/live_stream?channel=CHANNEL_ID" />`

3. **Integration in layout**: Live feeds go in the **center divider** between Lumière and Ombre panels — when hovered, a thin vertical strip expands to show the live feed. This creates a "window between worlds" metaphor.

---

## PART E — ADDITIONAL FEATURES

### 1. Event Deduplication
- Hash events by: normalized title (lowercase, strip punctuation) + date
- Use Jaccard similarity on titles > 0.6 → merge
- Keep the event with highest source reliability

### 2. Geospatial Enrichment
- Extract Lebanese city/region names from text using regex + gazetteer
- Map to coordinates from `src/config/lebanon.ts` city list
- For GDELT events without coords: geocode from article text

### 3. Push Notifications (future)
- When severity=critical event appears → browser notification
- When 3+ events cluster in same location in 1 hour → anomaly alert

---

## Implementation Order

1. **Design overhaul** — SplitLayout, Lumière/Ombre panels, typography, animations
2. **Source stabilization** — Fix GDELT, ReliefWeb, RSS, Recharts
3. **NLP module** — Language detect, HF API client, enhanced classifier
4. **Additional charts** — Integrate into both panels
5. **CCTV/Live feeds** — SkylineWebcams embed, YouTube live
6. **Deduplication** — Event merging logic
7. **Polish** — Loading states, error states, empty states, mobile responsive

---

## Environment Variables Needed

```
# Add to .env.local
HF_API_TOKEN=        # Hugging Face (free: https://huggingface.co/settings/tokens)
# Optional:
OPENAI_API_KEY=      # For GPT-4o-mini enrichment (Phase 4)
ANTHROPIC_API_KEY=   # For Claude enrichment (Phase 4)
```
