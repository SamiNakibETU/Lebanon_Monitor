# Architecture Audit — Lebanon Monitor

**Date**: 2025-03-06  
**Version**: 1.0

---

## 1. Vue d'ensemble

Le projet Lebanon Monitor est un dashboard d'intelligence temps réel pour le Liban. L'audit porte sur l'architecture actuelle, les forces, faiblesses et opportunités de migration.

---

## 2. Arborescence actuelle

```
LEBANON_MONITOR/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/
│   │   │   ├── events/route.ts  # GET /api/events (fetchAll → events filtrés)
│   │   │   ├── indicators/route.ts
│   │   │   ├── health/route.ts
│   │   │   └── youtube/        # embed, live
│   │   ├── layout.tsx, page.tsx
│   │   └── globals.css
│   ├── components/             # UI React (EventMap, panels, charts)
│   ├── config/                 # lebanon.ts, live-channels.ts
│   ├── core/                   # Logique métier pure
│   │   ├── classification/     # pre-classifier, keyword-scorer, tone-mapper
│   │   ├── deduplication/       # jaccard, normalize-title
│   │   ├── language/detect.ts
│   │   ├── types.ts, constants.ts
│   │   └── __tests__/
│   ├── lib/                    # Utilitaires
│   │   ├── fetcher.ts          # fetchWithTimeout, retry 5xx
│   │   ├── geocoding.ts        # addJitter (pas de vrai géocodage)
│   │   ├── logger.ts, labels.ts
│   │   └── nlp/                # HF inference, entity-extract, classifier-enhanced
│   ├── sources/                # 11 connecteurs
│   │   ├── registry.ts         # fetchAll(), agrégation parallèle
│   │   ├── gdelt, usgs, firms, rss, gdacs, reliefweb
│   │   ├── weather, cloudflare, lbp-rate, openaq, twitter, ucdp
│   │   └── */fetcher.ts, normalizer.ts, config.ts, types.ts
│   └── types/                  # events.ts, common.ts
├── config/                     # Nitter (externe)
├── docs/
├── package.json
└── .env.example
```

---

## 3. Points positifs (conservables)

### 3.1 Core isolé

- `src/core/` : logique métier pure, sans React/Next.js
- Classification : pré-classificateur → keywords → tone → ensemble
- Déduplication : Jaccard + priorité source, `normalizeTitle`
- Dictionnaires FR/EN/AR (lumiere, ombre)

### 3.2 Connecteurs sources

- Pattern uniforme : `fetch()` → `normalize()` → `LebanonEvent[]`
- Tests unitaires avec fixtures JSON/CSV
- Gestion d'erreurs : Result pattern, retry 5xx, timeout

### 3.3 Types centralisés

- `LebanonEvent` : interface canonique unique
- `SourceName`, `EventCategory`, `Classification`, `Severity`
- `SourceError`, `Result<T,E>`

### 3.4 API et UI

- Routes API séparées : events, indicators, health
- Filtres par source et classification
- SWR pour rafraîchissement client
- Design Lumière/Ombre cohérent

### 3.5 Lib partagé

- `fetchWithTimeout` : timeout 10s, retry 2, backoff
- Logger structuré (JSON)
- Géocodage minimal : jitter sur coords, `CITIES` dans constants

---

## 4. Limites et problèmes identifiés

### 4.1 Pas de persistance

- **Aucune base de données** : tout est in-memory
- Chaque requête `/api/events` déclenche un `fetchAll()` sur toutes les sources
- Pas d'historique, pas de raw storage

### 4.2 Pas de séparation brut / normalisé / contextuel

- Raw payloads non conservés
- Pas de trace de provenance
- Pas de table `raw_ingest`, `source_item`, etc.

### 4.3 Taxonomie limitée

- Classification : lumiere / ombre / neutre uniquement
- Catégories existantes mais peu exploitées
- Pas de taxonomie hiérarchique (sécurité, politique, économie, etc.)

### 4.4 Géocodage faible

- `lib/geocoding.ts` : uniquement `addJitter`
- GDELT : coords par domaine (DOMAIN_COORDS)
- RSS / ReliefWeb : souvent `DEFAULT_COORDS` (Beirut)
- Pas de gazetteer, pas de `resolvePlace()`, pas de score de précision

### 4.5 Multilingue partiel

- Détection langue : `core/language/detect.ts` (présent)
- Pas de traduction systématique
- Dictionnaires FR/EN/AR pour classification mais pas de stockage multilingue

### 4.6 Registry couplé

- `sources/registry.ts` : imports directs de chaque source
- Pas d'interface standard `fetch()`, `normalize()`, `healthcheck()`
- Pas de registry déclaratif ni de `getTTL()`, `getCostClass()`

### 4.7 UI / données mélangées

- Calcul des indicateurs (lbp, weather, aqi) extrait depuis `fetchAll()`
- Pas de moteur d'indicateurs séparé
- Carte Leaflet : pas de clustering, pas de heatmap avancée

### 4.8 Sources fragiles

- GDELT : 429 rate limit fréquent
- ReliefWeb : 403 appname non approuvé
- RSS : L'Orient 403, MTV 404
- Twitter : Nitter RSS (instances instables)

### 4.9 Pas de worker dédié

- Ingestion dans le même processus que l'API
- Pas de cron, pas de queue
- Pas de séparation web / worker

---

## 5. Cartographie des dépendances

| Composant   | Dépend de              | Utilisé par           |
|-------------|------------------------|------------------------|
| core        | types, constants       | registry, API         |
| registry    | 11 sources, core       | /api/events, /api/indicators |
| API events  | registry, zod          | page.tsx (SWR)        |
| EventMap    | Leaflet, events        | LumierePanel, OmbrePanel |
| fetcher     | types/common           | tous les fetchers     |
| geocoding   | -                      | (quasi inutilisé)     |

---

## 6. Ce qui doit être migré

1. **Types** : `LebanonEvent` → étendre vers `event`, `event_observation`, etc.
2. **Classification** : conserver la logique, ajouter taxonomie hiérarchique
3. **Déduplication** : conserver Jaccard + priorité, enrichir avec `event_cluster`
4. **Connecteurs** : adapter vers interface standard (fetch, normalize, healthcheck)
5. **Constants** : CITIES → partie du gazetteer, LEBANON_BBOX conservé

---

## 7. Ce qui doit être supprimé / remplacé

1. **Registry actuel** : remplacer par registry déclaratif + worker
2. **Calcul indicateurs dans fetchAll** : extraire vers moteur d'indicateurs
3. **Geocoding addJitter seul** : remplacer par `resolvePlace()` + gazetteer
4. **Pas de suppression de code fonctionnel** sans remplaçant

---

## 8. Risques

- Migrer vers PostgreSQL/PostGIS sans casser le build
- GDELT / ReliefWeb : fragilité externe, hors contrôle
- Monorepo : migration progressive pour éviter refonte brutale

---

## 9. Recommandations immédiates

1. Créer la structure monorepo (packages, apps) sans déplacer tout d'un coup
2. Ajouter PostgreSQL + migrations en parallèle de l'existant
3. Conserver l'API `/api/events` fonctionnelle pendant la migration (fallback in-memory si DB vide)
4. Introduire le worker comme processus séparé une fois la DB opérationnelle
