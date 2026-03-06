# Deployment Railway — Lebanon Monitor

**Version**: 1.0  
**Date**: 2025-03-06

---

## 1. Architecture v1 sur Railway

```
┌─────────────────┐     ┌─────────────────┐
│   Web Service   │     │ Worker Service  │
│   (Next.js)     │     │ (Node cron)     │
└────────┬────────┘     └────────┬────────┘
         │                        │
         └────────────┬───────────┘
                      │
              ┌───────▼───────┐
              │  PostgreSQL  │
              │  + PostGIS   │
              └──────────────┘
                      │
              ┌───────▼───────┐
              │    Bucket    │  (Volume ou R2)
              │  (raw store) │
              └──────────────┘
```

---

## 2. Services

### Web

- **Build** : `npm run build`
- **Start** : `npm run start`
- **Health** : `GET /api/health`
- **Port** : 3000

### Worker

- **Build** : `npm run build` (depuis packages/worker ou apps/worker)
- **Start** : `node dist/worker.js` ou `npx ts-node src/worker.ts`
- **Cron** : ingestion toutes les 5-15 min selon source

### PostgreSQL

- Extension PostGIS activée
- Variables : `DATABASE_URL`

---

## 3. Variables d'environnement

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/lebanon_monitor

# Optional (sources)
FIRMS_MAP_KEY=
OWM_API_KEY=
CF_API_TOKEN=
OPENAQ_API_KEY=
HF_API_TOKEN=

# Optional (bucket raw storage)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
RAW_BUCKET_NAME=
RAW_BUCKET_REGION=

# Env
NODE_ENV=production
```

---

## 4. Migrations

```bash
# Avant démarrage
npx prisma migrate deploy
# ou
npm run db:migrate
```

---

## 5. Bootstrap

```bash
# 1. Migrations
npm run db:migrate

# 2. Seed (taxonomie, lieux de base)
npm run db:seed

# 3. Vérifier
npm run db:check
```

---

## 6. Healthchecks

- **Web** : `GET /api/health` → 200 si DB reachable
- **Worker** : process qui tourne, logs structurés

---

## 7. Environnements

| Env | URL | DB | Notes |
|-----|-----|-----|-------|
| local | localhost:3000 | local PostgreSQL | .env.local |
| staging | *.railway.app | Railway Postgres | Tests |
| production | *.railway.app | Railway Postgres | Réel |

---

## 8. Coûts estimés v1

- **Hobby** : ~5-20€/mois
- Web + Worker + PostgreSQL + Volume
- Pas de Redis, pas de NLP dédié initialement
