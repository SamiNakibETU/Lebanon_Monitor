# LEBANON MONITOR V4 — CURSOR AGENT BRIEF

> **Ce document REMPLACE TOUS les documents précédents** : AGENT_PROMPT_V2.md, DESIGN_SYSTEM_V2.md, AGENT_BRIEF_V3_AMENDMENT.md, DIAGNOSTIC_FINAL.md
> **Lire AUSSI** : `LEBANON_MONITOR_V4_VISION.md` (architecture + UX) et `LEBANON_MONITOR_V4_SOURCES.md` (143+ sources détaillées)
> **Agent** : Cursor Composer (Claude Opus/Sonnet)
> **Stack** : Next.js 14 App Router · TypeScript strict · Tailwind CSS · PostgreSQL (Railway) · MapLibre GL · D3.js · Claude API
> **Repo** : `https://github.com/SamiNakibETU/Lebanon_Monitor`
> **Live** : `https://lebanonmonitor-production.up.railway.app/`
> **DB** : `shinkansen.proxy.rlwy.net` (PostgreSQL, Railway)

---

## CONTEXT — WHAT EXISTS

Le codebase actuel a :
- 131 tests Vitest qui passent, TypeScript compile, build OK
- 14 source connectors implémentés (GDELT, USGS, FIRMS, RSS, GDACS, ReliefWeb, Weather, Cloudflare, LBP, OpenAQ, Twitter, ACLED, UCDP, Telegram stub)
- `src/core/` : classification (pre-classifier + ensemble), dedup (Jaccard), language detect, gazetteer, taxonomy
- PostgreSQL 20-table schema déployé (raw_ingest, source_item, event, event_observation, event_translation, place, indicator_snapshot, source_health_log, pipeline_run)
- Worker background qui écrit dans la DB (cron via cron-job.org toutes les 5 min → POST /api/admin/ingest)
- 283 events en DB (22 Lumière / 261 Ombre)
- UI split Lumière/Ombre fonctionnelle mais CASSÉE (ne scrolle pas, feed montre 1 event, CCTV en pub YouTube)

**TOUT EST À REFAIRE CÔTÉ UI.** Le backend (worker, DB, pipeline, API routes) est fonctionnel et à conserver. On repart de zéro pour le frontend.

---

## MISSION — WHAT YOU BUILD

Tu construis Lebanon Monitor V4 : un dashboard OSINT éditorial style Norgram pour le Liban. Le concept : une carte hero plein écran avec heatmap Lumière/Ombre qui respire, puis des sections scrollables avec synthèse AI et données enrichies.

**Architecture UX (validée) :**
1. **Hero** : Carte MapLibre plein écran, heatmap bicolore animée, header minimal, seulement la heatmap par défaut
2. **Scroll** : La carte se réduit en mini-carte coin supérieur droit (280×200px)
3. **Section A** : Split Lumière (crème #F5F2EE) / Ombre (noir #0A0A0A) — Synthèse AI Claude + indicateurs + feed condensé
4. **Section B** : Infrastructure (Cloudflare Radar, OpenSky, Port Beyrouth, GPS Jamming)
5. **Section C** : Économie (LBP rate, fuel, AQI, électricité)
6. **Section D** : Géopolitique (ACLED carte, Polymarket, UNIFIL)
7. **Section E** : Lumière (Reconstruction WB/UNDP, agenda culturel, reforestation)
8. **Section F** : Live feeds (2 CCTV max, Telegram condensé)
9. **Langue** : FR/EN/AR avec toggle header

---

## PHASE 0 — NETTOYAGE (Faire en premier)

```
SUPPRIMER :
- Le SplitContainer.tsx actuel (dual split viewport-height)
- Les deux cartes MapLibre séparées (Positron + Dark Matter)
- Les tweet embeds / feed brut qui prend 90% de l'espace
- Le CCTVWidget qui montre des pubs YouTube
- Le PolymarketWidget vide
- Les composants Recharts (ResponsiveContainer cassé)

CONSERVER :
- src/core/ (classification, dedup, gazetteer, taxonomy)
- src/worker/ (pipeline, ingest, classify, translate, indicators, health)
- src/sources/ (tous les fetchers)
- src/app/api/ (toutes les routes API v2)
- src/lib/db.ts (connexion PostgreSQL)
- Toute la logique backend
- Les 131 tests

CONFIGURER :
- Upstash Redis (gratuit) → UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
- Variables Railway si pas encore fait :
  ANTHROPIC_API_KEY=sk-ant-...
  HF_API_TOKEN=hf_...
  TELEGRAM_RSS_URLS=https://rsshub.app/telegram/channel/Lebanon24News,...
```

---

## PHASE 1 — CARTE HERO + HEATMAP

### Fichiers à créer/modifier

```
src/app/page.tsx                    → Refaire complètement — layout vertical scrollable
src/components/hero/HeroMap.tsx      → NOUVEAU — carte plein écran avec heatmap
src/components/hero/MiniMap.tsx      → NOUVEAU — mini-carte sticky coin droit
src/components/layout/Header.tsx     → Simplifier — logo + heure Beyrouth seulement
src/components/map/layers/
  ├── heatmap-lumiere.ts             → NOUVEAU
  ├── heatmap-ombre.ts               → NOUVEAU  
  ├── events-points.ts               → NOUVEAU
  ├── flights-opensky.ts             → NOUVEAU
  ├── infrastructure.ts              → EXISTANT, adapter
  ├── unifil-zone.ts                 → EXISTANT, adapter
  └── gps-jamming.ts                 → NOUVEAU
```

### HeroMap.tsx — Spécifications exactes

```tsx
// CARTE : 100vw × 100vh (moins header 48px)
// Style : CARTO Voyager (https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json)
// Center : [35.5, 33.85] (centre Liban)
// Zoom : 8.2
// maxBounds : [[34.0, 32.8], [37.0, 35.2]]

// HEATMAP LUMIÈRE (vert)
// Source : events avec classification === 'lumiere'
// Couleurs : interpolate linear heatmap-density
//   0 → rgba(0,0,0,0)
//   0.3 → rgba(46,125,50,0.15)     #2E7D32 @ 15%
//   0.6 → rgba(46,125,50,0.35)
//   1.0 → rgba(165,214,167,0.6)    #A5D6A7 @ 60%

// HEATMAP OMBRE (rouge)  
// Source : events avec classification === 'ombre'
// Couleurs : interpolate linear heatmap-density
//   0 → rgba(0,0,0,0)
//   0.3 → rgba(198,40,40,0.15)     #C62828 @ 15%
//   0.6 → rgba(198,40,40,0.35)
//   1.0 → rgba(239,154,154,0.6)    #EF9A9A @ 60%

// ANIMATION : les heatmaps pulsent via opacity oscillation
// CSS : animation: pulse 3s ease-in-out infinite
// @keyframes pulse { 0%,100% { opacity: 0.7 } 50% { opacity: 1.0 } }

// LAYER PILLS en bas à gauche :
// [EVENTS] [FLIGHTS] [SHIPS] [FIRES] [INFRA] [UNIFIL] [JAMMING]
// Tous désactivés par défaut. Style: 10px uppercase, fond transparent, border 1px rgba
// Toggle on/off au clic

// SCROLL BEHAVIOR :
// Quand window.scrollY > 200 :
//   HeroMap se réduit en MiniMap (position: fixed, top: 60px, right: 16px, 280×200px)
//   Transition : all 0.6s cubic-bezier(0.4, 0, 0.2, 1)
//   MiniMap a box-shadow: 0 2px 12px rgba(0,0,0,0.15) — SEUL box-shadow autorisé
//   Clic sur MiniMap → scroll back to top, redevient HeroMap
```

### Header.tsx — Spécifications exactes

```
LB: LEBANON MONITOR                    FR  EN  AR              15:42 EET
─────────────────────────────────────────────────────────────────────────
                    (1px solid rgba(255,255,255,0.06))

- Logo : "LB: LEBANON MONITOR" — 13px, font-weight 500, #FFFFFF
- Language pills : FR EN AR — 11px, color #666, active: #FFF
  PAS de background sur le pill actif. Juste la couleur du texte.
- Clock : heure Beyrouth (EET), 11px, tabular-nums, #666
- Height : 48px
- Background : #000000
- Position : sticky top 0, z-index 50
```

---

## PHASE 2 — SPLIT LUMIÈRE/OMBRE + SYNTHÈSE AI

### Fichiers à créer

```
src/components/sections/SectionLumiereOmbre.tsx   → Split deux colonnes
src/components/sections/AISynthesis.tsx            → Résumé Claude Haiku
src/components/sections/IndicatorStrip.tsx         → Indicateurs par colonne
src/components/sections/CondensedFeed.tsx          → Feed une-ligne-par-event
src/app/api/v2/synthesis/route.ts                  → NOUVEAU endpoint
src/worker/synthesis.ts                            → NOUVEAU — génère synthèse 2x/jour
```

### SectionLumiereOmbre.tsx — Layout

```
┌─────────────────────────────┬─────────────────────────────┐
│        LUMIÈRE               │         OMBRE               │
│   bg: #F5F2EE               │   bg: #0A0A0A               │
│   text: #1A1A1A             │   text: #FFFFFF             │
│                              │                             │
│   [AI SYNTHESIS]             │   [AI SYNTHESIS]            │
│   3-4 phrases, style        │   3-4 phrases, style        │
│   analyste/briefing         │   analyste/briefing         │
│                              │                             │
│   ── divider ──              │   ── divider ──             │
│                              │                             │
│   [INDICATEURS]              │   [INDICATEURS]             │
│   Projets reconstruction:24  │   Incidents 24h: 12        │
│   Events culturels: 8       │   LBP: 89,500 ↗            │
│   Hectares replantés: 47    │   AQI PM2.5: 47 µg/m³      │
│   Confiance éco: ↗          │   GPS Jamming: 72/100       │
│                              │                             │
│   ── divider ──              │   ── divider ──             │
│                              │                             │
│   [FEED CONDENSÉ]            │   [FEED CONDENSÉ]           │
│   14:32 UNDP │ $2.3M eau    │   14:32 ACLED │ Naqoura     │
│   14:15 RSS  │ Festival     │   14:15 FIRMS │ Feu Chouf   │
│   13:58 WB   │ Pont Saida   │   13:58 RSS   │ Coupure EDL │
│                              │                             │
└─────────────────────────────┴─────────────────────────────┘
```

### AI Synthesis — Prompt Claude Haiku

```typescript
// src/worker/synthesis.ts
// Appelé 2x/jour (8h et 20h Beyrouth) via cron

const SYNTHESIS_PROMPT = `Tu es un analyste OSINT qui rédige un briefing quotidien sur le Liban.
À partir des événements ci-dessous, rédige DEUX résumés de 3-4 phrases chacun :

1. LUMIÈRE : les développements positifs (reconstruction, culture, diplomatie réussie, aide arrivée)
2. OMBRE : les développements négatifs (sécurité, crises, tensions, infrastructure défaillante)

Style : factuel, dense, comme un câble diplomatique. Pas de formules creuses.
Inclure des chiffres et noms de lieux quand disponibles.
Langue : français.

Événements des dernières 24h :
{EVENTS_JSON}

Réponds en JSON :
{ "lumiere": "...", "ombre": "...", "generated_at": "ISO8601" }`;
```

### CondensedFeed — Format exact

```
HH:MM  SOURCE  │  Titre condensé (max 60 chars)                Catégorie
─────────────────────────────────────────────────────────────────────────
14:32  ACLED   │  Incident frontière Naqoura                    Sécurité
14:15  UNDP    │  $2.3M débloqués pour eau potable Saïda        Reconstruction  
13:58  FIRMS   │  Feu détecté Chouf (34.52°N, 35.61°E)          Environnement

- Font : "DM Mono", 13px, monospace
- Chaque ligne cliquable → /event/[id]
- Point coloré 4px à gauche de chaque ligne (vert lumière / rouge ombre)
- Divider : 1px solid rgba adaptée au panel
- Hover : background rgba(0,0,0,0.02) (lumière) ou rgba(255,255,255,0.02) (ombre)
```

---

## PHASE 3 — SECTIONS INFRASTRUCTURE + ÉCONOMIE

### Fichiers à créer

```
src/components/sections/SectionInfrastructure.tsx
src/components/widgets/CloudflareWidget.tsx       → Sparkline trafic internet
src/components/widgets/OpenSkyWidget.tsx          → Nb avions + sparkline
src/components/widgets/PortWidget.tsx             → Navires au port
src/components/widgets/JammingWidget.tsx          → Score GPS jamming 0-100
src/components/sections/SectionEconomie.tsx
src/components/widgets/LBPWidget.tsx              → Grand chiffre + sparkline 90j
src/components/widgets/FuelWidget.tsx             → Prix benzin/diesel
src/components/widgets/AirQualityWidget.tsx       → PM2.5 code couleur
src/components/charts/Sparkline.tsx               → Composant D3 réutilisable
src/sources/opensky/fetcher.ts                    → NOUVEAU
src/sources/opensky/types.ts                      → NOUVEAU
```

### Section Infrastructure — Layout

```
Grille 2×2, fond neutre #FAFAFA

┌──────────────────┬──────────────────┐
│ TRAFIC INTERNET  │ ESPACE AÉRIEN    │
│ Cloudflare Radar │ OpenSky Network  │
│ Sparkline 7j     │ 14 avions ↑      │
│ Point rouge si   │ Alerte si nb     │
│ anomalie         │ anormalement bas │
├──────────────────┼──────────────────┤
│ PORT BEYROUTH    │ GPS JAMMING      │
│ 18 navires       │ Score: 72/100    │
│ Dernier fuel:    │ ■■■■■■■□□□       │
│ il y a 2j        │ Sparkline 30j    │
└──────────────────┴──────────────────┘

Chaque widget :
- Label : 11px uppercase #666 tracking 0.08em
- Valeur : 48px font-weight 300
- Sparkline : D3, height 40px, no axes, stroke 1.5px
- Pas de border-radius. Pas de box-shadow. Séparation par 1px gap.
```

### OpenSky API call

```typescript
// Bounding box Lebanon
const LEBANON_BBOX = { lamin: 33.0, lamax: 34.7, lomin: 35.0, lomax: 36.7 };
const url = `https://opensky-network.org/api/states/all?lamin=${LEBANON_BBOX.lamin}&lamax=${LEBANON_BBOX.lamax}&lomin=${LEBANON_BBOX.lomin}&lomax=${LEBANON_BBOX.lomax}`;

// Calculer GPS Jamming Index depuis les données NIC
// NIC < 5 = faible intégrité navigation = probable interférence
// Index = 100 × (avions NIC<5) / total_avions
```

---

## PHASE 4 — SECTIONS GÉOPOLITIQUE + LUMIÈRE

### Fichiers à créer

```
src/components/sections/SectionGeopolitique.tsx
src/components/widgets/ACLEDMiniMap.tsx           → Mini carte incidents 30j
src/components/widgets/PolymarketWidget.tsx       → Fix avec keywords élargis
src/components/widgets/UNIFILWidget.tsx           → Dernier communiqué
src/components/sections/SectionLumiere.tsx
src/components/widgets/ReconstructionWidget.tsx   → Carte projets WB/UNDP
src/components/widgets/CultureWidget.tsx          → Prochains événements
src/components/widgets/ReforestationWidget.tsx    → Hectares replantés
```

### Polymarket Fix — Keywords élargis

```typescript
const GEOPOLITICAL_KEYWORDS = [
  'lebanon', 'hezbollah', 'israel', 'iran', 'ceasefire', 'middle east',
  'war', 'nuclear', 'trump', 'netanyahu', 'sanctions', 'oil', 'attack',
  'bombing', 'invasion', 'syria', 'unifil', 'hamas', 'gaza',
];
// Fallback : si 0 résultats → top 5 contrats géopolitiques par volume
```

---

## PHASE 5 — LIVE + POLISH

### CCTV Fix définitif

```typescript
// 2 flux maximum dans l'UI, tout en bas
// Utiliser /api/youtube/embed (EXISTE DÉJÀ) — pas l'embed brut YouTube

const LIVE_SOURCES = [
  { name: 'Beirut Skyline', type: 'skylinewebcams', alwaysAvailable: true },
  { name: 'Al Jazeera Arabic', type: 'youtube', channelId: '...', alwaysAvailable: true },
  { name: 'LBCI', type: 'youtube', priority: 3 },
  { name: 'France 24 Arabic', type: 'youtube', alwaysAvailable: true },
];

// Proxy URL : /api/youtube/embed?videoId=${id}&autoplay=1&mute=1
```

---

## DESIGN SYSTEM V4 — CURSOR RULES

Copier ce bloc dans `.cursor/rules/design-system.mdc` :

```markdown
---
description: Design system V4 Lebanon Monitor — Norgram editorial OSINT
globs: ["src/components/**", "src/app/**", "*.tsx", "*.css"]
alwaysApply: true
---

# DESIGN SYSTEM V4 — HARD RULES

## BACKGROUNDS
- Page background : #000000 (noir pur, entre les sections)
- Header : #000000
- Section Lumière : #F5F2EE (crème chaud)
- Section Ombre : #0A0A0A (noir)
- Section Infrastructure : #FAFAFA (gris très clair)
- Section Économie : #0A0A0A
- Section Géopolitique : #0A0A0A
- Section Lumière bottom : #F5F2EE
- Mini-carte réduite : fond carte, seul élément avec box-shadow autorisé

## TYPOGRAPHY
- Font : "DM Sans", "Helvetica Neue", sans-serif
- Arabic : "IBM Plex Arabic"
- Mono (feed, data) : "DM Mono", "SF Mono", monospace
- Grands chiffres : 48px, font-weight: 300 (LIGHT, PAS bold)
- Labels : 11px, uppercase, letter-spacing: 0.08em
- Body : 14px, font-weight: 400
- Feed monospace : 13px

## TEXT COLORS
- Lumière actif : #1A1A1A
- Lumière secondaire : #888888
- Ombre actif : #FFFFFF
- Ombre secondaire : #666666
- Accent Lumière : #2E7D32 (vert)
- Accent Ombre : #C62828 (rouge)

## ABSOLUTE INTERDICTIONS
- border-radius > 0 sur conteneurs (TOUT est carré)
- box-shadow (sauf mini-carte réduite)
- gradient backgrounds
- hover:scale ou hover:shadow
- skeleton shimmer loading
- CountUp animations sur chiffres
- Font Inter, Space Grotesk, Plus Jakarta
- Icons Lucide (sauf flèches fonctionnelles)
- rounded-xl, rounded-2xl, rounded-lg
- Emojis dans l'interface
- Cartes avec bordures pour les events (lignes avec dividers seulement)

## HOVER
- Texte : color change #666 → #FFF (ombre) ou #888 → #1A1A1A (lumière)
- Transition : color 0.15s ease
- Events feed : background rgba(0,0,0,0.02) ou rgba(255,255,255,0.02)
- RIEN D'AUTRE.

## SEPARATORS
- Lumière : border-bottom 1px solid #E0DCD7
- Ombre : border-bottom 1px solid rgba(255,255,255,0.04)
- Entre sections : 1px gap montrant le #000000 parent

## CHARTS (D3)
- D3.js UNIQUEMENT, pas Recharts
- Sparklines : stroke 1.5px, no fill, height 40px
- Area charts : flat fill opacity 0.3
- Bars : horizontal, coins carrés, couleur plate
- Axes text : 10px, #666666
- Pas de gridlines (sauf nécessaire → rgba(255,255,255,0.03))
- Sizing via ResizeObserver, PAS ResponsiveContainer

## MAP (MapLibre GL)
- Hero : CARTO Voyager (neutre)
- Markers : circles 5-6px, stroke 1px rgba(255,255,255,0.1)
- Popup : bg #0D0D0D, border-radius 0, padding 12px, font 12px
- Clusters : circle-radius stepped [6, 8, 12, 16] par point_count
```

---

## ENV VARS REQUIRED

```bash
# DB (déjà configuré)
DATABASE_URL=postgresql://...@shinkansen.proxy.rlwy.net:.../railway

# AI (OBLIGATOIRE)
ANTHROPIC_API_KEY=sk-ant-...          # Classification + Synthèse (~$7/mois)
HF_API_TOKEN=hf_...                   # Traduction Opus-MT (gratuit)

# Cache (NOUVEAU)
UPSTASH_REDIS_REST_URL=https://...    # Redis gratuit
UPSTASH_REDIS_REST_TOKEN=...

# Sources (déjà configurés ou à ajouter)
OPENWEATHERMAP_API_KEY=...
OPENAQ_API_KEY=...
ACLED_API_KEY=...
ACLED_EMAIL=...
TELEGRAM_RSS_URLS=https://rsshub.app/telegram/channel/Lebanon24News,...
FIRMS_MAP_KEY=...
CF_API_TOKEN=...                      # Cloudflare Radar

# Cron
INGEST_SECRET=...                     # POST /api/admin/ingest auth
```

---

## FILE STRUCTURE CIBLE

```
src/
├── core/                          # PURE TS — NE PAS TOUCHER
│   ├── classification/
│   ├── deduplication/
│   ├── language/
│   ├── taxonomy/
│   └── __tests__/
│
├── worker/                        # BACKEND — NE PAS TOUCHER (sauf synthesis.ts)
│   ├── index.ts
│   ├── pipeline.ts
│   ├── ingest.ts
│   ├── classify-llm.ts
│   ├── translate.ts
│   ├── geocode.ts
│   ├── indicators.ts
│   ├── health.ts
│   ├── synthesis.ts               # NOUVEAU — synthèse AI 2x/jour
│   └── db.ts
│
├── sources/                       # FETCHERS — AJOUTER opensky/
│   ├── gdelt/ acled/ ucdp/ rss/ twitter/ usgs/ firms/ 
│   ├── gdacs/ reliefweb/ weather/ cloudflare/ lbp/ openaq/ telegram/
│   ├── opensky/                   # NOUVEAU
│   │   ├── fetcher.ts
│   │   └── types.ts
│   └── registry.ts
│
├── components/
│   ├── hero/
│   │   ├── HeroMap.tsx            # Carte plein écran avec heatmap
│   │   └── MiniMap.tsx            # Mini-carte sticky coin droit
│   ├── layout/
│   │   ├── Header.tsx             # Minimal : logo + langue + heure
│   │   └── Footer.tsx
│   ├── sections/
│   │   ├── SectionLumiereOmbre.tsx
│   │   ├── SectionInfrastructure.tsx
│   │   ├── SectionEconomie.tsx
│   │   ├── SectionGeopolitique.tsx
│   │   ├── SectionLumiere.tsx
│   │   └── SectionLive.tsx
│   ├── widgets/
│   │   ├── AISynthesis.tsx
│   │   ├── CondensedFeed.tsx
│   │   ├── IndicatorStrip.tsx
│   │   ├── CloudflareWidget.tsx
│   │   ├── OpenSkyWidget.tsx
│   │   ├── PortWidget.tsx
│   │   ├── JammingWidget.tsx
│   │   ├── LBPWidget.tsx
│   │   ├── FuelWidget.tsx
│   │   ├── AirQualityWidget.tsx
│   │   ├── PolymarketWidget.tsx
│   │   ├── ACLEDMiniMap.tsx
│   │   ├── UNIFILWidget.tsx
│   │   ├── ReconstructionWidget.tsx
│   │   ├── CultureWidget.tsx
│   │   ├── CCTVWidget.tsx
│   │   └── TelegramFeedWidget.tsx
│   ├── charts/
│   │   ├── Sparkline.tsx          # D3 réutilisable
│   │   ├── TimelineChart.tsx
│   │   └── CategoryBars.tsx
│   └── map/
│       └── layers/
│           ├── heatmap-lumiere.ts
│           ├── heatmap-ombre.ts
│           ├── events-points.ts
│           ├── flights-opensky.ts
│           ├── infrastructure.ts
│           ├── unifil-zone.ts
│           └── gps-jamming.ts
│
├── hooks/
│   ├── useScrollPosition.ts       # NOUVEAU — détecte scroll pour mini-carte
│   ├── useContainerSize.ts        # ResizeObserver pour charts
│   ├── useEvents.ts               # SWR → /api/v2/events
│   ├── useIndicators.ts           # SWR → /api/v2/indicators
│   └── useLanguage.ts             # Context FR/EN/AR + RTL
│
├── lib/
│   ├── db.ts
│   ├── redis.ts                   # NOUVEAU — Upstash Redis client
│   └── utils.ts
│
└── app/
    ├── layout.tsx                 # Dark theme, DM Sans font
    ├── page.tsx                   # REFAIRE — layout vertical scrollable
    ├── api/
    │   └── v2/
    │       ├── events/route.ts
    │       ├── indicators/route.ts
    │       ├── synthesis/route.ts  # NOUVEAU
    │       ├── stats/route.ts
    │       ├── clusters/route.ts
    │       ├── health/route.ts
    │       ├── search/route.ts
    │       ├── export/route.ts
    │       ├── polymarket/route.ts
    │       ├── cctv/route.ts
    │       └── proxy/youtube-live/route.ts
    └── event/
        └── [id]/page.tsx
```

---

## VALIDATION CRITERIA

### Tests classification (MUST PASS)
```
classify("Israeli airstrikes target Baalbek") → ombre
classify("Festival de Baalbeck : retour triomphal") → lumiere
classify("Macron tente un cessez-le-feu mais se heurte au refus") → ombre
classify("Accord de cessez-le-feu signé entre les parties") → lumiere
classify("Cessez-le-feu violé : tirs dans le Sud") → ombre
classify("مؤتمر المانحين يتعهد بمليار دولار لإعادة إعمار لبنان") → lumiere
```

### Tests UI
- HeroMap renders plein écran au chargement
- Heatmap visible avec les données existantes
- Scroll → MiniMap apparaît en coin droit
- Section Lumière/Ombre split visible avec synthèse AI
- Feed condensé montre 10+ events par colonne
- Sparklines D3 render à la bonne taille
- Language toggle FR→EN→AR change les titres
- CCTV montre un flux live (jamais écran noir)
- Aucun border-radius > 0 sur les conteneurs
- Aucun box-shadow (sauf mini-carte)

### Tests Performance
- /api/v2/events < 200ms
- Page load Lighthouse > 70
- Aucun appel API externe depuis les routes web (tout depuis DB)

---

## SPRINT ORDER

1. **Phase 0** : Nettoyage — supprimer l'ancien layout, configurer Redis
2. **Phase 1** : HeroMap + heatmap + header + scroll-to-minimap
3. **Phase 2** : Section Lumière/Ombre + synthèse AI + feed condensé
4. **Phase 3** : Sections Infrastructure + Économie + widgets D3
5. **Phase 4** : Sections Géopolitique + Lumière bottom
6. **Phase 5** : CCTV fix + Telegram + polish + responsive + SEO

**Ne commence JAMAIS la phase suivante avant que la précédente soit validée visuellement.**

---

## SUMMARY

Tu construis un dashboard OSINT éditorial pour le Liban. Carte hero plein écran avec heatmap bicolore qui pulse. Scroll vers des sections thématiques avec synthèse AI quotidienne. Split Lumière (crème) / Ombre (noir) pour les données. Esthétique Norgram : DM Sans, coins carrés, zéro décoration, le texte fait le design. 143+ sources de données. Budget : ~$15/mois.

**Référence visuelle** : norgram.co pour le design. World Monitor (github.com/koala73/worldmonitor) pour la densité de données. Lebanon Monitor est au croisement des deux : la profondeur OSINT de World Monitor avec l'élégance éditoriale de Norgram. Et une chose que personne d'autre ne fait : montrer les deux côtés du Liban.

**Ship it.**
