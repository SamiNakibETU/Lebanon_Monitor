# Phase 3 — Compte rendu total

Lebanon Monitor — Passage du prototype au tableau de bord d’intelligence structuré.

**Période** : Session(s) Phase 3  
**Date du rapport** : 5 mars 2026

---

## 1. Vue d’ensemble

Phase 3 couvre 7 étapes : stabilisation des sources, refonte design, graphiques, NLP, CCTV, nettoyage et vérification finale.

---

## 2. Stage 1 — Stabilisation des sources

### GDELT
- Intervalle minimum de 6 secondes entre requêtes
- Cache en mémoire avec TTL de 15 minutes
- Gestion des réponses non-JSON
- Gestion du 429 : backoff de 30 secondes

**Fichiers** : `src/sources/gdelt/fetcher.ts`, `src/sources/gdelt/config.ts`

### ReliefWeb
- User-Agent ajouté
- Paramètre `appname` conservé (requis par l’API)
- **Statut actuel** : 403 — appname non approuvé, demande d’appname en cours

**Fichiers** : `src/sources/reliefweb/fetcher.ts`

### RSS
- L'Orient-Le Jour : URL `/feed`
- MTV Lebanon : URL `/Feed/RSS`
- User-Agent appliqué à tous les feeds
- **Statut** : partiel — L'Orient 403, Daily Star 403, MTV 404 ; autres flux OK

**Fichiers** : `src/sources/rss/fetcher.ts`, `src/sources/rss/config.ts`

### GDACS
- Réponse 204 → tableau vide (pas d’erreur)

**Fichiers** : `src/sources/gdacs/fetcher.ts`

### Recharts
- Containers avec hauteurs explicites (`minHeight: 200`) pour éviter les erreurs de rendu

---

## 3. Stage 2 — Refonte design (split layout)

### Composants créés

| Composant | Rôle |
|-----------|------|
| `SplitLayout.tsx` | Conteneur flex, suivi souris, expansion gauche/droite selon position (40 % / 20 % / 40 %) |
| `LumierePanel.tsx` | Panneau lumineux, carte CARTO Positron, marqueurs verts, liste événements Lumière |
| `OmbrePanel.tsx` | Panneau sombre, carte CARTO Dark Matter, marqueurs rose, liste événements Ombre |
| `SharedHeader.tsx` | Barre fixe 48px : titre, nombre d’événements, mise à jour, filtre par source |

### Mise à jour

- `page.tsx` : layout remplacé par SplitLayout + SharedHeader
- `globals.css` : tokens (--lumiere-*, --ombre-*), Inter, scrollbar personnalisée

---

## 4. Stage 3 — Graphiques et visualisations

### Composants ajoutés

| Composant | Rôle |
|-----------|------|
| `ClassificationDonut.tsx` | Donut Recharts Lumière / Ombre / Neutre |
| `SourceStatusCompact.tsx` | Grille compacte de statut des sources |
| `CategoryBreakdownBars.tsx` | Barres horizontales des 5 principales catégories par panneau |
| `EventTimeline.tsx` | Timeline horizontale des événements |
| `EventMap.tsx` | Heatmap Leaflet (leaflet.heat) pour clustering géographique |

- Taux LBP en header
- Containers de graphiques avec `minHeight: 200px`

**⚠️ Problème** : La section graphique reste nulle en pratique — graphiques trop petits, peu lisibles, à refondre entièrement (voir §13.A).

---

## 5. Stage 4 — Module NLP

### Création

| Fichier | Rôle |
|---------|------|
| `src/lib/nlp/language-detect.ts` | Détection arabe/français/anglais |
| `src/lib/nlp/cache.ts` | Cache LRU en mémoire |
| `src/lib/nlp/huggingface.ts` | Client HF Inference API |
| `src/lib/nlp/classifier-enhanced.ts` | Classifieur ensemble : mots-clés 0,3 + HF 0,5 + tone 0,2 |
| `src/lib/nlp/entity-extract.ts` | Extraction d’entités libanaises (noms, partis, villes) |

### Intégration

- `/api/events` : classification renforcée appliquée après `fetchAll`
- GDELT : `tone` stocké dans `rawData` pour l’ensemble
- `.env.example` : `HF_API_TOKEN` documenté

### Correctifs HF (post-implémentation)

- Anciens modèles (distilbert, CAMeL-Lab, nlptown) renvoyant 410 → remplacés par un seul modèle multilingue : `cardiffnlp/twitter-xlm-roberta-base-sentiment`
- 410/429 : `hfDisabledUntil` — arrêt HF 1 minute, fallback keywords + tone
- Limite HF : 25 événements maximum, uniquement pour gdelt, rss, twitter, reliefweb
- Paramètre `useHf` dans `classifyEnhanced` pour désactiver HF par événement

---

## 6. Stage 5 — Panel CCTV / flux live

| Composant | Rôle |
|-----------|------|
| `LiveFeedStrip.tsx` | Bande verticale centrale (40px → 300px au survol) avec iframe SkylineWebcams Beirut |

- `SplitLayout` : prop optionnelle `center` pour la bande centrale

**⚠️ Problème** : Le flux ne s’affiche pas directement — il faut survoler la bande, et l’iframe est souvent bloquée par X-Frame-Options. Inutilisable en l’état (voir §13.B).

---

## 7. Stage 6 — Nettoyage et polish

- **Supprimés** : `DashboardSidebar`, `StatCard`, `ClassificationChart` (remplacé), `EventsBySourceChart`, `CategoryBreakdown` (remplacé)
- `LoadingSkeleton.tsx` : squelettes de chargement
- Layout mobile (< 768px) : onglets Lumière/Ombre à la place du split

---

## 8. Stage 7 — Vérification finale

### Build

- **Problème** : `PageNotFoundError: Cannot find module for page: /_error`
- **Correction** : `src/pages/_error.tsx` (Pages Router fallback)
- **Résultat** : `npm run build` réussi

### Cache Next.js

- **Problème** : `MODULE_NOT_FOUND` (948.js, 682.js, vendor-chunks), `ENOENT` sur `*.pack.gz`
- **Corrections** :
  - Suppression du cache `.next`
  - `next.config.mjs` : `config.cache = false` en dev pour éviter la corruption du cache webpack
  - Script `npm run clean` pour nettoyer le cache

---

## 9. Fichiers créés (Phase 3)

```
src/
├── components/
│   ├── SplitLayout.tsx
│   ├── LumierePanel.tsx
│   ├── OmbrePanel.tsx
│   ├── SharedHeader.tsx
│   ├── LiveFeedStrip.tsx
│   ├── ClassificationDonut.tsx
│   ├── SourceStatusCompact.tsx
│   ├── CategoryBreakdownBars.tsx
│   ├── EventTimeline.tsx
│   └── LoadingSkeleton.tsx
├── lib/nlp/
│   ├── language-detect.ts
│   ├── cache.ts
│   ├── huggingface.ts
│   ├── classifier-enhanced.ts
│   ├── entity-extract.ts
│   └── index.ts (barrel)
└── pages/
    └── _error.tsx
```

---

## 10. Fichiers modifiés

| Fichier | Modifications |
|---------|---------------|
| `src/app/page.tsx` | Nouveau layout, SWR, onglets mobile |
| `src/app/globals.css` | Tokens design, Inter |
| `src/app/api/events/route.ts` | `applyEnhancedClassification`, limite HF, `useHf` |
| `src/components/EventMap.tsx` | Props `theme`, `markerColor`, heatmap |
| `src/components/EventList.tsx` | Prop `theme` |
| `src/sources/gdelt/fetcher.ts` | Intervalle, cache, 429 |
| `src/sources/gdelt/normalizer.ts` | Stockage `tone` dans rawData |
| `src/sources/reliefweb/fetcher.ts` | User-Agent |
| `src/sources/rss/fetcher.ts` | URLs, User-Agent |
| `src/sources/gdacs/fetcher.ts` | 204 → [] |
| `next.config.mjs` | webpack cache désactivé en dev |
| `package.json` | Script `clean` |
| `.env.example` | HF_API_TOKEN |

---

## 11. État final des sources

| Source | Statut | Remarque |
|--------|--------|----------|
| usgs | ✅ | OK |
| weather | ✅ | OK (4 villes) |
| lbp-rate | ✅ | OK (~89 700 LBP/USD) |
| gdacs | ✅ | OK (204 → vide) |
| cloudflare | ✅ | OK |
| firms | ✅ | OK |
| openaq | ✅ | OK |
| gdelt | ✅ | OK (backoff 30s sur 429) |
| rss | ⚠️ | Partiel : 29 items ; L'Orient 403, Daily Star 403, MTV 404 |
| twitter | ✅ | OK |
| reliefweb | ❌ | 403 — appname non approuvé |

---

## 12. Résumé des correctifs post-Phase 3

1. **HF** : modèle unique cardiffnlp, limite 25 events, `hfDisabledUntil` sur 410/429
2. **Build** : page `_error` pour éviter `PageNotFoundError`
3. **Cache** : nettoyage `.next`, webpack cache désactivé en dev, script `clean`

---

## 13. Problèmes connus (à corriger) — **TOUT À AMÉLIORER**

> **État actuel** : La Phase 3 est fonctionnelle mais plusieurs éléments sont insuffisants et nécessitent des améliorations significatives.

### A. Section graphique — **Nulle / insuffisante**

**Problèmes** :
- Graphiques (EventsOverTimeChart, ClassificationDonut, CategoryBreakdownBars) trop petits et peu lisibles
- Mise en page compacte, les visualisations manquent de présence
- Pas de graphiques vraiment utiles pour l’analyse (pas de tendances claires, pas de comparaisons)
- Le donut et les barres de catégories sont peu exploités visuellement

**À faire** : Refonte complète de la section graphique — graphiques plus grands, meilleure hiérarchie visuelle, visualisations réellement exploitées pour l’analyse.

### B. CCTV / flux live — **Ne s’affiche pas directement, inutilisable en l’état**

**Problèmes** :
- Le flux CCTV n’est pas visible par défaut : il faut **survoler** la bande centrale pour l’afficher
- Si l’utilisateur ne survole pas, seul un petit icône « CCTV » apparaît → comportement contre-intuitif et nul
- L’iframe SkylineWebcams est souvent bloquée par X-Frame-Options → le flux ne s’affiche pas même au survol
- Dans ce cas, seul un lien « Ouvrir en plein écran » est proposé → pas de flux intégré

**À faire** : Afficher le flux CCTV directement et par défaut, ou proposer une alternative embarquée (autre source, image statique actualisée, etc.). Supprimer le système « survol pour afficher ».

### C. Géocodage — Amélioration partielle

**État** : Jitter ajouté (Twitter/RSS) pour répartir les marqueurs ; extraction de ville via texte (Beirut, Tripoli, Sidon…).

**Limites** : Pas de géocodage réel (Nominatim, API externe) ; toutes les sources sans localisation précise restent approximatives.

### D. Interface bloquée sur "0 ÉVÉNEMENTS" et skeletons

**Symptôme** : Header affiche "0 ÉVÉNEMENTS", contenu reste en loading (barres grises), fond noir.

**Causes probables** :
1. **IndexSizeError (EventMap)** : `getImageData` sur canvas width 0 → le heatmap leaflet.heat plante avant que le conteneur ait des dimensions. Correctif appliqué (retry, try-catch) mais peut encore échouer si le layout n’est pas prêt.
2. **Latence API** : `/api/events` met 30–40 s à répondre (GDELT backoff, Twitter, etc.) → SWR reste en `loading`, skeletons affichés longtemps.
3. **Erreurs webpack** : `TypeError: Cannot read properties of undefined (reading 'call')` et `ENOENT *.pack.gz` → corruption du cache, rechargement partiel, page incomplète.

### E. Erreurs terminal (cache Next.js / webpack)

| Erreur | Cause | Correctif |
|--------|-------|-----------|
| `ENOENT: ... pack.gz` | Cache webpack corrompu (Windows) | `npm run clean` + redémarrage |
| `TypeError: ... 'call'` (webpack-runtime) | Chunks manquants après corruption | Idem |
| `GET / 500` | Conséquence des erreurs ci-dessus | Redémarrer proprement |
| `404` sur `_app-pages-browser_src_components_EventMap_tsx.js` | Chemins HMR erronés après Hot Reload | Full reload, éviter éditions pendant compile |

### F. Sources données

| Problème | Détail |
|----------|--------|
| GDELT | `Unexpected token 'O', "One or mor"... is not valid JSON` — page HTML d’erreur au lieu de JSON |
| GDELT | 429 rate limited → backoff 30s, ralentit l’API |
| ReliefWeb | 403 — appname non approuvé |
| RSS | L'Orient-Le Jour 403, Daily Star 403, MTV 404 |

### G. Actions recommandées

1. **Après modification** : `npm run clean` puis `npm run dev` pour éviter les erreurs de cache.
2. **Si "0 ÉVÉNEMENTS"** : Attendre ~40 s ou rafraîchir ; vérifier que `/api/events` renvoie bien des events.
3. **EventMap** : Si l’IndexSizeError revient, désactiver temporairement le heatmap (`showHeatmap={false}`).

---

## 14. Prochaines étapes (Phase 4)

### Priorité haute — à améliorer en premier

1. **Section graphique** : Refonte complète — graphiques plus grands, lisibles, réellement utiles pour l’analyse.
2. **CCTV** : Afficher le flux directement (sans survol) ; trouver une source embarquée qui fonctionne (SkylineWebcams bloque souvent l’iframe).

### Priorité moyenne

- ReliefWeb : demander un appname approuvé
- RSS : corriger L'Orient, Daily Star, MTV
- Géocodage : intégration Nominatim ou API externe pour localisation précise

### Autres

- Production : `.env.example` complet, `error.tsx`, sécurité
- Tests : Vitest, e2e
- Optionnel : export CSV, mode sombre, notifications
