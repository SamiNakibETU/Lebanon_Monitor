# Plan de remédiation UI — Lebanon Monitor

**Date** : 7 mars 2026  
**Contexte** : Problèmes majeurs sur https://lebanonmonitor-production.up.railway.app/

---

## 1. Diagnostic des problèmes identifiés

### 1.1 Carte centrale noire (MapWidget)

**Symptôme** : Le panneau central affiche un rectangle noir à la place de la carte.

**Causes probables** :
- **Dimensions initiales à 0** : MapLibre GL crée la carte au montage. Si le conteneur a `height: 0` (layout pas encore calculé, flex en cours), le canvas reste noir.
- **Pas de `map.resize()`** : Quand le conteneur change de taille (split, hover, redimensionnement), MapLibre doit être notifié. Le code n'appelle pas `map.resize()`.
- **Style Carto** : Les URLs `positron-nolabels` / `dark-matter-nolabels` peuvent échouer (réseau, CORS). Pas de fallback ni d'état d'erreur affiché.

**Fichiers** : `src/components/widgets/MapWidget.tsx`

---

### 1.2 Polymarket bloqué sur "Chargement…"

**Symptôme** : Le widget affiche "Chargement…" indéfiniment.

**Causes** :
- **État loading vs empty confondu** : Le widget affiche "Chargement…" quand `markets.length === 0` et `!error`. Impossible de distinguer "en cours de chargement" de "aucun marché Liban trouvé".
- **API peut retourner `[]`** : L'API Polymarket filtre par "lebanon/lebanese". Si aucun marché ne correspond, elle retourne `{ markets: [] }` — le front considère ça comme loading.
- **Pas de skeleton/feedback** : Aucun indicateur de chargement (spinner) pour confirmer que la requête est en cours.

**Fichiers** : `src/components/widgets/PolymarketWidget.tsx`, `src/app/api/v2/polymarket/route.ts`

---

### 1.3 Layout à 3 panneaux vs CSS pour 2

**Symptôme** : Duplication des onglets, panneaux OMBRE identiques, confusion visuelle.

**Causes** :
- **3 panneaux** : Lumière | Ombre | Ombre. Le design semble prévu pour 2 panneaux (Lumière | Ombre). Le 3ᵉ panneau Ombre est redondant.
- **CSS `:has()` et `data-mode`** : Les sélecteurs ciblent `.panel--lumiere` et `.panel--ombre`. Avec 2 panels ombre, les deux reçoivent les mêmes règles. En mode `ombre`, les deux s'étendent (flex: 1) — comportement peut-être voulu mais source de bugs de layout.

**Fichiers** : `src/app/page.tsx`, `src/app/globals.css`

---

### 1.4 Refs partagées (bug critique)

**Symptôme** : Charts et composants avec dimensions incorrectes.

**Causes** :
- **`categoryOmbreRef`** utilisé dans les **deux** panneaux Ombre (lignes 318 et 384). Une seule ref ne peut pointer que vers un seul élément DOM. Le 2ᵉ panneau a des dimensions 0 ou erronées.
- **`timelineRef`** : Placé uniquement dans le panneau Lumière. Les TimelineChart des panneaux Ombre utilisent `timelineSize` (provenant de ce ref). Si Lumière est réduit (flex: 0), `timelineSize` peut être 0 → charts invisibles ou cassés.

**Fichiers** : `src/app/page.tsx`

---

### 1.5 Header — débordement "AR"

**Symptôme** : L'option de langue "AR" est coupée sur petits écrans.

**Causes** :
- Header en `flex` sans `flex-wrap` ni `overflow` adapté.
- Les indicateurs (LBP, météo, events, heure) prennent de la place. Sur mobile/tablette, le bloc droit pousse "AR" hors écran.

**Fichiers** : `src/components/layout/Header.tsx`, `src/app/globals.css`

---

### 1.6 0 events en production

**Symptôme** : Le site affiche "0 events" alors que des données existent en local.

**Causes** (hors scope UI pur) :
- Base de données non alimentée (worker/cron non configuré).
- Erreur API `/api/v2/events` ou `/api/v2/stats`.
- Variables d'environnement manquantes sur Railway.

**Action** : Vérifier l’ingestion (cf. `docs/RAILWAY_ALIMENTER.md`).

---

## 2. Plan de remédiation

### Phase 1 — Corrections critiques (priorité haute)

| # | Tâche | Fichier(s) | Action |
|---|-------|------------|--------|
| 1.1 | **MapWidget — resize + dimensions** | `MapWidget.tsx` | Ajouter `ResizeObserver` sur le conteneur, appeler `map.resize()` quand les dimensions changent. S'assurer que le conteneur a `min-height` suffisant avant init. |
| 1.2 | **MapWidget — état d'erreur** | `MapWidget.tsx` | Gérer `map.on('error')` et afficher un message/fallback si le style ne charge pas. |
| 1.3 | **Refs partagées** | `page.tsx` | Créer `categoryOmbreRef2` (ou `categoryOmbre2Ref`) pour le 2ᵉ panneau Ombre. Créer `timelineOmbreRef` et l'utiliser pour les TimelineChart des panneaux Ombre. |
| 1.4 | **Polymarket — loading vs empty** | `PolymarketWidget.tsx` | Utiliser `isValidating` de SWR pour distinguer loading (`!data && !error`) vs empty (`data && markets.length === 0`). Afficher "Aucun marché Liban" quand empty, spinner quand loading. |

### Phase 2 — Simplification layout (priorité moyenne)

| # | Tâche | Fichier(s) | Action |
|---|-------|------------|--------|
| 2.1 | **Réduire à 2 panneaux** | `page.tsx` | Supprimer le 3ᵉ panneau Ombre. Layout : Lumière \| Ombre. Polymarket reste dans le pied du panneau Ombre. |
| 2.2 | **Ajuster CSS split** | `globals.css` | Vérifier que les règles `data-mode` fonctionnent correctement avec 2 panneaux. |

### Phase 3 — UX et robustesse (priorité basse)

| # | Tâche | Fichier(s) | Action |
|---|-------|------------|--------|
| 3.1 | **Header responsive** | `Header.tsx`, `globals.css` | Rendre le header scrollable horizontalement ou masquer certains indicateurs sur mobile. Ou réduire la taille des éléments. |
| 3.2 | **Polymarket — message explicite** | `PolymarketWidget.tsx` | Si `error`, afficher "Marchés indisponibles" (déjà fait) + possibilité de retry. |
| 3.3 | **MapWidget — fallback** | `MapWidget.tsx` | Si erreur de chargement, afficher une carte statique (image) ou un message "Carte indisponible" au lieu d'un écran noir. |

---

## 3. Ordre d'exécution recommandé

1. **1.3** (refs) — rapide, corrige les charts
2. **1.1 + 1.2** (MapWidget) — corrige la carte noire
3. **1.4** (Polymarket) — corrige le "Chargement…" infini
4. **2.1 + 2.2** (2 panneaux) — simplifie le layout
5. **3.1** (header) — polish responsive

---

## 4. Résumé des fichiers à modifier

| Fichier | Modifications |
|---------|----------------|
| `src/components/widgets/MapWidget.tsx` | ResizeObserver + resize(), gestion erreur, fallback |
| `src/components/widgets/PolymarketWidget.tsx` | isValidating, états loading/empty/error distincts |
| `src/app/page.tsx` | Refs dédiés (categoryOmbre2Ref, timelineOmbreRef), suppression 3ᵉ panneau |
| `src/app/globals.css` | Ajustements split si besoin |
| `src/components/layout/Header.tsx` | Responsive, overflow |

---

## 5. Critères de succès

- [x] La carte s'affiche correctement dans les panneaux Lumière et Ombre (ResizeObserver + resize + fallback erreur)
- [x] Polymarket affiche soit les marchés, soit "Aucun marché Liban", soit un spinner pendant le chargement
- [x] Les charts (Timeline, Catégories) ont des dimensions correctes (refs dédiés timelineOmbreRef)
- [x] Le header responsive (overflow-x-auto, gap réduit sur mobile)
- [x] Layout à 2 panneaux (Lumière | Ombre) sans duplication

**Implémenté le 7 mars 2026**
