# Source Stabilization Guide

## GDELT — 429 Rate Limit

**Root cause**: Calling too frequently. GDELT has an undocumented rate limit of ~1 request per 5 seconds.

**Fix**:
```typescript
// src/sources/gdelt/config.ts
export const GDELT_CONFIG = {
  minIntervalMs: 6000,  // 6 seconds between calls
  cacheTtlMs: 15 * 60 * 1000,  // 15 min cache
  backoffMs: 30000,  // 30s backoff on 429
  maxRetries: 1,
};
```
- Add a request timestamp tracker. Before fetching, check if `Date.now() - lastFetch < minIntervalMs`.
- On 429: set a cooldown flag, return cached data, try again after backoffMs.
- In the normalizer: handle non-JSON responses gracefully (GDELT sometimes returns HTML errors).

## ReliefWeb — 403 Forbidden

**Fix options** (try in order):
1. Remove `appname` param entirely: `https://api.reliefweb.int/v1/reports?filter[field]=country&filter[value]=Lebanon&limit=10&sort[]=date:desc`
2. Set `appname=rwint-user-0` (generic)
3. Add User-Agent header: `User-Agent: LebanonMonitor/1.0 (academic research project; contact@example.com)`

## RSS L'Orient-Le Jour — 403

**Fix**:
- Try alternate URL: `https://www.lorientlejour.com/feed`
- Add headers: `User-Agent: Mozilla/5.0 (compatible; LebanonMonitor/1.0; +https://github.com/youruser/lebanon-monitor)`
- If still blocked: use GDELT as proxy (GDELT already indexes L'Orient-Le Jour articles)

## RSS MTV Lebanon — 404

**Fix**:
- Try: `https://www.mtv.com.lb/Feed/RSS` or `https://www.mtv.com.lb/rss/feed`
- If no working RSS: scrape the homepage headlines with Cheerio
- Fallback: remove MTV from RSS sources, rely on GDELT/Twitter for MTV content

## Recharts width/height -1

**Fix**: Every chart container must have explicit min dimensions:
```tsx
<div style={{ minHeight: 200, minWidth: 200 }}>
  <ResponsiveContainer width="100%" height={200}>
    <AreaChart data={data}>...</AreaChart>
  </ResponsiveContainer>
</div>
```
Never use `ResponsiveContainer` with `height="100%"` — always pass a pixel value.

## OpenAQ v3

**Status**: Already migrated to v3. Verify the API key is set in .env.local.
If `OPENAQ_API_KEY` is missing, skip this source gracefully (many stations in LB may be offline).

## GDACS — 204 No Content

**This is normal behavior** — 204 means no active disasters matching the query.
Handle: `if (response.status === 204) return []` — show "No active alerts" in the UI, not an error.

## General Resilience Pattern

Every source fetch should follow this pattern:
```typescript
try {
  const data = await fetchWithTimeout(url, { timeout: 10000 });
  if (!data.ok) {
    if (data.status === 429) return { events: cachedEvents, status: 'rate-limited' };
    if (data.status === 204) return { events: [], status: 'no-data' };
    return { events: [], status: 'error', error: `HTTP ${data.status}` };
  }
  const events = normalize(await data.json());
  cache.set(sourceKey, events);
  return { events, status: 'ok' };
} catch (err) {
  return { events: cachedEvents ?? [], status: 'error', error: err.message };
}
```
