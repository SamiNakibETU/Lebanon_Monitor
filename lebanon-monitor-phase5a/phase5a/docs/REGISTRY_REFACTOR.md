# Registry Refactor Specification

## Current Problem
`registry.ts` mixes events and indicators in a single `fetchAll()`. Weather, LBP, and AQ
end up in the event panels where they don't belong (weather as "Lumière/Culture").

## New Architecture

### `fetchAll()` returns THREE things:

```typescript
interface FetchAllResult {
  events: LebanonEvent[];       // ONLY from event sources, classified, deduped
  indicators: Indicators;        // weather, LBP, AQ
  statuses: SourceStatus[];      // all source statuses
}
```

### Event sources (appear in panels):
`gdelt`, `usgs`, `firms`, `rss`, `gdacs`, `reliefweb`, `twitter`, `cloudflare`

### Indicator sources (appear in header only):
`weather`, `lbp-rate`, `openaq`

### Pipeline:

```
1. Fetch ALL sources in parallel (Promise.allSettled)
2. Separate:
   - Event sources → raw events
   - Indicator sources → indicator data
3. Classify all events using src/core/classification/classify()
4. Deduplicate events using src/core/deduplication/deduplicateEvents()
5. Sort by timestamp DESC
6. Return { events, indicators, statuses }
```

### Key Changes

1. **Import `classify` from `@/core/classification`** — NOT from the old `src/lib/classification/` or `src/lib/nlp/`. The old classifiers are DEPRECATED but don't delete them yet (UI might still reference them).

2. **Import `deduplicateEvents` from `@/core/deduplication`** — apply after classification.

3. **Build `indicators` object** from weather/lbp/openaq data:
```typescript
const indicators: Indicators = {};
// Weather: extract Beirut data
if (weatherEvents.length > 0) {
  const beirut = weatherEvents.find(e => e.title.toLowerCase().includes('beirut'));
  if (beirut) {
    indicators.weather = {
      city: 'Beyrouth',
      temp: parseFloat(beirut.title.match(/(\d+)°C/)?.[1] ?? '0'),
      condition: beirut.title.split(',').pop()?.trim() ?? '',
    };
  }
}
// LBP: extract rate
if (lbpEvents.length > 0) {
  const rate = parseFloat(lbpEvents[0].title.match(/[\d\s]+/)?.[0]?.replace(/\s/g, '') ?? '0');
  indicators.lbpRate = { rate };
}
// AQ: extract PM2.5
if (aqEvents.length > 0) {
  indicators.airQuality = {
    pm25: (aqEvents[0].rawData?.pm25 as number) ?? undefined,
    location: 'Lebanon',
  };
}
```

4. **Filter events**: Only events from `EVENT_SOURCES` go into the `events` array.

### New API Route: `/api/indicators/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { fetchAll } from '@/sources/registry';

export async function GET() {
  const { indicators, statuses } = await fetchAll();
  
  return NextResponse.json({
    indicators,
    statuses: statuses.filter(s => 
      ['weather', 'lbp-rate', 'openaq'].includes(s.source)
    ),
    updatedAt: new Date().toISOString(),
  }, {
    headers: { 'Cache-Control': 's-maxage=120, stale-while-revalidate=300' },
  });
}
```

### Updated `/api/events/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { fetchAll } from '@/sources/registry';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sourceFilter = searchParams.get('source');
  const classFilter = searchParams.get('classification');
  
  const { events, statuses } = await fetchAll();
  
  let filtered = events;
  if (sourceFilter && sourceFilter !== 'all') {
    filtered = filtered.filter(e => e.source === sourceFilter);
  }
  if (classFilter && classFilter !== 'all') {
    filtered = filtered.filter(e => e.classification === classFilter);
  }
  
  return NextResponse.json({
    events: filtered.map(e => ({
      ...e,
      timestamp: e.timestamp.toISOString(),
      metadata: { ...e.metadata, fetchedAt: e.metadata.fetchedAt.toISOString() },
    })),
    total: filtered.length,
    statuses,
  }, {
    headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' },
  });
}
```
