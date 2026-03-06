# Phase 4 — Compte rendu

## Résumé

Phase 4 appliquée selon `AGENT_PROMPT_PHASE4.md`. Le build termine avec succès.

---

## Stage 1 — Correction de la classification

### Modifications

1. **`src/lib/classification/keywords.ts`**
   - Dictionnaires AR/FR/EN complets (CLASSIFICATION_FIX.md)
   - Mots-clés ombre : conflit, militaire, Hezbollah, bombardement, etc.
   - Mots-clés lumière : inauguration, festival, accord, etc.
   - Ajout de `HARD_OMBRE_KEYWORDS` et `HARD_LUMIERE_KEYWORDS` pour la pré-classification

2. **`src/lib/nlp/classifier-enhanced.ts`**
   - `preClassify()` : si mot-clé ombre/lumière fort → retour immédiat (confiance 0.95 / 0.9)
   - Catégories par défaut : ombre → `political_tension`, lumière → `institutional_progress`

3. **`src/lib/classification/classifier.ts`**
   - Lumière par défaut : `cultural_event` → `institutional_progress`

4. **`src/sources/registry.ts`**
   - Événements weather, lbp-rate, openaq exclus des panneaux
   - Ces sources restent uniquement pour les indicateurs du header

---

## Stage 2 — Déduplication

- `deduplicateEvents()` dans le registry
- Clé : `normalizedTitle (80 premiers caractères) + dateYYYYMMDD`
- Priorité des sources : RSS > ReliefWeb > GDELT > Twitter
- Similarité Jaccard > 0.6 sur le même jour → fusion (priorité plus élevée conservée)
- Résultat attendu : ~40–60 événements uniques (vs ~100 avant)

---

## Stage 3 — Refonte des graphiques

### Nouveaux composants (`src/components/charts/`)

1. **SummaryStats** : 4 cartes (Total, Sources, Confiance, Top catégorie)
2. **TimelineChart** : AreaChart 7 jours, bins 6h, minHeight 180px
3. **CategoryBars** : barres horizontales top 5 catégories
4. **SourceBreakdown** : mini-barres par source

### Intégration

- `LumierePanel` et `OmbrePanel` : section graphiques entre carte et liste d’événements
- Layout : SummaryStats → [TimelineChart + CategoryBars] → SourceBreakdown

---

## Stage 4 — CCTV / Live

- `LiveFeedStrip.tsx` supprimé
- `LiveFeedPanel.tsx` : mini-section en haut du panneau Ombre
  - Thumbnail SkylineWebcams Beirut + badge LIVE
  - Clic → ouverture dans un nouvel onglet
  - Lien LBCI YouTube
- Bande centrale retirée de `SplitLayout`

---

## Stage 5 — Cartes d’événements

- Point coloré 6px (vert / rose / gris)
- Ligne 1 : source, catégorie, temps relatif (`relativeTime()`)
- Titre sur 2 lignes max avec ellipsis
- Expand : description, lien, badge de confiance
- Hover : variation légère du fond

---

## Stage 6 — Header

- Indicateurs : LBP, météo Beyrouth, qualité de l’air (AQ)
- Données fournies via `indicators` dans la réponse API
- SourceStatusCompact conservé pour les points de statut

---

## Stage 7 — Vérification

- `npm run build` : OK
- Types : OK
- Lint : OK

---

## Fichiers modifiés / créés

| Fichier | Action |
|---------|--------|
| `keywords.ts` | Réécriture complète |
| `classifier-enhanced.ts` | preClassify, defaults |
| `classifier.ts` | Defaults |
| `registry.ts` | Déduplication, filtrage, indicateurs |
| `route.ts` (api/events) | Retour `indicators` |
| `charts/SummaryStats.tsx` | Créé |
| `charts/TimelineChart.tsx` | Créé |
| `charts/CategoryBars.tsx` | Créé |
| `charts/SourceBreakdown.tsx` | Créé |
| `LiveFeedPanel.tsx` | Créé |
| `LiveFeedStrip.tsx` | Supprimé |
| `LumierePanel.tsx` | Nouveaux graphiques |
| `OmbrePanel.tsx` | LiveFeedPanel + nouveaux graphiques |
| `EventList.tsx` | Temps relatif, hiérarchie |
| `SharedHeader.tsx` | Indicateurs |
| `SplitLayout.tsx` | Suppression du `center` |
| `page.tsx` | Indicateurs, sans `LiveFeedStrip` |
| `relativeTime.ts` | Créé |
| `openaq/normalizer.ts` | `rawData.pm25` pour AQ |

---

## Statut des sources (build)

- weather, cloudflare, usgs, gdacs, lbp-rate, firms, openaq, rss, gdelt, twitter : OK
- reliefweb : 403 (appname non approuvé)
- L’Orient-Le Jour, Daily Star : 403
- MTV Lebanon : 404

---

## Prochaines étapes possibles

- ReliefWeb : demander un appname approuvé
- Flèche de tendance LBP : historique 24h pour ▲ / ▼
- Tests unitaires : classifier, déduplication
- Export CSV

---

## 14. Problèmes persistants — diagnostic et investigation

### A. Graphiques n'apparaissent pas / mal positionnés

**Symptôme** : Les graphiques (TimelineChart, CategoryBars, SourceBreakdown) sont invisibles ou trop petits, section « Graphiques » peu lisible.

**Causes probables** :
- `ResponsiveContainer` de Recharts exige un parent avec dimensions explicites (`width`/`height` > 0) ; en flex `min-w-0`, le parent peut avoir largeur 0 au premier rendu.
- Section graphiques écrasée par la carte (`flex-1`) ou l’event list ; manque de `minHeight`/`minWidth` sur les conteneurs.

**Correctifs tentés** :
- Carte en hauteur fixe 280px pour libérer de l’espace.
- Zone graphiques en `overflow-y-auto` + `flex-1`.
- `min-w-[200px]` sur le conteneur TimelineChart.

**À investiguer** : Comparer avec World Monitor — ils utilisent **D3** et **deck.gl** pour les visualisations, pas Recharts. Leur stack (Vite, Preact) diffère de Next.js ; la stratégie serait d’assurer des dimensions explicites (px) avant tout `ResponsiveContainer`.

---

### B. Carte ne centre pas sur le Liban

**Symptôme** : La carte affiche une vue trop large ou des marqueurs hors Liban (ex. Europe) quand les coordonnées sont erronées.

**Causes probables** :
- Géocodage Twitter/RSS approximatif → coordonnées hors bbox Liban.
- `fitBounds` ou zoom influencés par les marqueurs.
- Pas de contrainte de vue (maxBounds, minZoom).

**Correctifs tentés** :
- `map.fitBounds(LEBANON_BBOX)` avec `padding` et `maxZoom: 10`.
- `setMaxBounds`, `setMinZoom(7)`.
- Filtrage des marqueurs : uniquement ceux dans `LEBANON_BBOX`.

**À investiguer** : World Monitor utilise **deck.gl** + **MapLibre GL** + **globe.gl** (carte 3D WebGL), pas Leaflet. Le centrage se fait via `viewState` et `bounds`. Pour Leaflet, garder `fitBounds` sur le bbox Liban uniquement, sans recalculer selon les marqueurs.

---

### C. CCTV / Live n'apparaît pas directement

**Symptôme** : La zone live est noire ; pas de flux visible à l’écran ; l’embed YouTube ou SkylineWebcams ne s’affiche pas.

**Causes** :
1. **SkylineWebcams** : X-Frame-Options bloque l’embed en iframe → flux non intégrable.
2. **YouTube** : `embed/live_stream?channel=CHANNEL_ID` nécessite que la chaîne soit en direct ; sinon écran noir ou message d’erreur. Il faut le **videoId** en direct, pas seulement le channelId.
3. **LBCI** : Peut ne pas être en direct 24/7.

**Investigation World Monitor** (repo `koala73/worldmonitor`) :

| Aspect | World Monitor | Lebanon Monitor |
|--------|---------------|-----------------|
| **Stack** | Vite, Preact, deck.gl, MapLibre | Next.js, React, Leaflet |
| **Live video** | `live-channels-window.ts`, `LiveNewsPanel` | `LiveFeedPanel.tsx` |
| **YouTube** | API `/api/youtube/embed?videoId=XXX` qui renvoie une page HTML avec YouTube iframe API | iframe direct `youtube.com/embed/live_stream?channel=...` |
| **Sources live** | youtubei.js pour récupérer le videoId live d’une chaîne ; support HLS (.m3u8) | Pas de résolution dynamique du videoId |
| **Embed proxy** | Leur iframe charge `worldmonitor.app/api/youtube/embed?videoId=XXX` → page qui initialise YT.Player avec postMessage | iframe src = youtube.com directement |

**Pistes World Monitor** :
1. **API proxy YouTube** : Route qui retourne du HTML contenant le player YouTube (évite CORS, permet autoplay/mute). Voir `api/youtube/embed.js`.
2. **youtubei.js** : Résout le videoId du stream live à partir d’un channelId avant d’afficher l’embed.
3. **Support HLS** : Flux `.m3u8` (EarthCam, etc.) affichés avec un lecteur HLS (hls.js) — pas d’iframe bloquée.

**Actions recommandées pour Lebanon Monitor** :
- Créer `/api/youtube/embed?videoId=XXX` sur le modèle World Monitor pour un embed contrôlé.
- Utiliser youtubei.js (ou API équivalente) pour obtenir le videoId live de LBCI avant d’ouvrir l’embed.
- Tester des webcams HLS (EarthCam, etc.) si disponibles pour Beyrouth.
- Fallback : garder les liens « Ouvrir en plein écran » pour SkylineWebcams tant qu’il n’y a pas de flux embarquable.

---

### D. Heatmap Leaflet (IndexSizeError)

**Symptôme** : `IndexSizeError: Failed to execute 'getImageData' on 'CanvasRenderingContext2D': The source width is 0` lorsque `leaflet.heat` est ajouté alors que le conteneur a largeur 0.

**Correctif actuel** : `showHeatmap={false}` par défaut ; logique de délai + vérification des dimensions avant ajout (peut encore échouer en layout dynamique).

---

### E. Checklist diagnostic

| Problème | Statut | Prochaine action |
|----------|--------|------------------|
| Graphiques invisibles | À corriger | Vérifier dimensions parent, tester avec hauteur fixe en px |
| Carte pas centrée | Correctifs appliqués | Tester avec événements réels, valider le filtrage bbox |
| CCTV flux noir | En attente | Implémenter API proxy YouTube + youtubei.js pour videoId live |
| Heatmap crash | Désactivé | Réactiver avec ResizeObserver ou délai plus long |

---

### F. Références World Monitor (koala73/worldmonitor)

| Fichier / URL | Usage |
|---------------|-------|
| `api/youtube/embed.js` | Proxy embed YouTube (videoId, autoplay, mute) → HTML avec YT iframe API |
| `src/live-channels-window.ts` | Gestion des chaînes live, parse YouTube URL, support HLS `.m3u8` |
| `src/live-channels-main.ts` | Point d'entrée fenêtre live (Tauri / web) |
| `src/components/LiveNewsPanel` | Composant panel live (référence dans live-channels) |
| `youtubei.js` (npm) | Résolution du videoId live à partir d'un channelId |
| deck.gl, MapLibre, globe.gl | Cartes 3D et couches (vs Leaflet 2D) |
| D3 | Graphiques et visualisations |
