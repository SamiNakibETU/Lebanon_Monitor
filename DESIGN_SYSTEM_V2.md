# LEBANON MONITOR — DESIGN SYSTEM & CURSOR CONFIGURATION

> Ce document REMPLACE la section 2 du AGENT_PROMPT_V2.md.
> Il doit être copié dans `.cursor/rules/design-system.mdc`
> et lu par l'agent AVANT toute implémentation UI.

---

## ANALYSE FORENSIQUE : NORGRAM® (norgram.co)

### Ce qui rend Norgram différent d'un dark dashboard AI

Norgram n'est PAS un dashboard. C'est une mise en page éditoriale. La différence :

**Un dashboard AI** : grille régulière de cartes identiques, bordures visibles, coins arrondis uniformes, labels en UPPERCASE dans chaque carte, gros chiffres centrés, couleurs d'accent saturées, icônes Lucide partout, ombre portée subtile. C'est reconnaissable en 0.2 secondes comme du code généré.

**Norgram** : hiérarchie typographique BRUTALE. Un seul élément domine la page. Le texte fait le travail — pas les bordures, pas les cartes, pas les icônes. Les images sont photographiques, pas des illustrations flat. L'espace négatif est ACTIF (il fait partie de la composition, pas du remplissage). Les interactions sont discrètes : un hover change la couleur d'un lien, pas de scale(1.05) sur une carte entière.

### Anatomie du site Norgram (observation pixel par pixel)

1. **Background** : `#000000` pur. Pas de `#0A0A0A`, pas de `#111`, pas de "near-black". Noir absolu.

2. **Texte** : Deux poids seulement. Le body text est en `#999999` (gris moyen — PAS blanc). Les titres et le texte actif sont en `#FFFFFF`. C'est ce contraste gris/blanc qui crée la hiérarchie, pas des tailles différentes.

3. **Typographie** : Police sans-serif géométrique proche de `Neue Haas Grotesk` / `Helvetica Neue`. PAS Inter. PAS Space Grotesk. Poids: Regular (400) pour le corps, Medium (500) pour les accents. JAMAIS de bold (700) sauf pour les très gros titres éditoriaux.

4. **Tailles** : Le texte courant est PETIT (13-14px). Les méta-informations (dates, catégories) sont encore plus petites (11-12px). Les titres éditoriaux sont ÉNORMES (48-72px). Il n'y a rien entre les deux — pas de 18px, pas de 24px. C'est cette TENSION entre le minuscule et le monumental qui crée l'identité visuelle.

5. **Layout** : PAS de grille de cartes. La page d'accueil de Norgram est un SLIDER pleine largeur avec une image photographique, un titre en bas à gauche, et des métadonnées (type de projet, numéro, année) espacées en ligne. C'est un layout HORIZONTAL, pas une grille de boîtes.

6. **Bordures** : AUCUNE bordure visible sur les éléments. La séparation vient de l'espace et de la couleur. La seule "bordure" est le `border-bottom: 1px solid rgba(255,255,255,0.1)` sur les lignes de navigation horizontales (dividers).

7. **Coins** : `border-radius: 0`. TOUT est carré. Pas de `rounded-xl`, pas de `rounded-2xl`. C'est ce qui distingue immédiatement un design premium d'un design AI. Les coins arrondis sur un fond noir = AI slop instantanément reconnaissable.

8. **Hover** : Au hover, le texte gris (#999) passe à blanc (#FFF). C'est TOUT. Pas de background-change, pas de border-change, pas de scale, pas d'ombre, pas de transition de 300ms. Juste un changement de couleur, instantané ou avec `transition: color 0.2s`.

9. **Images** : Photographiques, pleine largeur ou occupant la majorité de l'espace. Pas de thumbnails dans des petites cartes. Une image = un statement. Background des images: pas de ratio forcé, l'image dicte ses proportions.

10. **Espacement** : Généreux mais ASYMÉTRIQUE. Le padding gauche est plus important que le padding droit. Le bas d'une section a plus d'espace que le haut. Ce n'est pas `p-6` partout — c'est du spacing intentionnel.

---

## TRADUCTION POUR LEBANON MONITOR

Le dashboard de Lebanon Monitor n'est PAS un portfolio d'agence. C'est un outil OSINT. On ne peut pas copier Norgram littéralement. Mais on peut extraire son ADN :

### Principes à respecter ABSOLUMENT

1. **Le texte fait le design.** Pas les bordures, pas les cartes, pas les icônes. La hiérarchie vient des tailles et des couleurs de texte.

2. **Deux couleurs de texte seulement** : `#FFFFFF` pour l'information active, `#666666` pour les labels et métadonnées. PAS de `#888`, pas de `#AAA`. Deux couleurs, point.

3. **Fond noir pur : `#000000`**. Les zones de contenu (map, chart, feed) utilisent `#0D0D0D` pour créer une séparation SANS bordure visible.

4. **Zéro bordure visible.** La séparation entre les zones se fait par l'espace ET par la très légère différence de fond (`#000` vs `#0D0D0D`). Si une ligne est absolument nécessaire (header), elle est `1px solid rgba(255,255,255,0.06)`.

5. **Coins carrés : `border-radius: 0`** sur les cartes/conteneurs. Seuls les badges de source et les pills du language selector ont un radius (`border-radius: 2px` pour les badges, `9999px` pour les pills).

6. **Pas de cartes.** Le dashboard n'est pas une grille de boîtes. C'est une PAGE avec des ZONES. Chaque zone est séparée par l'espace, pas par un conteneur avec bordure et padding.

7. **Typographie à deux extrêmes.** Les gros chiffres (nombre d'events, LBP rate) sont en `font-size: 48px; font-weight: 300` (léger, pas bold). Les labels sont en `font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #666`.

8. **Classification par couleur MINIMALE.** Un petit point (`width: 6px; height: 6px; border-radius: 50%`) devant le titre de l'event. Rouge `#E53935` pour ombre, vert `#43A047` pour lumière. PAS de backgrounds colorés, pas de bordures colorées, pas de gradients.

9. **Animations quasi-inexistantes.** Pas de CountUp sur les chiffres. Pas de fade-in staggered. Pas de pulse sur les marqueurs. La seule animation acceptable : le hover sur le texte (color transition 0.15s).

---

## ANTI-PATTERNS — CE QUE L'AGENT NE DOIT JAMAIS FAIRE

### Liste exhaustive des patterns AI slop interdits

```
❌ INTERDIT : border border-white/[0.06] rounded-2xl
   → Supprime le border ET le rounded. Utilise background-color différent.

❌ INTERDIT : bg-[#141414] avec rounded-xl et hover:shadow-xl
   → C'est le pattern exact de 100% des dashboards AI. Supprime.

❌ INTERDIT : Labels "EVENTS TODAY" "SOURCES" "CATEGORIES" en uppercase bold dans un cadre
   → Le label est en 11px uppercase #666, SANS cadre autour.

❌ INTERDIT : Un gros chiffre centré dans une carte carrée ("247" au milieu d'un rectangle)
   → Le chiffre est aligné à gauche, en 48px font-weight:300, avec le label juste en dessous.

❌ INTERDIT : Icônes Lucide devant chaque titre ou dans chaque carte
   → AUCUNE icône. Le texte suffit. Exception : un point coloré pour la classification.

❌ INTERDIT : Grille uniforme grid-cols-4 auto-rows-[180px]
   → Les zones ont des tailles DIFFÉRENTES. La map prend 60% de la largeur.
     Le feed prend toute la largeur. Les stats sont petites.

❌ INTERDIT : hover:scale-[1.02] ou hover:border-white/[0.12]
   → Hover = changement de couleur du texte uniquement.

❌ INTERDIT : Gradients sur les jauges, charts ou backgrounds
   → Les charts sont en couleur plate (fill uni). Pas de gradient.

❌ INTERDIT : Ombre portée (box-shadow) sur quoi que ce soit
   → AUCUN box-shadow nulle part. Norgram n'en utilise aucun.

❌ INTERDIT : border-radius > 4px sur les conteneurs
   → 0px sur les zones principales. 2px max sur les petits badges.

❌ INTERDIT : Plus de 2 niveaux de gris entre #000 et #FFF
   → Fond: #000000. Zone de contenu: #0D0D0D. Texte actif: #FFFFFF. Label: #666666. C'est TOUT.

❌ INTERDIT : Font-family Inter, Space Grotesk, Plus Jakarta Sans
   → Utiliser Söhne (si licence), ou ABC Diatype, ou Suisse Int'l.
   → Fallback accessible GRATUIT : "Helvetica Neue", Helvetica, Arial, sans-serif.
   → Alternative Google Fonts : "DM Sans" (géométrique, propre, pas surutilisé).

❌ INTERDIT : Padding identique partout (p-4, p-6)
   → Le padding est CONTEXTUEL. Le header a padding: 16px 24px. Le feed a padding: 0. La map a padding: 0. Les stats ont padding: 24px 0.

❌ INTERDIT : Toast notifications avec icône et background coloré
   → Une notification = une ligne de texte rouge en haut du feed. Pas de composant toast.

❌ INTERDIT : Skeleton loading avec shimmer animation
   → Un état vide affiche simplement "—" ou "0" en gris. Pas de skeleton.

❌ INTERDIT : "0 events" dans un grand cercle ou une grande carte vide
   → "0" en 48px light avec "events" en 11px gris en dessous. Pas de conteneur.
```

---

## LAYOUT — STRUCTURE DE LA PAGE

### La page est UNE seule colonne avec des zones à largeurs variables

Ce n'est PAS une grille bento. C'est un layout éditorial vertical avec des rangées.

```
┌──────────────────────────────────────────────────────────────────────┐
│ HEADER                                                     h: 48px  │
│ LB · LEBANON MONITOR   FR EN AR        LBP 89,500   18°C   15:42  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ PREMIÈRE RANGÉE — Statistics strip                         h: 80px  │
│                                                                      │
│ 247              67%              12             ACLED · GDELT ·...  │
│ events today     ombre            sources        dernière MAJ 2min  │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ DEUXIÈME RANGÉE — Main content                             h: 480px │
│                                                                      │
│ ┌────────────────────────────┐ ┌──────────────────────────────────┐ │
│ │                            │ │                                  │ │
│ │   MAP (MapLibre GL)        │ │   EVENT FEED                    │ │
│ │   60% width               │ │   40% width                     │ │
│ │   Full height             │ │   Scrollable                    │ │
│ │   Dark tiles              │ │   Event cards                   │ │
│ │   No border, no radius    │ │   No cards — just lines         │ │
│ │                            │ │                                  │ │
│ │                            │ │ ● Frappe sur le Sud-Liban       │ │
│ │                            │ │   ACLED · il y a 23 min         │ │
│ │                            │ │ ─────────────────────────────── │ │
│ │                            │ │ ● Festival de Baalbeck          │ │
│ │                            │ │   RSS · il y a 1h               │ │
│ │                            │ │ ─────────────────────────────── │ │
│ │                            │ │                                  │ │
│ └────────────────────────────┘ └──────────────────────────────────┘ │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ TROISIÈME RANGÉE — Charts strip                            h: 240px │
│                                                                      │
│ ┌──────────────────┐ ┌──────────────────┐ ┌────────────────────────┐│
│ │ TIMELINE         │ │ CATEGORIES       │ │ LIVE                   ││
│ │ D3 area chart    │ │ D3 horiz bars    │ │ Al Jadeed / LBCI       ││
│ │ 40% width       │ │ 30% width       │ │ 30% width             ││
│ │                  │ │                  │ │                        ││
│ └──────────────────┘ └──────────────────┘ └────────────────────────┘│
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ QUATRIÈME RANGÉE — Secondary data                          h: 200px │
│                                                                      │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐│
│ │ LBP TREND    │ │ SOURCES      │ │ TRENDING     │ │ AIR QUALITY  ││
│ │ sparkline    │ │ list + dots  │ │ top 3 topics │ │ value + bar  ││
│ │ 25% width    │ │ 25% width    │ │ 25% width    │ │ 25% width    ││
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘│
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ FOOTER                                                      h: 32px │
│ Sources: GDELT · ACLED · USGS · NASA · ReliefWeb — MAJ il y a 2min │
└──────────────────────────────────────────────────────────────────────┘
```

### CSS Grid Implementation

```css
/* PAS auto-rows-[180px]. Des hauteurs EXPLICITES et DIFFÉRENTES. */

.dashboard {
  display: grid;
  grid-template-rows: 48px 80px 480px 240px 200px 32px;
  grid-template-columns: 1fr;
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  background: #000000;
  color: #FFFFFF;
  font-family: "DM Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
}

.main-content {
  display: grid;
  grid-template-columns: 3fr 2fr; /* 60/40 split — NOT 50/50 */
  gap: 1px; /* 1px gap crée une ligne de séparation naturelle via le bg #000 parent */
}

.charts-strip {
  display: grid;
  grid-template-columns: 2fr 1.5fr 1.5fr; /* 40/30/30 — ASYMÉTRIQUE */
  gap: 1px;
}

.secondary-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
}
```

---

## COMPOSANTS — SPÉCIFICATIONS EXACTES

### Header

```css
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 48px;
  background: #000000;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 13px;
}

.header__logo {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: #FFFFFF;
}

.header__lang-selector {
  display: flex;
  gap: 0;
}

.header__lang-pill {
  padding: 4px 10px;
  font-size: 11px;
  letter-spacing: 0.04em;
  color: #666666;
  cursor: pointer;
  transition: color 0.15s;
}

.header__lang-pill:hover,
.header__lang-pill--active {
  color: #FFFFFF;
}

/* PAS de background sur le pill actif. Juste la couleur du texte. */

.header__meta {
  font-size: 11px;
  color: #666666;
  font-variant-numeric: tabular-nums;
}
```

### Statistics Strip

```css
.stats-strip {
  display: flex;
  align-items: baseline;
  padding: 24px 24px 16px;
  gap: 64px; /* Large gap entre les stats */
}

.stat__value {
  font-size: 48px;
  font-weight: 300; /* LIGHT, pas bold */
  line-height: 1;
  color: #FFFFFF;
  font-variant-numeric: tabular-nums;
}

.stat__label {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #666666;
  margin-top: 4px;
}

/* PAS de conteneur autour de chaque stat. Pas de carte. Pas de background.
   Juste le chiffre et le label, alignés sur la baseline. */
```

### Event Feed

Le feed n'est PAS une liste de cartes. C'est une liste de LIGNES séparées par des dividers.

```css
.event-feed {
  overflow-y: auto;
  padding: 0;
  background: #0D0D0D;
}

.event-item {
  padding: 16px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  cursor: pointer;
  transition: background-color 0.15s;
}

.event-item:hover {
  background-color: rgba(255, 255, 255, 0.02);
  /* PAS de scale, PAS de border-change, PAS de shadow */
}

.event-item__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.event-item__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.event-item__dot--ombre { background: #E53935; }
.event-item__dot--lumiere { background: #43A047; }
.event-item__dot--neutre { background: #666666; }

.event-item__category {
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #666666;
}

.event-item__source {
  font-size: 11px;
  color: #666666;
}

.event-item__time {
  font-size: 11px;
  color: #666666;
  margin-left: auto;
}

.event-item__title {
  font-size: 14px;
  font-weight: 400;
  color: #FFFFFF;
  line-height: 1.4;
  /* PAS de bold. Regular weight. Le texte blanc sur fond noir est déjà suffisamment lisible. */
}

.event-item__translation {
  font-size: 13px;
  color: #666666;
  margin-top: 4px;
  line-height: 1.4;
}
```

### Charts

Les charts sont en couleur PLATE. Pas de gradient, pas de glow.

```css
/* Timeline area chart */
.chart-area--ombre {
  fill: #E53935;
  fill-opacity: 0.3;
}

.chart-area--lumiere {
  fill: #43A047;
  fill-opacity: 0.3;
}

.chart-line--ombre {
  stroke: #E53935;
  stroke-width: 1.5;
  fill: none;
}

.chart-line--lumiere {
  stroke: #43A047;
  stroke-width: 1.5;
  fill: none;
}

/* Axes */
.chart-axis text {
  font-size: 10px;
  fill: #666666;
  font-family: inherit;
}

.chart-axis line,
.chart-axis path {
  stroke: rgba(255, 255, 255, 0.06);
}

/* Pas de gridlines horizontales sauf si absolument nécessaire.
   Si oui: stroke: rgba(255,255,255,0.03) */

/* Category bars: horizontal, sortées par count, couleur unie */
.bar--ombre { fill: #E53935; }
.bar--lumiere { fill: #43A047; }
.bar--neutre { fill: #444444; }

/* PAS de border-radius sur les bars. Coins carrés. */
```

### Map

```css
.map-container {
  width: 100%;
  height: 100%;
  background: #0D0D0D;
  /* PAS de border. PAS de radius. Le map remplit toute sa zone. */
}

/* Utiliser les tuiles CARTO Dark Matter No Labels
   URL: https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json
   Les labels de villes seront ajoutés manuellement en overlay pour contrôler la typo.
   OU utiliser dark-matter-gl-style avec labels par défaut si le contrôle typo n'est pas faisable.
*/
```

### CCTV Widget

```css
.cctv {
  background: #0D0D0D;
  position: relative;
  overflow: hidden;
}

.cctv__video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cctv__overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background: linear-gradient(transparent, rgba(0,0,0,0.8));
  /* SEUL gradient autorisé : celui qui assure la lisibilité du texte sur la vidéo */
}

.cctv__live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #E53935;
  /* Animation pulse UNIQUEMENT sur ce dot */
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.cctv__source-name {
  font-size: 11px;
  color: #FFFFFF;
  letter-spacing: 0.04em;
}
```

---

## CURSOR RULE FILE — `.cursor/rules/design-system.mdc`

```markdown
---
description: Design system rules for Lebanon Monitor V2. Read this BEFORE any UI implementation.
globs: ["src/components/**", "src/app/**", "*.tsx", "*.css"]
alwaysApply: true
---

# DESIGN SYSTEM — HARD RULES

You are implementing a dark editorial OSINT dashboard inspired by Norgram® (norgram.co).
This is NOT a generic dark dashboard. It is an editorial, typographic, minimal interface.

## MANDATORY

- Background: `#000000` (pure black). Content zones: `#0D0D0D`.
- Text: `#FFFFFF` for active content. `#666666` for labels/meta. NO other grays.
- Font: `"DM Sans", "Helvetica Neue", Helvetica, Arial, sans-serif`. For Arabic: `"IBM Plex Arabic"`.
- Big numbers: `font-size: 48px; font-weight: 300` (light, NOT bold).
- Labels: `font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #666666`.
- Body text: `font-size: 14px; font-weight: 400; color: #FFFFFF`.
- Classification colors: ombre `#E53935`, lumière `#43A047`. Used ONLY for 6px dots and chart fills.
- Hover: text color changes from #666 to #FFF. NO other hover effect.
- Transitions: `transition: color 0.15s` only. NO `transition: all`.
- Separators: `border-bottom: 1px solid rgba(255,255,255,0.04)` between items.

## FORBIDDEN (WILL BE REJECTED)

- `border-radius` > 4px on any container (cards, zones, panels)
- `box-shadow` on any element
- `border` visible on cards or content zones
- `bg-[#141414]` or any "near-black" that isn't #000 or #0D0D0D
- `hover:scale` or `hover:shadow` or `hover:border-color-change`
- Gradient backgrounds or gradient fills on charts (flat colors only)
- Icons from Lucide/Heroicons (exception: a single arrow icon if semantically needed)
- `rounded-xl`, `rounded-2xl`, `rounded-lg` on containers
- Font Inter, Space Grotesk, Plus Jakarta Sans, Outfit
- Skeleton shimmer loading states
- Toast notification components with colored backgrounds
- `auto-rows-[180px]` uniform grids — each row has a SPECIFIC height
- Cards with equal padding on all sides — padding is CONTEXTUAL
- More than 2 font weights (300 for big numbers, 400 for everything else, 500 for logo only)
- Colored backgrounds for classification (no red/green cards)
- CountUp animations on numbers
- Staggered fade-in animations

## EVENT FEED

Events are listed as LINES separated by 1px borders, NOT as cards.
Each event shows: colored dot (6px) · category (11px uppercase #666) · source · time (right-aligned) on the first line.
Title on the second line (14px #FFF).
Translation on the third line (13px #666, optional).
Hover: background changes to rgba(255,255,255,0.02). Nothing else.

## CHARTS (D3)

- Use D3.js, NOT Recharts.
- Area charts: flat fill with opacity 0.3. Line stroke 1.5px.
- Bar charts: horizontal, sorted descending. No border-radius on bars.
- Axes text: 10px, #666666.
- No gridlines unless absolutely necessary (then: rgba(255,255,255,0.03)).
- Chart sizing: use ResizeObserver hook, NOT Recharts ResponsiveContainer.

## MAP (MapLibre GL)

- Tile style: CARTO Dark Matter (https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json)
- Marker style: circles, 6px radius, colored by classification. stroke: 1px rgba(255,255,255,0.1).
- Popup: bg #0D0D0D, no border-radius, padding 12px, font-size 12px.
- No fancy clustering animations. Simple circle clusters with count.

## LAYOUT

The page is NOT a bento grid. It is vertical rows with different heights:
- Row 1: Stats strip (80px)
- Row 2: Map (60%) + Event Feed (40%) — 480px height
- Row 3: Charts strip (240px) — 40%/30%/30% columns
- Row 4: Secondary data strip (200px) — 4 equal columns
Each zone's background is #0D0D0D. The 1px gap between zones shows the #000 parent = natural divider.
```

---

## POLICES RECOMMANDÉES

### Option 1 : DM Sans (Google Fonts — gratuit)
```html
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Arabic:wght@300;400&display=swap" rel="stylesheet">
```
DM Sans est géométrique, propre, et PAS surutilisé par les AI (contrairement à Inter/Space Grotesk).

### Option 2 : Instrument Sans (Google Fonts — gratuit, plus éditorial)
```html
<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&display=swap" rel="stylesheet">
```

### Option 3 (premium) : Söhne (Klim Type Foundry)
C'est la police utilisée par Stripe, Linear, et OpenAI. Licence payante.
Fallback CSS : `"Söhne", "Helvetica Neue", Helvetica, sans-serif`

### Pour les données chiffrées
Utiliser `font-variant-numeric: tabular-nums` pour aligner les colonnes de chiffres.
```css
.data-value {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum";
}
```

---

## DONNÉES MOCK POUR L'AGENT

L'agent DOIT utiliser ces données pour construire l'UI. PAS de "No data", "0 events", "Loading...".

```json
{
  "stats": {
    "eventsToday": 247,
    "ombreRatio": 67,
    "activeSources": 12,
    "lastUpdate": "il y a 2 min"
  },
  "indicators": {
    "lbpRate": 89500,
    "lbpTrend": "down",
    "temperature": 18,
    "aqi": 42
  },
  "events": [
    {
      "id": 1,
      "classification": "ombre",
      "category": "Sécurité",
      "source": "ACLED",
      "time": "il y a 23 min",
      "title": "فوج إسرائيلي يقصف مواقع في الضاحية الجنوبية",
      "translation": "Forces israéliennes frappent des positions dans la banlieue sud"
    },
    {
      "id": 2,
      "classification": "lumiere",
      "category": "Culture",
      "source": "RSS",
      "time": "il y a 1h",
      "title": "Festival de Baalbeck : retour triomphal de la musique classique",
      "translation": null
    },
    {
      "id": 3,
      "classification": "ombre",
      "category": "Politique",
      "source": "Telegram",
      "time": "il y a 1h 30",
      "title": "Salam dénonce les violations du cessez-le-feu au Sud-Liban",
      "translation": "Salam condemns ceasefire violations in southern Lebanon"
    },
    {
      "id": 4,
      "classification": "neutre",
      "category": "Économie",
      "source": "GDELT",
      "time": "il y a 2h",
      "title": "Réunion du FMI sur la restructuration bancaire libanaise",
      "translation": "IMF meeting on Lebanese banking restructuring"
    },
    {
      "id": 5,
      "classification": "ombre",
      "category": "Humanitaire",
      "source": "ReliefWeb",
      "time": "il y a 3h",
      "title": "UNHCR: 12,000 déplacés supplémentaires dans la Bekaa",
      "translation": "UNHCR: 12,000 additional displaced in Bekaa valley"
    },
    {
      "id": 6,
      "classification": "lumiere",
      "category": "Reconstruction",
      "source": "Telegram",
      "time": "il y a 4h",
      "title": "مؤتمر المانحين يتعهد بمليار دولار لإعادة إعمار لبنان",
      "translation": "Conférence des donateurs : 1 milliard $ pour la reconstruction"
    },
    {
      "id": 7,
      "classification": "ombre",
      "category": "Sécurité",
      "source": "UCDP",
      "time": "il y a 5h",
      "title": "Three killed in exchange of fire near Khiam",
      "translation": "Trois tués dans un échange de tirs près de Khiam"
    },
    {
      "id": 8,
      "classification": "neutre",
      "category": "Politique",
      "source": "Twitter",
      "time": "il y a 6h",
      "title": "Nawaf Salam rencontre l'envoyé spécial français pour le Liban",
      "translation": null
    }
  ],
  "trending": [
    { "topic": "Frappes sur le Sud-Liban", "count": 34 },
    { "topic": "Conférence des donateurs", "count": 18 },
    { "topic": "Cessez-le-feu", "count": 15 }
  ],
  "categories": [
    { "name": "Sécurité", "count": 89, "classification": "ombre" },
    { "name": "Politique", "count": 54, "classification": "neutre" },
    { "name": "Humanitaire", "count": 38, "classification": "ombre" },
    { "name": "Économie", "count": 27, "classification": "neutre" },
    { "name": "Culture", "count": 21, "classification": "lumiere" },
    { "name": "Reconstruction", "count": 18, "classification": "lumiere" }
  ],
  "sources": [
    { "name": "GDELT", "count": 87, "status": "ok" },
    { "name": "ACLED", "count": 34, "status": "ok" },
    { "name": "Telegram", "count": 45, "status": "ok" },
    { "name": "RSS", "count": 32, "status": "ok" },
    { "name": "Twitter", "count": 28, "status": "degraded" },
    { "name": "ReliefWeb", "count": 12, "status": "ok" },
    { "name": "USGS", "count": 3, "status": "ok" },
    { "name": "NASA FIRMS", "count": 6, "status": "ok" }
  ]
}
```

---

## PROCESSUS DE DÉVELOPPEMENT

### Étape 1 : Implémenter le layout vide
Construire la structure CSS grid avec les zones exactes. Background #000, zones #0D0D0D. AUCUN composant dedans encore. Juste la structure + le header + le footer.

### Étape 2 : Header + Stats strip
Implémenter le header avec les données mock. Stats avec les gros chiffres (48px, fw 300).

### Étape 3 : Event Feed
Implémenter la liste d'events avec les données mock. Ligne par ligne, pas carte par carte.

### Étape 4 : Map
MapLibre GL avec tuiles CARTO dark. Markers colorés.

### Étape 5 : Charts (D3)
Timeline + Category bars. Un composant à la fois.

### Étape 6 : CCTV + Secondary strip
Intégrer le widget CCTV + LBP sparkline + sources + trending.

### À chaque étape : vérifier contre les anti-patterns.
Si un élément a du border-radius > 4px → corriger immédiatement.
Si une hover ajoute du scale ou du shadow → supprimer immédiatement.
Si un label n'est pas en 11px uppercase #666 → corriger immédiatement.

---

## RÉFÉRENCES VISUELLES POUR L'AGENT

Ajouter ces screenshots dans `.cursor/images/` si possible, sinon inclure les URLs dans le prompt :

1. **Norgram portfolio** : https://www.norgram.co/ — observer le fond noir pur, la typographie, l'absence de bordures
2. **Bloomberg Terminal** : pour la densité d'information sur fond noir
3. **Linear app** : pour les listes d'items sur fond noir sans cartes
4. **Stripe Dashboard** : pour les chiffres en grand format light weight
5. **Wealthsimple** : pour les sparklines et indicateurs financiers minimaux

---

## RÉSUMÉ EN UNE PHRASE

**Le dashboard Lebanon Monitor est une page noire avec du texte blanc et gris, des chiffres énormes en font-weight 300, des listes séparées par des lignes de 1px, une carte sans bordure, et AUCUN élément décoratif superflu.**
