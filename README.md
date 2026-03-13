# Lebanon Monitor

Plateforme d’intelligence géotemporelle centrée Liban, avec surfaces analystes, retrieval structuré et agents contraints.

## Quick Start

```bash
npm install
npm run dev
```

## Core Routes

- `GET /api/v2/events`
- `GET /api/v2/search`
- `GET /api/v2/retrieval`
- `POST /api/v2/agent/explore`
- `POST /api/v2/agent/synthesis`
- `GET /api/v2/vitality`
- `GET /api/v2/places/:id/vitality`
- `GET /api/v2/health` (full health)
- `GET /api/health/live` (liveness probe)

## Main Pages

- `/` dashboard
- `/search`
- `/retrieval`
- `/vitality`
- `/episodes`, `/episode/:id`
- `/places`, `/place/:id`
- `/actors`, `/actor/:id`
- `/event/:id`

## Verification

```bash
npm run type-check
npm run test
npm run verify
```

Useful flags:

```bash
node scripts/verify-all.mjs --skip-build
node scripts/verify-all.mjs --skip-db
node scripts/verify-all.mjs https://your-app.railway.app --require-health
```

## Environment (key vars)

- `DATABASE_URL` or `DATABASE_PUBLIC_URL`
- `GROQ_API_KEY` (agents)
- `ANTHROPIC_API_KEY` (classification ambiguë)
- `HF_API_TOKEN` (traductions)
- `INGEST_SECRET` (si trigger via `/api/admin/ingest`)
- Source connectors optionnels: `FIRMS_MAP_KEY`, `OWM_API_KEY`, `CF_API_TOKEN`, `OPENAQ_API_KEY`, `RELIEFWEB_APPNAME`, `UCDP_ACCESS_TOKEN`

## Ingestion

Deux stratégies supportées:

1. Worker service (`npm run worker`)  
2. Endpoint sécurisé `/api/admin/ingest` via cron (`X-Ingest-Secret`)

## Notes

- Les anciens endpoints `/api/events` et `/api/health` sont legacy; la référence produit est `v2`.
- Le statut d’avancement global est documenté dans `docs/STATUS_PLAN.md`.
