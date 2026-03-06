# Phase 4 Agent Prompt — Lebanon Monitor

Phase 3 est terminée. Prochaines priorités suggérées.

---

## PROMPT

```
Lebanon Monitor Phase 3 is complete (build OK, sources mostly OK). Execute Phase 4 improvements:

---

### STAGE 1: Fix remaining source issues

1. **ReliefWeb (403)** : Request approved appname at https://apidoc.reliefweb.int/. 
   Until approved, document the workaround or gracefully degrade (hide ReliefWeb from UI when error).

2. **RSS feeds** :
   - L'Orient-Le Jour (403) : Try alternative URL, check if paywall/block
   - Daily Star Lebanon (403) : Same
   - MTV Lebanon (404) : Find correct RSS URL

3. **GDELT (429)** : Already has 30s backoff. Consider increasing min interval to 10s if rate limits persist.

---

### STAGE 2: Production readiness

1. **Environment** : Ensure .env.example documents all required vars (HF_API_TOKEN, OPENWEATHER_API_KEY, FIRMS_API_KEY, etc.)

2. **Error boundaries** : Add app/error.tsx and app/global-error.tsx for App Router error handling

3. **Security** : Audit for exposed API keys, ensure no secrets in client bundles

4. **Deployment** : Vercel config (vercel.json) if needed, ISR/cache headers for /api/events

---

### STAGE 3: Testing & QA

1. Run `npx vitest run` — ensure tests pass
2. Run `npx playwright test` if e2e exists
3. Manual smoke: maps, charts, source filter, mobile tabs

---

### STAGE 4: Optional enhancements

- Export events to CSV
- Dark/light theme toggle
- Notification when new ombre events (browser push or badge)
- Historical LBP rate chart (7-day sparkline)

---

Start with Stage 1 (source fixes) then Stage 2 (production). Report any blockers.
```
