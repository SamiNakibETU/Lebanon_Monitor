# Target Architecture — Lebanon Monitor

**Version**: 1.0  
**Date**: 2025-03-06

---

## 1. Vue d'ensemble

Architecture cible : monorepo data-native, géospatiale, multilingue, modulaire et scalable.

```
LEBANON_MONITOR/
├── apps/
│   ├── web/              # Next.js (interface, carte, dashboards)
│   ├── worker/           # Node/TS : ingestion, jobs, indicateurs
│   └── nlp/              # (optionnel) Python : traduction, embeddings, NER
├── packages/
│   ├── core/             # types métiers, taxonomie, classification, scoring
│   ├── db/               # schéma, migrations, repositories
│   ├── connectors/       # connecteurs sources externes
│   ├── geo/              # gazetteer, resolvePlace, alias
│   ├── contracts/        # schémas Zod API
│   ├── config/           # configuration typée
│   └── observability/    # logs, métriques, healthchecks
├── docs/
└── package.json          # workspace root
```

---

## 2. Principes

- **Modularité** : aucune logique critique dans l'UI
- **Data-first** : le modèle de données gouverne
- **Sobriété** : PostgreSQL + PostGIS + bucket suffisent pour v1
- **Révésibilité** : abstractions pour providers (traduction, embeddings, LLM)
- **Testabilité** : logique métier couverte par tests

---

## 3. Stockage en 3 niveaux

### Niveau 1 — Brut immuable

- **But** : conserver exactement ce qui a été récupéré
- **Support** : bucket objet (S3/R2) ou table `raw_ingest` pour petits volumes
- **Champs** : source_name, fetch_time, source_url, raw_content_type, raw_storage_path, hash, ingest_status

### Niveau 2 — Normalisé

- **But** : schéma canonique dans PostgreSQL + PostGIS
- **Entités** : source_item, event_observation, event, place, entity, indicator_snapshot

### Niveau 3 — Contextuel / sémantique

- **Entités** : event_cluster, event_summary, event_translation, event_social_metrics, verification_record, narrative_frame, topic_tag

---

## 4. Flux de données

```
[Sources externes]
       │
       ▼
[Worker : fetch]
       │
       ├──► raw_ingest (brut)
       │
       ▼
[normalize] ──► source_item
       │
       ▼
[classify, geocode, extract]
       │
       ├──► event_observation
       ├──► event
       ├──► place
       └──► entity
       │
       ▼
[dedup, cluster, translate]
       │
       ├──► event_cluster
       ├──► event_translation
       └──► event_social_metrics
       │
       ▼
[indicateurs] ──► indicator_snapshot
       │
       ▼
[API v1] ◄── [Web App]
```

---

## 5. Migration progressive

### Étape 1 — Fondations (Phase B)

- Créer `packages/core`, `packages/db`, `packages/contracts`
- Migrations PostgreSQL/PostGIS
- Repositories de base

### Étape 2 — Sans casser l'existant

- Garder `src/` actuel fonctionnel
- Ajouter `apps/web` qui pointe vers le même code initialement
- Worker lit les connecteurs depuis `packages/connectors`

### Étape 3 — Basculer progressivement

- API `/api/events` consomme la DB si disponible, sinon fallback `fetchAll()`
- Indicateurs calculés par le worker, stockés en snapshot

### Étape 4 — Monorepo complet

- Déplacer `src/sources` → `packages/connectors`
- Déplacer `src/core` → `packages/core`
- Déplacer `src/app` → `apps/web`

---

## 6. Déploiement cible (Railway v1)

- **Service web** : Next.js
- **Service worker** : Node cron / scheduler
- **PostgreSQL** + PostGIS
- **Bucket** : stockage brut (Railway Volume ou R2)
- **Pas de Redis** initialement
- **Queue** : option Postgres-based (pg-boss ou table jobs)

---

## 7. API cible

| Endpoint | Rôle |
|----------|------|
| GET /api/v1/events | Événements filtrés, paginés |
| GET /api/v1/events/:id | Détail événement |
| GET /api/v1/clusters | Clusters |
| GET /api/v1/clusters/:id | Détail cluster |
| GET /api/v1/places | Lieux |
| GET /api/v1/indicators | Indicateurs agrégés |
| GET /api/v1/source-health | Santé des sources |
| GET /api/v1/search | Recherche hybride |
| GET /api/v1/live-feeds | Flux live |
| GET /api/v1/taxonomy | Taxonomie |
| GET /api/v1/filters | Métadonnées filtres |
