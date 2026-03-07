# Execution Plan — Lebanon Monitor

**Version**: 1.0  
**Date**: 2025-03-06

---

## 1. Ordre des phases

### PHASE A — Audit et plan ✅
1. Audit complet du repo
2. Cartographie de l'existant
3. Plan détaillé
4. Docs cibles (ARCHITECTURE_AUDIT, TARGET_ARCHITECTURE, DATA_MODEL, TAXONOMY, SOURCE_STRATEGY, DEPLOYMENT_RAILWAY, EXECUTION_PLAN)

### PHASE B — Fondations data (en cours)
5. Nouveau modèle de données
6. Migrations PostgreSQL/PostGIS
7. Raw storage
8. Repositories
9. Types et contrats

### PHASE C — Pipeline ingestion ✅
10. Normalisation connecteurs
11. Source registry standardisé
12. Status / health
13. Logs structurés
14. Cache et TTL

### PHASE D — NLP / enrichissement
15. Langue
16. Traduction
17. Extraction
18. Taxonomie
19. Déduplication avancée
20. Clustering
21. Résumés

### PHASE E — Géospatial ✅
22. Gazetteer
23. Alias
24. resolvePlace
25. Score de précision
26. Couches géographiques

### PHASE F — Indicateurs / analytics ✅
27. Snapshots
28. Indicateurs
29. Agrégations
30. Endpoints analytiques

### PHASE G — UI premium ✅
31. Migration carte (MapLibre + deck.gl) — reportée, Leaflet conservé
32. Migration charts (ECharts) — reportée, Recharts conservé
33. Filtres
34. Vues clusters
35. Vues événements
36. Monitoring source

### PHASE H — Déploiement ✅
37. Railway
38. .env
39. Healthchecks
40. Doc de déploiement
41. Durcissement final

**Connexion DB locale (Windows)** : voir [DEPLOY.md](./DEPLOY.md) section « Option A » — pièges courants (psql hors PATH, rôle `postgres` absent, PostgreSQL non démarré, prompts psql).

---

## 2. Ordre des premiers commits (Phase B)

1. **b1** : Créer `packages/` et structure monorepo minimale (sans tout déplacer)
2. **b2** : Schéma SQL initial (migrations)
3. **b3** : Types TypeScript alignés sur le schéma
4. **b4** : Package `db` : client, migrations
5. **b5** : Repositories `raw_ingest`, `source_item`, `event`
6. **b6** : Package `contracts` : schémas Zod API
7. **b7** : Raw storage (table ou abstraction bucket)

---

## 3. Fichiers à créer (Phase B immédiate)

| Fichier | Rôle |
|---------|------|
| `packages/core/src/types/event.ts` | Types event, observation, place |
| `packages/core/src/types/source.ts` | Types source_item, raw_ingest |
| `packages/db/prisma/schema.prisma` ou `packages/db/migrations/` | Schéma DB |
| `packages/db/src/client.ts` | Connexion PostgreSQL |
| `packages/db/src/repositories/event.ts` | CRUD event |
| `packages/db/src/repositories/source-item.ts` | CRUD source_item |
| `packages/contracts/src/events.ts` | Schéma Zod GET /api/v1/events |
| `packages/contracts/src/indicators.ts` | Schéma Zod indicateurs |

---

## 4. Critères de succès Phase B

- [ ] Migrations appliquées sans erreur
- [ ] Repositories testables (tests unitaires)
- [ ] Types partagés entre packages
- [ ] Pas de régression sur l'existant (src/ inchangé pour l'instant)
- [ ] Build `npm run build` OK
