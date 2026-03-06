# Lebanon Monitor — Compte rendu exhaustif du projet

Documentation exhaustive de tout ce qui a été réalisé et de la manière dont cela a été fait.

---

## 1. Vue d'ensemble du projet

**Lebanon Monitor** est un tableau de bord d’intelligence en temps réel pour le Liban. Il agrège des données publiques de multiples sources, les classe en **Lumière** (positif), **Ombre** (négatif) ou **Neutre**, et les affiche sur une carte interactive.

**Stack technique** : Next.js 14 (App Router), TypeScript strict, Tailwind CSS, Leaflet, Recharts, SWR.

---

## 2. Phase 1 — Fondations données

### 2.1 Structure du projet

```
src/
├── types/
│   ├── events.ts      # LebanonEvent, SourceName, EventCategory
│   └── common.ts      # Result<T,E>, SourceError
├── config/
│   └── lebanon.ts     # Bounding box, villes, constantes
├── lib/
│   ├── fetcher.ts     # fetchWithTimeout, retry 5xx
│   ├── logger.ts      # Logging structuré JSON
│   └── classification/
│       ├── keywords.ts    # Mots-clés FR/EN/AR
│       └── classifier.ts  # classifyByKeywords, classifyByTone
├── sources/
│   ├── registry.ts    # fetchAll(), agrégation parallèle
│   ├── gdelt/
│   ├── usgs/
│   ├── firms/
│   ├── rss/
│   ├── gdacs/
│   ├── reliefweb/
│   ├── weather/
│   ├── cloudflare/
│   ├── lbp-rate/
│   ├── openaq/
│   └── twitter/       # Phase 2
└── app/
    ├── layout.tsx
    ├── page.tsx
    ├── globals.css
    └── api/
        ├── events/route.ts
        └── health/route.ts
```

### 2.2 Interface LebanonEvent

Toutes les sources normalisent vers cette interface :

```typescript
interface LebanonEvent {
  id: string;
  source: SourceName;
  title: string;
  description?: string;
  url?: string;
  timestamp: Date;
  latitude: number;
  longitude: number;
  classification: 'lumiere' | 'ombre' | 'neutre';
  confidence: number;
  category: EventCategory;
  severity: Severity;
  rawData?: Record<string, unknown>;
  metadata: {
    fetchedAt: Date;
    ttlSeconds: number;
    sourceReliability: SourceReliability;
  };
}
```

### 2.3 Sources de données (11 au total)

| Source | Rôle | Méthode | Données |
|--------|------|---------|---------|
| **GDELT** | News articles | DOC API JSON | titre, tonalité, URL |
| **USGS** | Séismes | GeoJSON FDSN | magnitude, lieu, coordonnées |
| **FIRMS** | Incendies | NASA VIIRS CSV | latitude, longitude, confiance |
| **RSS** | Médias libanais | rss-parser | 6 flux (L'Orient-Le Jour, NNA, Al Jazeera, etc.) |
| **GDACS** | Catastrophes | GeoJSON | alertes, type, pays |
| **ReliefWeb** | Humanitaire | REST API | rapports, thématiques |
| **Weather** | Météo | OpenWeatherMap | 4 villes (Beirut, Tripoli, Sidon, Baalbek) |
| **Cloudflare** | Pannes internet | Radar API | outages LB, dateRange=7d |
| **LBP Rate** | Taux LBP/USD | Scrape lirarate.org | valeur, évolution |
| **OpenAQ** | Qualité air | API v3 | PM2.5, stations LB |
| **Twitter** | Réseau social | Nitter RSS | profils médias libanais |

### 2.4 Fetcher partagé

**Fichier** : `src/lib/fetcher.ts`

- Timeout configurable (défaut 10 s)
- Retry automatique sur erreurs 5xx (2 tentatives, backoff exponentiel)
- Pas de retry sur 4xx
- Logging : source, durée, status, tentative

### 2.5 Classification Lumière / Ombre

**Fichier** : `src/lib/classification/classifier.ts`

- **classifyByKeywords(text)** : dictionnaires FR/EN/AR → score Lumière vs Ombre → classification + confiance
- **classifyByTone(tone)** : mapping GDELT (tone > 3 → lumière, < -3 → ombre)

**Dictionnaires** : `src/lib/classification/keywords.ts` (getAllLumiereKeywords, getAllOmbreKeywords)

### 2.6 Registry et agrégation

**Fichier** : `src/sources/registry.ts`

- `fetchAll()` : `Promise.allSettled` sur toutes les sources
- Chaque source : `runX(fetchedAt, statuses)` → `LebanonEvent[]`
- Tri par timestamp décroissant
- Retour : `{ events, statuses }` avec `statuses` de type `SourceStatus[]`

### 2.7 API Routes

**GET /api/events**

- Query params (Zod) : `source`, `classification`
- Cache : `s-maxage=300, stale-while-revalidate=600`
- Réponse : `{ events, total, statuses }`
- Sérialisation : `timestamp` et `metadata.fetchedAt` en ISO string

**GET /api/health**

- Appelle `fetchAll()` ou utilise un health check dédié
- Retourne statut par source : ok / error / skipped

---

## 3. Phase 2 — Frontend et design

### 3.1 Choix de design

Références :

- **Norgram.co** : split Lumière / Ombre (clair à gauche, sombre à droite), typo nette, UI très épurée
- **Cursor.com / Linear.app** : UI « barely there », peu de chrome, contenu prioritaire

### 3.2 Tokens CSS (`globals.css`)

```css
:root {
  --light-bg: #f4f4f4;
  --light-fg: #0c0c0c;
  --dark-bg: #0a0a0a;
  --dark-fg: #f5f5f5;
  --dark-muted: #6b6b6b;
  --dark-border: rgba(255,255,255,0.05);
  --lumiere: #3d6b4a;
  --ombre: #7a5163;
  --neutre: #5c5c5c;
}
```

### 3.3 Layout principal (`page.tsx`)

**Structure** :

- Gauche (Lumière) : carte Leaflet + indicateurs live + barre d’événements
- Droite (Ombre) : sidebar ~420 px, fond sombre

**Données** : SWR sur `/api/events`, refresh 60 s.

**Correction SSR** : `EventMap` chargé en `dynamic(..., { ssr: false })` pour éviter `window is not defined` (Leaflet).

### 3.4 Composants créés

| Composant | Rôle |
|-----------|------|
| `EventMap` | Carte Leaflet, CARTO light, marqueurs par classification |
| `DashboardSidebar` | Stats, graphiques, filtres, liste d’événements |
| `StatCard` | Carte de valeur (label, valeur) |
| `ClassificationChart` | Recharts bar chart par classification |
| `EventsBySourceChart` | Barres horizontales par source |
| `EventsOverTimeChart` | Area chart par tranches horaires |
| `CategoryBreakdown` | Barres de progression par catégorie |
| `SourceStatusGrid` | Grille 5×N des statuts des sources |
| `LiveIndicators` | LBP/USD, météo, AQ, dernière mise à jour |
| `EventList` | Liste cliquable, expand pour description + URL |

### 3.5 Labels (`src/lib/labels.ts`)

- `SOURCE_LABELS` : mapping source → libellé
- `CATEGORY_LABELS` : mapping catégorie → libellé

### 3.6 Filtres

- Classification : tous / lumiere / ombre / neutre
- Source : select avec les 11 sources

---

## 4. Phase 2 — Source Twitter

### 4.1 Source TypeScript (`src/sources/twitter/`)

**Fetcher** : Nitter RSS (`https://nitter.net/Handle/rss`)

- Instances : nitter.net, nitter.privacyredirect.com
- Handles : LBCgroup, AlJadeedLive, LBCI_NEWS, mtvlebanon, NNA_Lebanon, Lebanon24, The961, LorientLeJour
- Parsing via `rss-parser`

**Normalizer** : extraction titre, description, URL, timestamp → `LebanonEvent` avec coordonnées par défaut (Beirut).

**Classification** : `classifyByKeywords` sur le texte du tweet.

### 4.2 Script Python (`scrape_twitter.py`)

**Objectif** : scrape X/Twitter via Nitter, sans API officielle.

**Adaptation Liban** :

- `HANDLES` : 10 comptes médias / infos
- `LEBANON_SEARCH_QUERIES` : Lebanon, Liban, لبنان, Beirut, Beyrouth, بيروت
- `LEBANON_HASHTAGS` : #Lebanon, #Liban, #لبنان, etc.

**Modes** :

1. RSS (profils) : flux RSS Nitter
2. HTML (search / hashtag) : BeautifulSoup, fallback urllib → curl_cffi → Playwright
3. Engagement : likes, RT, replies, views (optionnel, lent)

**Commande `--lebanon-full`** :

- Phase 1 : tous les handles
- Phase 2 : 3 requêtes de recherche
- Phase 3 : 3 hashtags
- Dédoublonnage par tweet_id

**Config** : `config/nitter_instances.txt`, `config/nitter_search_instances.txt`

---

## 5. Corrections et ajustements effectués

### 5.1 Erreur Leaflet SSR

- **Problème** : `ReferenceError: window is not defined` à cause de Leaflet côté serveur
- **Solution** : chargement dynamique `dynamic(() => import('@/components/EventMap'), { ssr: false })`

### 5.2 SourceStatusGrid `statuses` undefined

- **Problème** : `TypeError: Cannot read properties of undefined (reading 'map')`
- **Solution** : utiliser `statuses ?? []` ou garantir que le parent passe toujours un tableau

### 5.3 Recharts width/height -1

- **Problème** : `The width(-1) and height(-1) of chart should be greater than 0`
- **Cause** : conteneur avec `ResponsiveContainer` sans dimension minimale
- **Solution** : définir `min-height` / `min-width` sur le conteneur ou utiliser `aspect` dans Recharts

### 5.4 Cloudflare API

- **Problème** : 400 "You must send either range or start & end dates"
- **Solution** : ajout de `dateRange=7d` dans l’URL

### 5.5 OpenAQ

- **Problème** : v1/v2 dépréciés (410 Gone)
- **Solution** : passage à l’API v3 et clé d’API

### 5.6 GDELT

- **Problème** : rate limit 429, réponses non-JSON
- **Solution** : gestion d’erreur avec retour `{ articles: [] }` pour éviter les crashes

### 5.7 GDACS

- **Problème** : 204 No Content
- **Solution** : gestion explicite de 204 et retour d’un tableau vide

---

## 6. État actuel des sources (d’après les logs)

| Source | Statut | Notes |
|--------|--------|-------|
| weather | ok | 4 villes |
| lbp-rate | ok | ~89 700 LBP/USD |
| gdacs | ok | Souvent 204 (pas d’alertes) |
| cloudflare | ok | 0 outages |
| usgs | ok | 0 séismes récents |
| openaq | ok | 0 stations LB dans la réponse actuelle |
| firms | ok | 0 incendies |
| rss | ok | ~30 items (L'Orient 403, MTV 404) |
| twitter | ok | ~70 tweets, 105 événements totaux |
| gdelt | error | 429 rate limit fréquent |
| reliefweb | error | 403 appname non approuvé |

---

## 7. Fichiers clés modifiés ou créés

### Créés

- `src/sources/twitter/*`
- `src/components/SourceStatusGrid.tsx`
- `src/components/EventsBySourceChart.tsx`
- `src/components/EventsOverTimeChart.tsx`
- `src/components/CategoryBreakdown.tsx`
- `src/components/LiveIndicators.tsx`
- `src/lib/labels.ts`
- `config/nitter_instances.txt`
- `config/nitter_search_instances.txt`
- Plans Phase 2 (référence interne)
- `docs/PROJECT_SUMMARY.md` (ce fichier)

### Modifiés

- `src/types/events.ts` : ajout de `'twitter'` dans `SourceName`
- `src/sources/registry.ts` : `runTwitter`, import, `fetchAll`
- `src/app/api/events/route.ts` : paramètre `source` étendu
- `src/components/DashboardSidebar.tsx` : intégration des nouveaux composants, filtres, statuses
- `src/components/EventList.tsx` : détail expandable, URL, catégorie
- `src/app/page.tsx` : SWR, LiveIndicators, passage des statuses
- `src/app/globals.css` : tokens, Leaflet
- `scrape_twitter.py` : handles Liban, `--lebanon-full`, ROOT, config

---

## 8. Dépendances

```
next, react, react-dom
rss-parser, cheerio, zod
leaflet, react-leaflet, @types/leaflet
recharts, swr
```

---

## 9. Variables d’environnement (`.env.local`)

- `FIRMS_MAP_KEY` : NASA FIRMS
- `OWM_API_KEY` : OpenWeatherMap
- `CF_API_TOKEN` : Cloudflare Radar
- `OPENAQ_API_KEY` : OpenAQ v3

---

## 10. Prochaines étapes possibles

- **ReliefWeb** : demander un appname approuvé
- **GDELT** : respecter le rate limit (1 req / 5 s) ou contacter pour quota
- **Recharts** : corriger les warnings de dimensions des chart
- **RSS** : vérifier les URLs L'Orient-Le Jour, MTV
- **Phase 3** : enrichissement (engagement Twitter, dédoublonnage)
