# Vitality, Retrieval, Agents — Implémentation

**Date** : 12 mars 2026

## Livrables

### 1. Vitality contract
- `src/lib/read-models/vitality.ts` — types et interfaces
- `src/app/api/v2/vitality/route.ts` — API unifiée
- Agrégation : reconstruction, reliefweb-lumiere, LBP, EDL, Cloudflare, infrastructure

### 2. Home Vitality swap
- Section « Lumière » remplacée par « Vitalité & Reprise »
- Composants : VitalitySummary, VitalityIndicatorStrip, VitalityEvidenceList, VitalityTrendChart, TerritorialVitalityBoard
- SectionLumiereOmbre et SectionLumiere mises à jour

### 3. Place-level Vitality
- `src/app/api/v2/places/[id]/vitality/route.ts`
- PlaceVitalityBlock intégré dans la page place

### 4. Retrieval layer
- `src/lib/retrieval/` — query-schema, search, context-pack, citations, rerank
- `src/app/api/v2/retrieval/route.ts` — retrieval structuré multi-objets
- Scope : SQL + filters, temporel, géospatial léger. Pas d’embeddings ni vector store.

### 5. Context packs
- `place-context`, `actor-context`, `episode-context`, `vitality-context`
- Structure : facts, claims, contradictions, uncertainInferences, missingData, citations

### 6. Agents contraints
- `src/lib/agents/` — tools, schemas, guards
- `POST /api/v2/agent/synthesis` — synthèse avec citations
- `POST /api/v2/agent/explore` — exploration focus place/actor/episode/vitality
- Guardrails : pas de faits non cités, section incertitude si données partielles

### 7. Tests et docs
- Tests : retrieval (citations, query-schema), agents (guards)
- Mise à jour STATUS_PLAN.md
- Plans : vitality-design, vitality-retrieval-agents-implementation
