# Phase 5A — Compte rendu

## Résumé

Phase 5A appliquée selon le plan `phase-5a-data-layer.md`. Refonte de la couche data en TypeScript pur, avec 108 tests Vitest et une architecture core/ dédiée. **Aucune modification UI** (règle d’or de la phase).

---

## Critères de succès (vérifiés)

| Critère | Statut |
|---------|--------|
| `npx vitest run` → 50+ tests | ✅ 108 tests |
| `npx tsc --noEmit` → 0 erreurs | ✅ |
| `npm run build` → succès | ✅ |
| `classify("Israeli airstrikes target Baalbek")` → ombre | ✅ |
| `classify("Inauguration d'un centre culturel à Beyrouth")` → lumiere | ✅ |
| `classify("قصف إسرائيلي يستهدف الضاحية الجنوبية")` → ombre | ✅ |
| `classify("افتتاح مهرجان بيروت الدولي")` → lumiere | ✅ |
| Déduplication : 5 tweets identiques → 1 | ✅ |
| `/api/events` sans weather/lbp/openaq | ✅ |
| `/api/indicators` pour weather, LBP, AQI | ✅ |
| Aucun import React dans `src/core/` | ✅ |

---

## Architecture mise en place

### `src/core/` — TypeScript pur

```
core/
├── types.ts              # LebanonEvent, ClassificationResult, Indicators, etc.
├── constants.ts          # LEBANON_BBOX, CITIES, SOURCE_PRIORITY, EVENT_SOURCES
├── index.ts              # Barrel export
├── classification/
│   ├── index.ts          # classify(text, { tone?, hfResult? })
│   ├── pre-classifier.ts # HARD_OMBRE / HARD_LUMIERE — ~60 % des cas
│   ├── keyword-scorer.ts # Dictionnaires AR/FR/EN
│   ├── tone-mapper.ts    # GDELT tone (-100 à +100) → scores
│   └── dictionaries/
│       ├── ombre-ar.ts, ombre-fr.ts, ombre-en.ts
│       └── lumiere-ar.ts, lumiere-fr.ts, lumiere-en.ts
├── deduplication/
│   ├── index.ts          # deduplicateEvents(events)
│   ├── normalize-title.ts
│   └── jaccard.ts
├── language/
│   └── detect.ts         # ar | fr | en (heuristique)
└── __tests__/
    ├── classification.test.ts   # 62 tests
    ├── pre-classifier.test.ts   # 11 tests
    ├── deduplication.test.ts    # 10 tests
    ├── language-detect.test.ts  # 4 tests
    └── fixtures/
        ├── ombre-titles.json    # 25 titres
        └── lumiere-titles.json  # 25 titres
```

---

## Modifications détaillées

### 1. Pipeline de classification

- **Étape 1** : `preClassify()` — mots-clés durs (airstrike, bombardment, inauguration, etc.) → retour immédiat.
- **Étape 2** : `scoreByKeywords()` — score 0–1 basé sur 6 dictionnaires.
- **Étape 3** : `mapTone()` — GDELT tone → scores ombre/lumière.
- **Étape 4** : `mapHfResult()` — optionnel, mapping label HF → scores.
- **Ensemble** : pondération keywords 0.35, tone 0.20, HF 0.45 (si présent). Défauts : ombre → `political_tension`, lumiere → `institutional_progress`, neutre → `neutral`.

### 2. Déduplication

- **Clé exacte** : `normalizeTitle(title) + date` → un événement par couple.
- **Similaire (Jaccard ≥ 0.6)** : dans une même journée, on garde la source de plus haute priorité.
- **Priorité** : USGS/FIRMS/GDACS (10) > Cloudflare (9) > RSS/ReliefWeb (8) > GDELT (7) > Twitter (4).

### 3. Registry

- Utilise `classify()` et `deduplicateEvents()` du core.
- Filtre par `EVENT_SOURCES` (exclut weather, lbp-rate, openaq).
- Applique la classification avec le tone GDELT pour chaque événement.

### 4. API

- **`/api/events`** : événements classés et dédupliqués ; suppression de `classifyEnhanced` et des appels HF.
- **`/api/indicators`** : nouvel endpoint pour weather, LBP, AQI, avec cache 60s.

---

## État de l’art (recherche)

### Classification

- **Approches actuelles** : modèles de type BERT/DeBERTa multilingues pour la news ; intégration de lexiques et de features (TF-IDF, POS) pour les langues peu dotées.
- **Pour Lebanon Monitor** : pipeline léger (mots-clés + tone + HF optionnel), sans modèle lourd.
- **Pistes futures** : fine-tuning d’un modèle multilingue (AraELECTRA, mBERT) sur un corpus Liban, ou intégration d’une API de sentiment multilingue.

### Déduplication

- **Approches actuelles** : Jaccard sur n-grammes (ex. 5-grams), MinHash, LSH pour des volumes importants.
- **Pour Lebanon Monitor** : Jaccard sur mots, seuil 0.6.
- **Pistes futures** : passage aux n-grammes (3–5) pour les quasi-duplicatas, MinHash si le nombre d’événements explose.

### Détection de langue

- **Approche actuelle** : heuristique (script arabe, marqueurs FR/EN).
- **Pistes futures** : `@vitalik/fasttext` ou `franc` pour une détection plus fiable.

---

## Fichiers modifiés / créés

| Fichier | Action |
|---------|--------|
| `src/core/*` | Créés |
| `src/sources/registry.ts` | Refactorisé (core classify + dedup) |
| `src/app/api/events/route.ts` | Simplifié (sans HF) |
| `src/app/api/indicators/route.ts` | Créé |
| `vitest.config.ts` | Déjà en place (Step 0) |

---

## Conclusion

Phase 5A complète. La couche core est isolée, testée et utilisée par le registry et les routes API. L’approche reste pragmatique ; les pistes d’amélioration (transformers, n-grammes, MinHash) peuvent être envisagées dans les phases suivantes.
