# Lebanon Monitor V2 Release Checklist

Date: 2026-03-12

## 1) Code Quality Gate

- [x] `npm run type-check` passes
- [x] `npm run test` passes
- [x] `npm run build` passes (or documented local memory limitation + verified in stable environment)
- [ ] `npm run verify` passes for the target environment

## 2) API Health and Runtime

- [ ] `GET /api/health/live` returns 200
- [ ] `GET /api/v2/health` returns valid payload
- [ ] `database.status` is `ok` in `/api/v2/health`
- [x] No sensitive debug payload is exposed in health endpoints

## 3) Analyst Surfaces

- [ ] `event`, `place`, `actor`, `episode`, `search`, `retrieval`, `vitality` are navigable and coherent
- [ ] Analyst actions are available where expected (explore/synthesis/retrieval/citations)
- [ ] Empty and error states are consistent and non-blocking

## 4) Retrieval and Agents

- [ ] Retrieval presets are usable (`place`, `actor`, `episode`, `vitality`, `open`)
- [ ] Context pack can be inspected from retrieval UI
- [ ] Agent panel handles: success, timeout, unavailable model, malformed response
- [ ] Agent output always contains citations or explicit uncertainty

## 5) Vitality and Recovery

- [ ] `/vitality` page reflects measured/proxy/narrative separation
- [ ] Territorial drill-down is accessible from vitality surfaces
- [ ] Place-level vitality is available on place pages

## 6) Deploy and Ingestion

- [ ] Chosen ingestion mode is explicit (worker service and/or secure cron `/api/admin/ingest`)
- [ ] Required environment variables are present on Railway
- [ ] Deploy docs match actual deployment setup

## 7) Documentation Truth Pass

- [x] `docs/STATUS_PLAN.md` matches real implementation status
- [x] `README.md` references v2 routes and current commands
- [x] `docs/DEPLOY.md` and `docs/RAILWAY_ALIMENTER.md` are consistent with health endpoints and ingestion mode

## 8) Final Brief Verdict

- [x] Brief reviewed bloc-by-bloc against `docs/LEBANON_MONITOR_DIRECTOR_BRIEF.md`
- [x] Remaining limits are documented explicitly
- [ ] Final status is one of:
  - [ ] `brief atteint`
  - [x] `brief atteint avec limites documentées`
  - [ ] `brief non atteint`

## Evidence Notes (2026-03-13)

- Verified locally: `npm run type-check`, `npm run test`, `npm run build`, `node scripts/verify-all.mjs --skip-db --skip-build`.
- One intermittent build-worker failure was observed in a separate `verify` run (`3221226505`) while standalone build passed; treated as runtime-machine risk.
- DB and full health validation must be confirmed on target environment (local DB up or Railway URL with `--require-health`).

