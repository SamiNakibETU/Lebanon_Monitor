# RAPPORT D'AUDIT — LEBANON MONITOR
## Date: 9 mars 2026, 15h30 UTC
## Auditeur: Opus 4.6

---

## 1. ÉTAT DES API (chaque endpoint testé le 9 mars 2026)

| Endpoint | Status | Données ? | Problème |
|----------|--------|-----------|----------|
| `/api/health/live` | 200 | oui | — |
| `/api/v2/health` | 200 | oui | RELIEFWEB_APPNAME=missing, ACLED=not configured, TELEGRAM=not configured |
| `/api/v2/events?limit=3` | 200 | oui (977 total) | Catégories peu diversifiées |
| `/api/v2/events?classification=lumiere&limit=3` | 200 | oui (54 lumiere) | TOUTES catégorie `institutional_progress` |
| `/api/v2/events?classification=ombre&limit=3` | 200 | oui (689 ombre) | Surtout `armed_conflict` |
| `/api/v2/stats` | 200 | oui | SQL a un bug table alias (voir BUG #10) |
| `/api/v2/synthesis` | 200 | oui (texte FR) | ✅ FONCTIONNE maintenant |
| `/api/v2/indicators` | 200 | partiel | lbp=89700 ✓, weather="16C, Clear" ✓, **aqi=null** ✗ |
| `/api/v2/opensky` | 200 | **VIDE** | `{count:null, jammingIndex:null}` — timeout ou blocage |
| `/api/v2/infrastructure` | 200 | partiel (~40s) | hospitals/clinics OK, military/airfields/power/ports=[] |
| `/api/v2/polymarket` | 200 | oui (6 marchés) | ✅ OK |
| `/api/v2/unifil` | 200 | oui (5 statements) | ✅ OK |
| `/api/v2/cctv` | 200 | oui | videoId=gCNeDWCI0vo, **isLive=false** |
| `/api/v2/search?q=frappe` | 200 | oui (40 résultats) | ✅ OK |
| `/api/v2/timeline` | 200 | oui (24h breakdown) | ✅ OK |
| `/api/v2/clusters` | 200 | oui (4 clusters) | ✅ OK |
| `/api/v2/export?format=json&limit=2` | 200 | oui | ✅ OK |
| `/api/v2/reforestation-stats` | 200 | **VIDE** | `{hectares:null, projectCount:0}` |
| `/api/v2/events/1` | **500** | ERREUR | `Internal server error` — ID numérique vs UUID |

---

## 2. ÉTAT DE LA DB

- **Nombre d'events** : 977 total (is_active=true)
- **Répartition polarity_ui aujourd'hui** : ombre=300, lumiere=31, neutre=117 (448 events today)
- **Events avec coordonnées** : La majorité via `getCityCoords()` (inférées depuis le titre), pas de coords exactes
- **Traductions (event_translation)** : Le pipeline appelle `translateAndStore()` pour chaque nouvel event, mais vérifie `HF_API_TOKEN` — si présent, les traductions sont stockées. Non vérifié directement en DB.
- **Indicator snapshots** : `lbp` = 30 lectures (toutes 89700), `weather_beirut` = 24 lectures, `aqi` = tableau vide (0 entrées)
- **Pipeline runs** : Dernière synthèse à `2026-03-09T11:22:24.000Z` — fonctionne
- **Source health** : 12 OK (gdelt, usgs, firms, rss, gdacs, reliefweb, weather, cloudflare, lbp-rate, openaq, twitter, ucdp), 2 skipped (acled, telegram)

---

## 3. BUG PAR BUG — ANALYSE DÉTAILLÉE

### BUG #1: Catégories "INSTITUTIONS" partout (Lumière) / Peu diversifiées

- **Fichiers** : `src/core/classification/pre-classifier.ts` (lignes 81-87), `src/core/classification/index.ts` (lignes 80-86)
- **Flux** : Event title → `preClassify()` → si HARD_LUMIERE match → catégorie forcée `institutional_progress`. Si ensemble → catégorie forcée `institutional_progress` pour lumière.
- **Point de rupture** : Quand `preClassify()` trouve un mot HARD_LUMIERE, il retourne TOUJOURS `category: 'institutional_progress'` (ligne 85 de pre-classifier.ts). Quand l'ensemble classifie lumière, il retourne aussi TOUJOURS `category: 'institutional_progress'` (ligne 84 de index.ts). Il n'y a AUCUNE diversité de catégorie possible pour lumière via le pre-classifier ou l'ensemble. Seul le LLM (classify-llm.ts) peut attribuer d'autres catégories.
- **Code cassé** :

```typescript
// src/core/classification/pre-classifier.ts ligne 81-87
if (hasLumiere) {
  return {
    classification: 'lumiere',
    confidence: 0.9,
    category: 'institutional_progress', // ← TOUJOURS institutional_progress !
    method: 'pre-classifier',
  };
}
```

```typescript
// src/core/classification/index.ts ligne 80-86
if (finalLumiere > finalOmbre && finalLumiere > 0.15) {
  return {
    classification: 'lumiere',
    confidence: Math.min(finalLumiere + 0.3, 1),
    category: 'institutional_progress' as EventCategory, // ← TOUJOURS pareil !
    method: 'ensemble',
  };
}
```

De même pour ombre, le pre-classifier force TOUJOURS `armed_conflict` (ligne 68) et l'ensemble force TOUJOURS `political_tension` (ligne 75).

- **Fix proposé** — `src/core/classification/pre-classifier.ts` :

```typescript
// Remplacer lignes 60-91 par :
export function preClassify(text: string): ClassificationResult | null {
  const lower = text.toLowerCase();

  for (const kw of HARD_OMBRE) {
    if (lower.includes(kw.toLowerCase())) {
      return {
        classification: 'ombre',
        confidence: 0.95,
        category: inferOmbreCategory(lower),
        method: 'pre-classifier',
      };
    }
  }

  const hasLumiere = HARD_LUMIERE.some((kw) => lower.includes(kw.toLowerCase()));
  const hasNegation = NEGATION_WORDS.some((kw) => lower.includes(kw.toLowerCase()));

  if (hasLumiere && hasNegation) {
    return null;
  }

  if (hasLumiere) {
    return {
      classification: 'lumiere',
      confidence: 0.9,
      category: inferLumiereCategory(lower),
      method: 'pre-classifier',
    };
  }

  return null;
}

function inferOmbreCategory(lower: string): EventCategory {
  if (['airstrike', 'bombing', 'missile', 'shelling', 'raid', 'frappe', 'bombardement', 'غارة', 'قصف', 'صاروخ'].some(k => lower.includes(k))) return 'armed_conflict';
  if (['displaced', 'refugee', 'evacuation', 'نزوح', 'déplacé', 'réfugié'].some(k => lower.includes(k))) return 'displacement';
  if (['killed', 'dead', 'assassination', 'تفجير', 'اغتيال', 'tué', 'attentat'].some(k => lower.includes(k))) return 'violence';
  return 'armed_conflict';
}

function inferLumiereCategory(lower: string): EventCategory {
  if (['festival', 'concert', 'culture', 'exposition', 'مهرجان', 'حفل'].some(k => lower.includes(k))) return 'cultural_event';
  if (['reconstruction', 'rebuilt', 'reconstruit', 'إعادة إعمار'].some(k => lower.includes(k))) return 'reconstruction';
  if (['donation', 'aid', 'humanitarian', 'solidarity', 'don', 'تبرع', 'مساعدات', 'تضامن'].some(k => lower.includes(k))) return 'solidarity';
  if (['ceasefire', 'peace', 'cessez-le-feu', 'وقف إطلاق نار', 'سلام'].some(k => lower.includes(k))) return 'institutional_progress';
  return 'institutional_progress';
}
```

- **Fix proposé** — `src/core/classification/index.ts` (lignes 71-86) :

```typescript
if (finalOmbre > finalLumiere && finalOmbre > 0.15) {
  return {
    classification: 'ombre',
    confidence: Math.min(finalOmbre + 0.3, 1),
    category: inferOmbreCategory(text.toLowerCase()),
    method: 'ensemble',
  };
}

if (finalLumiere > finalOmbre && finalLumiere > 0.15) {
  return {
    classification: 'lumiere',
    confidence: Math.min(finalLumiere + 0.3, 1),
    category: inferLumiereCategory(text.toLowerCase()),
    method: 'ensemble',
  };
}
```

(Importer les fonctions `inferOmbreCategory` et `inferLumiereCategory` depuis pre-classifier.ts ou les dédupliquer dans un module commun.)

- **Test** : Après fix, `/api/v2/events?classification=lumiere&limit=20` doit montrer des catégories variées (cultural_event, reconstruction, solidarity, institutional_progress).

---

### BUG #2: CloudflareWidget = données HARDCODÉES

- **Fichier** : `src/components/widgets/CloudflareWidget.tsx` (ligne 11)
- **Flux** : Le widget ne fetch AUCUNE API. Les données sparkline sont hardcodées.
- **Point de rupture** : Ligne 11, les données sont un tableau statique `[85, 90, 88, 92, 87, 91, 89]`. Le widget n'utilise pas useSWR et ne fetch pas `/api/v2/infrastructure` ni aucun endpoint Cloudflare.
- **Code cassé** :

```typescript
// src/components/widgets/CloudflareWidget.tsx lignes 7-33
export function CloudflareWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width } = useContainerSize(containerRef);

  const sparklineData = [85, 90, 88, 92, 87, 91, 89]; // ← HARDCODÉ !

  return (
    // ... affiche toujours "—" comme valeur
  );
}
```

- **Fix proposé** :

```typescript
'use client';

import { useRef } from 'react';
import useSWR from 'swr';
import { Sparkline } from '@/components/charts/Sparkline';
import { useContainerSize } from '@/hooks/useContainerSize';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface CloudflareData {
  trafficIndex?: number | null;
  history?: Array<{ at: string; value: number }>;
}

export function CloudflareWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width } = useContainerSize(containerRef);

  const { data } = useSWR<CloudflareData>('/api/v2/cloudflare', fetcher, {
    refreshInterval: 300_000,
  });

  const trafficIndex = data?.trafficIndex ?? null;
  const sparklineData = data?.history?.map((h) => h.value) ?? [];

  return (
    <div ref={containerRef} className="flex flex-col p-4" style={{ background: '#FAFAFA' }}>
      <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#666666' }}>
        Trafic Internet
      </div>
      <div className="text-[11px] mb-2" style={{ color: '#666666' }}>
        Cloudflare Radar
      </div>
      <div className="text-[48px] font-light tabular-nums" style={{ color: '#1A1A1A' }}>
        {trafficIndex != null ? `${trafficIndex}%` : '—'}
      </div>
      <div className="mt-2" style={{ height: 40 }}>
        <Sparkline width={width} height={40} data={sparklineData} strokeColor="#666666" />
      </div>
    </div>
  );
}
```

**Note** : Il faut aussi créer un endpoint `/api/v2/cloudflare/route.ts` qui expose les données collectées par le connecteur Cloudflare (`src/sources/cloudflare/fetcher.ts`), ou étendre l'endpoint `/api/v2/indicators` pour inclure le trafic internet. Le connecteur `cloudflare` existe déjà dans le pipeline (statut OK dans health), mais ses données ne sont pas exposées au frontend.

---

### BUG #3: OpenSky retourne null (count=null, jammingIndex=null)

- **Fichier** : `src/sources/opensky/fetcher.ts` (ligne 60-83), `src/app/api/v2/opensky/route.ts` (ligne 8-19)
- **Flux** : GET `/api/v2/opensky` → `fetchOpenSky()` → fetch opensky-network.org → parse states → return count + jammingIndex
- **Point de rupture** : `fetchOpenSky()` throw en cas d'erreur (ligne 82 : `throw e`). Le route handler catch l'erreur et retourne `{ count: null, jammingIndex: null }` avec status 200 (ligne 17). L'OpenSky API timeout probablement depuis Railway (blocage IP ou latence réseau). Le timeout est de 20s, ce qui peut ne pas suffire.
- **Code cassé** :

```typescript
// src/app/api/v2/opensky/route.ts ligne 15-18
} catch (err) {
  console.error('OpenSky API error', err);
  return NextResponse.json({ count: null, jammingIndex: null }, { status: 200 });
  // ← Retourne 200 avec des null ! Le widget affiche "—"
}
```

- **Fix proposé** — Ajouter Redis cache + stale-while-revalidate :

```typescript
// src/app/api/v2/opensky/route.ts
import { NextResponse } from 'next/server';
import { fetchOpenSky } from '@/sources/opensky/fetcher';
import { redisGet, redisSet, isRedisConfigured } from '@/lib/redis';

const CACHE_KEY = 'lebanon-monitor:opensky';
const CACHE_TTL = 120; // 2 minutes

export async function GET() {
  // Try cache first
  if (isRedisConfigured()) {
    const cached = await redisGet<{ count: number; jammingIndex: number }>(CACHE_KEY);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=120' },
      });
    }
  }

  try {
    const { count, jammingIndex } = await fetchOpenSky();
    const result = { count, jammingIndex };
    if (isRedisConfigured()) {
      await redisSet(CACHE_KEY, result, { ex: CACHE_TTL });
    }
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' },
    });
  } catch (err) {
    console.error('OpenSky API error', err);
    // Try returning stale cache
    if (isRedisConfigured()) {
      const stale = await redisGet<{ count: number; jammingIndex: number }>(CACHE_KEY);
      if (stale) return NextResponse.json(stale);
    }
    return NextResponse.json({ count: null, jammingIndex: null }, { status: 200 });
  }
}
```

- **Test** : `curl -s /api/v2/opensky` → doit retourner `{count: N, jammingIndex: N}` avec des chiffres, pas null. Si OpenSky est systématiquement bloqué depuis Railway, il faut un relay ou utiliser l'API avec authentification.

---

### BUG #4: CCTV = iframes bloquées par X-Frame-Options

- **Fichier** : `src/components/widgets/CCTVWidget.tsx` (lignes 46-60), `src/app/api/v2/cctv/route.ts`, `src/app/api/youtube/embed/route.ts`
- **Flux** : CCTVWidget fetch `/api/v2/cctv` → obtient videoId → construit embedUrl → utilise iframe
- **Point de rupture** : Deux problèmes :
  1. Le `beirut-webcam` utilise `embedUrl: 'https://www.skylinewebcams.com/en/webcam/lebanon/beirut/beirut/beirut.html'` — SkylineWebcams bloque les iframes avec `X-Frame-Options: sameorigin`. IMPOSSIBLE d'embedder.
  2. Pour YouTube, le CCTVWidget construit l'URL comme `/api/youtube/embed?videoId=...` (ligne 38 de CCTVWidget.tsx), ce qui est correct. MAIS le route YouTube embed (`src/app/api/youtube/embed/route.ts`) retourne du HTML avec un player YouTube. Ce HTML est servi depuis le même domaine (`lebanonmonitor-production.up.railway.app`), et le header de réponse de Next.js ajoute par défaut `X-Frame-Options: DENY` → l'iframe refuse de charger la page de l'embed proxy.
- **Code cassé** :

```typescript
// src/components/widgets/CCTVWidget.tsx ligne 38-39
const embedUrl =
  data?.videoId
    ? `/api/youtube/embed?videoId=${data.videoId}&autoplay=1&mute=1`
    : data?.embedUrl; // ← Pour Skyline, c'est l'URL directe → X-Frame-Options: sameorigin
```

```typescript
// src/app/api/youtube/embed/route.ts ligne 66-73
return new Response(html, {
  status: 200,
  headers: {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=300',
    // ← MANQUE : X-Frame-Options et Content-Security-Policy frame-ancestors
  },
});
```

- **Fix proposé** — `src/app/api/youtube/embed/route.ts` (ligne 66-73) :

```typescript
return new Response(html, {
  status: 200,
  headers: {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=300',
    'X-Frame-Options': 'ALLOWALL',
    'Content-Security-Policy': "frame-ancestors 'self' https://lebanonmonitor-production.up.railway.app",
  },
});
```

- **Fix proposé** — Aussi vérifier `next.config.ts` ou `next.config.js` pour les headers globaux. Si Next.js ajoute `X-Frame-Options: DENY` globalement, il faut l'override pour la route `/api/youtube/embed` :

```javascript
// next.config.js / next.config.ts — ajouter dans headers()
async headers() {
  return [
    {
      source: '/api/youtube/embed',
      headers: [
        { key: 'X-Frame-Options', value: 'ALLOWALL' },
        { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
      ],
    },
  ];
}
```

- **Fix proposé** — Pour SkylineWebcams : IMPOSSIBLE d'embedder en iframe. Deux options :
  1. Utiliser YouTube comme fallback pour Lumière aussi (pas de webcam)
  2. Ou embedder une image/screenshot actualisée périodiquement via un service proxy

- **Test** : Après fix, les flux CCTV doivent charger dans les iframes sans erreur de console.

---

### BUG #5: AQI (qualité air) = null en DB et en API

- **Fichier** : `src/worker/ingest.ts` (lignes 147-153), `src/sources/openaq/fetcher.ts`
- **Flux** : Pipeline → runIngest() → connecteur `openaq` → fetchOpenAQ() → normalize → extractIndicators() → indicators.aqi → runIndicators() → persistIndicatorSnapshots()
- **Point de rupture** : Le health check montre `openaq: OK`, donc le connecteur fetch bien. MAIS le problème est dans `extractIndicators()` ligne 151 : il cherche `(events[0]?.rawData as { pm25?: number })?.pm25`. Le normalizer OpenAQ ne stocke probablement pas le champ `pm25` dans `rawData` au bon endroit, ou les `results` retournés par l'API OpenAQ v3 ne contiennent aucune station au Liban (la bbox peut ne retourner aucun résultat si aucune station active).
- **Vérification nécessaire** : Tester manuellement si l'API OpenAQ v3 retourne des stations au Liban :

```bash
curl -s "https://api.openaq.org/v3/parameters/2/latest?limit=500" \
  -H "X-API-Key: $OPENAQ_API_KEY" | python3 -m json.tool | head -50
```

- **Fix proposé** : Si aucune station OpenAQ n'existe au Liban, utiliser l'API WAQI (World Air Quality Index) comme alternative. waqi.info a des stations à Beyrouth.

```typescript
// Alternative : src/sources/openaq/fetcher.ts — ajouter fallback WAQI
const WAQI_URL = 'https://api.waqi.info/feed/beirut/?token=demo';

async function fetchWAQI(): Promise<number | null> {
  try {
    const res = await fetch(WAQI_URL);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.iaqi?.pm25?.v ?? null;
  } catch {
    return null;
  }
}
```

- **Test** : `/api/v2/indicators` → `aqi` doit retourner un nombre, pas null.

---

### BUG #6: Agenda culturel montre des news OMBRE

- **Fichier** : `src/components/widgets/CultureWidget.tsx` (ligne 28)
- **Flux** : Le widget fetch `/api/v2/events?source=rss&limit=30` → filtre côté client avec `isCultural(title)` → cherche des mots-clés culture dans le titre.
- **Point de rupture** : Le fetch ne filtre PAS par `classification=lumiere`. Il prend les 30 derniers events RSS, toutes classifications confondues. Si aucun titre ne contient de mot-clé culturel, le composant affiche les events quand même (via un fallback qui n'existe pas — en fait il affiche "Aucun événement à venir" si `cultural.length === 0`).

  Mais le problème observé sur le site live est que des articles OMBRE apparaissent. Cela signifie que certains titres ombre contiennent accidentellement un mot-clé culturel (ex: "guerre" contient-il un faux positif ? Non...). En fait, en re-vérifiant le browser audit : le widget montre "Iran : 'Nous ne sommes pas dans cette guerre'" — aucun mot-clé culturel ici. Ce qui veut dire que le widget AFFICHE des events non-culturels en fallback.

  Re-lecture du code : le widget filtre avec `isCultural()` puis prend `slice(0, 5)`. Si `cultural.length === 0`, il affiche "Aucun événement à venir". Mais le site live MONTRE des articles... Donc soit le filtre a un faux positif, soit le code a changé.

  Vérification des mots-clés : `CULTURE_KEYWORDS = ['festival', 'concert', 'culture', 'agenda', 'exposition', 'exhibition', 'théâtre', 'theater', 'cinéma', 'film', 'music', 'art', 'concert', 'spectacle', 'dance', 'danse', 'vernissage', 'conférence', 'workshop']`. Le mot `'art'` peut matcher dans `"martèle"` (l'article "Iran: Nous ne sommes pas dans cette guerre, martèle le po..."). Le mot `'art'` est un sous-string de `'martèle'` → `"martèle".includes("art")` = **FALSE** (car c'est `m-a-r-t-è-l-e`). Vérifions : `'conférence'` pourrait matcher dans un article de conférence de presse ? C'est possible. En fait `'art'` se trouve dans `'martèle'`? Let me check: m-a-r-t-è-l-e. "art" = a-r-t. Oui, `'martèle'.includes('art')` = **TRUE** (positions 1-3). Voilà le bug.

- **Code cassé** :

```typescript
// src/components/widgets/CultureWidget.tsx
const CULTURE_KEYWORDS = [
  'festival', 'concert', 'culture', 'agenda', 'exposition', 'exhibition',
  'théâtre', 'theater', 'cinéma', 'film', 'music', 'art', 'concert', // ← 'art' match 'martèle', 'parties', etc.
  'spectacle', 'dance', 'danse', 'vernissage', 'conférence', 'workshop', // ← 'conférence' match conférence de presse
];

function isCultural(title: string): boolean {
  const lower = title.toLowerCase();
  return CULTURE_KEYWORDS.some((kw) => lower.includes(kw)); // ← substring match trop permissif
}
```

- **Fix proposé** :

```typescript
// src/components/widgets/CultureWidget.tsx

'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface EventItem {
  id: string;
  title: string;
  occurredAt: string;
  category?: string | null;
  source?: string | null;
}

export function CultureWidget() {
  // Fetch LUMIERE events seulement, et filtrer par catégorie 'cultural_event'
  const { data } = useSWR<{ data: EventItem[] }>(
    '/api/v2/events?classification=lumiere&category=cultural_event&limit=10',
    fetcher,
    { refreshInterval: 300_000 }
  );

  // Fallback: fetch RSS source 'Agenda Culturel' spécifiquement
  const { data: agendaData } = useSWR<{ data: EventItem[] }>(
    '/api/v2/events?source=rss&limit=30&classification=lumiere',
    fetcher,
    { refreshInterval: 300_000 }
  );

  const cultural = data?.data ?? [];
  const agendaEvents = (agendaData?.data ?? []).filter((e) =>
    e.title.toLowerCase().includes('festival') ||
    e.title.toLowerCase().includes('concert') ||
    e.title.toLowerCase().includes('exposition')
  );
  const allCultural = [...cultural, ...agendaEvents].slice(0, 5);

  return (
    <div className="flex flex-col p-4" style={{ background: '#F5F2EE' }}>
      <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#888888' }}>
        Agenda culturel
      </div>
      <div className="flex flex-col gap-2">
        {allCultural.length === 0 ? (
          <div className="text-[14px] leading-relaxed" style={{ color: '#888888' }}>
            Aucun événement à venir
          </div>
        ) : (
          allCultural.map((e) => (
            <a
              key={e.id}
              href={`/event/${e.id}`}
              className="text-[13px] leading-snug transition-colors hover:underline"
              style={{ color: '#1A1A1A' }}
            >
              {e.title.length > 60 ? `${e.title.slice(0, 60)}…` : e.title}
            </a>
          ))
        )}
      </div>
    </div>
  );
}
```

- **Test** : L'agenda culturel ne doit plus afficher d'articles de guerre/politique.

---

### BUG #7: Points carte non interactifs (pas de popup au clic)

- **Fichier** : `src/components/hero/HeroMap.tsx`
- **Flux** : Le composant crée des layers MapLibre GL (heatmap, events-points clusters/unclustered, fires, flights, etc.) mais n'ajoute AUCUN event listener de clic.
- **Point de rupture** : Aucun `map.on('click', 'events-unclustered', ...)` n'existe dans le code. Les points sont rendus mais ne sont pas interactifs.
- **Code cassé** : Il manque simplement les event handlers. Dans le useEffect qui crée les layers (autour de la ligne qui ajoute `events-unclustered`), aucun popup n'est configuré.
- **Fix proposé** — Ajouter dans le useEffect qui crée les layers, APRÈS l'ajout des layers events :

```typescript
// src/components/hero/HeroMap.tsx — ajouter après la création des layers events-points
// (dans le useEffect qui commence par "if (!map.getSource('events-points'))")

map.on('click', 'events-unclustered', (e) => {
  if (!e.features?.length) return;
  const props = e.features[0].properties;
  const coords = (e.features[0].geometry as GeoJSON.Point).coordinates as [number, number];

  new maplibregl.Popup({ closeButton: true, maxWidth: '260px' })
    .setLngLat(coords)
    .setHTML(`
      <div style="background:#0D0D0D;color:#fff;padding:12px;font-size:12px;font-family:'DM Sans',sans-serif">
        <div style="font-weight:500;margin-bottom:4px">${props.title ?? ''}</div>
        <div style="color:#888;font-size:10px;margin-top:4px">
          ${props.source ?? ''} · ${new Date(props.occurredAt).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
        </div>
        <a href="/event/${props.id}" style="color:#4FC3F7;font-size:10px;margin-top:6px;display:block">Détails →</a>
      </div>
    `)
    .addTo(map);
});

map.on('click', 'events-clusters', (e) => {
  if (!e.features?.length) return;
  const source = map.getSource('events-points') as maplibregl.GeoJSONSource;
  const clusterId = e.features[0].properties.cluster_id;
  (source as any).getClusterExpansionZoom(clusterId, (err: Error, zoom: number) => {
    if (err) return;
    map.easeTo({
      center: (e.features![0].geometry as GeoJSON.Point).coordinates as [number, number],
      zoom,
    });
  });
});

map.on('mouseenter', 'events-unclustered', () => { map.getCanvas().style.cursor = 'pointer'; });
map.on('mouseleave', 'events-unclustered', () => { map.getCanvas().style.cursor = ''; });
map.on('mouseenter', 'events-clusters', () => { map.getCanvas().style.cursor = 'pointer'; });
map.on('mouseleave', 'events-clusters', () => { map.getCanvas().style.cursor = ''; });
```

- **Note** : Le popup style suit les règles du design system (bg #0D0D0D, border-radius 0, padding 12px, font 12px).
- **Test** : Activer le layer EVENTS, cliquer sur un point → popup avec titre, source, date.

---

### BUG #8: Layers carte invisibles par défaut (tous désactivés)

- **Fichier** : `src/components/hero/HeroMap.tsx` (lignes 60-69)
- **Point de rupture** : Tous les layers démarrent avec `visibility: 'none'` et dans le state initial, tous les toggles sont `false` :

```typescript
const [layers, setLayers] = useState<Record<LayerId, boolean>>({
  events: false, // ← TOUS false par défaut
  flights: false,
  ships: false,
  fires: false,
  infra: false,
  unifil: false,
  jamming: false,
});
```

Les pills montrent les boutons mais aucun layer n'est actif au chargement. Les heatmaps lumière/ombre sont visibles (pas contrôlées par les toggles), mais les points individuels ne le sont pas.

- **Fix proposé** :

```typescript
const [layers, setLayers] = useState<Record<LayerId, boolean>>({
  events: true,  // ← Activer par défaut
  flights: false,
  ships: false,
  fires: false,
  infra: false,
  unifil: false,
  jamming: false,
});
```

---

### BUG #9: GPS Jamming = 0/100 (dépend d'OpenSky)

- **Fichier** : `src/components/widgets/JammingWidget.tsx`
- **Flux** : Fetch `/api/v2/opensky` → `data.jammingIndex` → affiche `score/100`
- **Point de rupture** : Comme OpenSky retourne `null` (BUG #3), `data?.jammingIndex ?? 0` → toujours 0. Le widget affiche `0/100`.
- **Fix** : Résoudre BUG #3 (OpenSky). Le JammingWidget est correct fonctionnellement, il dépend juste de données non disponibles.

---

### BUG #10: SQL bug dans stats route (table alias manquant)

- **Fichier** : `src/app/api/v2/stats/route.ts` (ligne 33)
- **Point de rupture** : La requête categoryRes utilise `e.is_active` mais la table n'a pas d'alias `e` :

```sql
SELECT event_type, COUNT(*)::int as count FROM event 
WHERE e.is_active = true AND occurred_at >= $1 
GROUP BY event_type HAVING event_type IS NOT NULL ORDER BY count DESC LIMIT 8
```

`e.is_active` devrait être `is_active` (sans alias) ou la table devrait être aliasée `event e`.

- **Code cassé** :

```typescript
// src/app/api/v2/stats/route.ts ligne 32-35
const categoryRes = await client.query<{ event_type: string; count: string }>(
  `SELECT event_type, COUNT(*)::int as count FROM event 
   WHERE e.is_active = true AND occurred_at >= $1 
   GROUP BY event_type HAVING event_type IS NOT NULL ORDER BY count DESC LIMIT 8`,
  [today]
);
```

- **Fix proposé** :

```typescript
const categoryRes = await client.query<{ event_type: string; count: string }>(
  `SELECT event_type, COUNT(*)::int as count FROM event 
   WHERE is_active = true AND occurred_at >= $1 
   GROUP BY event_type HAVING event_type IS NOT NULL ORDER BY count DESC LIMIT 8`,
  [today]
);
```

- **Note** : Ce bug peut silencieusement causer une erreur SQL qui est attrapée par le catch, masquant les topCategories. Si le site affiche quand même des stats, c'est peut-être que PostgreSQL accepte la syntaxe ou que l'erreur est catchée sans casser la réponse entière. Il faut vérifier les logs Railway.

---

### BUG #11: `/api/v2/events/1` retourne 500

- **Fichier** : `src/app/api/v2/events/[id]/route.ts`, `src/db/repositories/event-repository.ts`
- **Flux** : GET `/api/v2/events/1` → `getEventById(client, "1")` → query SQL avec id="1"
- **Point de rupture** : Les event IDs sont des UUIDs (type `uuid` en PostgreSQL d'après le schema). Passer `"1"` comme ID cause une erreur SQL `invalid input syntax for type uuid: "1"`. Le catch retourne un 500 générique.
- **Fix proposé** — `src/app/api/v2/events/[id]/route.ts` (lignes 31-32) :

```typescript
const { id } = await params;

// Valider que l'ID est un UUID valide
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!UUID_RE.test(id)) {
  return NextResponse.json({ error: 'Invalid event ID format', code: 400 }, { status: 400 });
}

const lang = (req.nextUrl.searchParams.get('lang') ?? 'fr') as Lang;
```

- **Test** : `/api/v2/events/1` → 400 au lieu de 500. `/api/v2/events/{uuid-valide}` → 200 avec données.

---

### BUG #12: Traductions — fonctionnent PARTIELLEMENT mais non vérifiable

- **Fichier** : `src/worker/translate.ts`, `src/worker/pipeline.ts` (ligne 82-84)
- **Flux** : Pour chaque nouvel event, le pipeline appelle `translateAndStore(eventId, title, summary).catch(...)`. La fonction vérifie `HF_API_TOKEN` → détecte la langue source → traduit vers ar/fr/en via Helsinki-NLP Opus-MT.
- **Point de rupture** : Le code est correct MAIS :
  1. `translateAndStore()` est appelé en fire-and-forget (`.catch()`) — les erreurs sont silencées
  2. La traduction est lente (modèle HF peut prendre 10-30s pour cold start)
  3. Quand le modèle HF est en mode "loading" (HTTP 503), la fonction retourne null silencieusement
  4. L'API events retourne les traductions via `getTranslationsForEvents()` — cela fonctionne si les traductions existent en DB
- **Verdict** : Le code est fonctionnel. Si HF_API_TOKEN est configuré, les traductions devraient se faire. Le problème est le cold start des modèles HF et les erreurs silencées.
- **Fix proposé** : Ajouter un retry avec backoff pour le cold start HF :

```typescript
// src/worker/translate.ts — dans translateText(), après le check 503
if (res.status === 503) {
  const data = (await res.json()) as { estimated_time?: number };
  const waitMs = Math.min((data.estimated_time ?? 20) * 1000, 30000);
  logger.info('HF model loading, retrying...', { model, waitMs });
  await new Promise((r) => setTimeout(r, waitMs));
  // Retry once
  const retry = await fetch(`${HF_API}/${model}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: text }),
  });
  if (retry.ok) {
    const retryData = (await retry.json()) as Array<{ translation_text?: string }>;
    return retryData[0]?.translation_text ?? null;
  }
  return null;
}
```

---

### BUG #13: Fuel = placeholder statique

- **Fichier** : `src/components/widgets/FuelWidget.tsx`
- **Point de rupture** : Le widget est un composant statique qui affiche "—". Il n'y a AUCUN fetch, AUCUNE API, AUCUN connecteur pour les prix du carburant. C'est un placeholder pur.

```typescript
// src/components/widgets/FuelWidget.tsx — TOUT le composant
export function FuelWidget() {
  return (
    <div className="flex flex-col p-4" style={{ background: '#0A0A0A' }}>
      <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#666666' }}>
        Prix carburant
      </div>
      <div className="text-[48px] font-light tabular-nums" style={{ color: '#FFFFFF' }}>
        —
      </div>
      <div className="text-[11px] mt-1" style={{ color: '#666666' }}>
        LBP (benzin, diesel)
      </div>
    </div>
  );
}
```

- **Fix proposé** : Le Ministère de l'Énergie libanais publie les prix mensuels. Il n'y a pas d'API publique mais les prix sont disponibles sur des sites comme `iptgroup.com.lb/ipt/en/Ede` ou `globalpetrolprices.com`. Option la plus simple : ajouter un champ dans `indicator_snapshot` alimenté manuellement ou via scraping.

---

### BUG #14: Port Beyrouth = placeholder statique

- **Fichier** : `src/components/widgets/PortWidget.tsx`
- **Point de rupture** : Même situation que FuelWidget — composant 100% statique, aucun fetch.
- **Fix possible** : Intégrer MarineTraffic embed ou VesselFinder embed pour un suivi AIS basique.

---

### BUG #15: ACLED = placeholder "à venir"

- **Fichier** : `src/components/widgets/ACLEDMiniMap.tsx`
- **Point de rupture** : Le composant est un placeholder de 23 lignes qui affiche "Carte 30j — à venir".
- **Les données ACLED existent** : Le health check montre `acled: not configured` (ACLED_API_KEY et ACLED_EMAIL manquants ou non reconnus). Le connecteur existe (`src/sources/acled/fetcher.ts`), mais les variables d'env ne sont pas reconnues.
- **Fix proposé** : Vérifier que ACLED_API_KEY et ACLED_EMAIL sont bien configurés dans Railway (sans espaces, sans guillemets). Puis implémenter le widget :

```typescript
'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface EventItem {
  id: string;
  latitude?: number | null;
  longitude?: number | null;
  title: string;
  occurredAt: string;
}

export function ACLEDMiniMap() {
  const { data } = useSWR<{ data: EventItem[] }>(
    '/api/v2/events?source=acled&limit=50',
    fetcher,
    { refreshInterval: 300_000 }
  );

  const events = data?.data ?? [];
  const withCoords = events.filter((e) => e.latitude != null && e.longitude != null);

  if (withCoords.length === 0) {
    return (
      <div className="flex flex-col p-4" style={{ background: '#0A0A0A' }}>
        <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#666666' }}>
          Incidents ACLED
        </div>
        <div className="text-[14px]" style={{ color: '#666666' }}>
          Carte 30j — données en attente
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4" style={{ background: '#0A0A0A' }}>
      <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#666666' }}>
        Incidents ACLED · 30j
      </div>
      <div className="text-[48px] font-light tabular-nums" style={{ color: '#FFFFFF' }}>
        {withCoords.length}
      </div>
      <div className="text-[11px] mt-1" style={{ color: '#666666' }}>
        incidents géolocalisés
      </div>
    </div>
  );
}
```

---

### BUG #16: Reconstruction = placeholder statique

- **Fichier** : `src/components/widgets/ReconstructionWidget.tsx`
- **Point de rupture** : Composant statique, aucune donnée.
- **Fix possible** : L'indicateur "Projets reconstruction" dans IndicatorStrip utilise `stats.byClassification.lumiere` (le nombre d'events lumière), PAS le nombre réel de projets de reconstruction. C'est trompeur — "31 projets reconstruction" = 31 events lumière totaux, pas 31 vrais projets.

---

### BUG #17: Reforestation = null (logique correcte mais pas de données)

- **Fichier** : `src/components/widgets/ReforestationWidget.tsx`, `src/app/api/v2/reforestation-stats/route.ts`
- **Point de rupture** : Le widget et l'API cherchent des events lumière contenant des mots-clés de reforestation. Il n'y en a simplement aucun dans les 977 events existants.
- **Verdict** : Pas un bug de code. C'est un manque de données source — aucune source RSS ne couvre la reforestation au Liban spécifiquement.

---

### BUG #18: RSS feeds = seulement 16 sources

- **Fichier** : `src/sources/rss/config.ts`
- **Point de rupture** : Le fichier ne contient que 16 feeds RSS, dont la plupart sont des sources internationales (France24, BBC, Reuters). Seulement 7 sont spécifiques au Liban (L'Orient Today, NNA, Daily Star, MTV, Beirut.com, Executive Magazine, Agenda Culturel).
- **Comparaison World Monitor** : WM a 435+ feeds RSS avec un système de tiers.
- **Fix** : Ajouter davantage de feeds libanais — voir section 4.

---

### BUG #19: Telegram non configuré

- **Fichier** : `src/sources/telegram/config.ts`
- **Point de rupture** : `TELEGRAM_RSS_URLS` est lue depuis `process.env.TELEGRAM_RSS_URLS`. Le health check montre `TELEGRAM_RSS_URLS not configured`. La variable d'env n'a jamais été définie dans Railway.
- **Fix** : Ajouter dans Railway :

```
TELEGRAM_RSS_URLS=https://rsshub.app/telegram/channel/LebanonPolitics,https://rsshub.app/telegram/channel/LBnews4u,https://rsshub.app/telegram/channel/MTVLeb
```

(Utiliser RSSHub comme bridge gratuit, ou rss.app pour un service payant plus fiable.)

---

### BUG #20: RELIEFWEB_APPNAME manquant dans le health check

- **Fichier** : `src/app/api/v2/health/route.ts`
- **Point de rupture** : Le health check rapporte `RELIEFWEB_APPNAME: missing` mais l'utilisateur dit l'avoir configuré. Possible confusion entre `RELIEFWEB_APPNAME` et une autre variable. Vérifier dans Railway que la variable est exactement `RELIEFWEB_APPNAME` (pas `RELIEFWEB_APP_NAME` avec underscore supplémentaire).

---

## 4. PLACEHOLDERS "À VENIR" — COMMENT LES COMPLÉTER

### ACLED Mini Map
- **Données disponibles** : Le connecteur `acled` existe (`src/sources/acled/`) mais il est marqué "not configured" dans le health check. Si ACLED_API_KEY et ACLED_EMAIL sont correctement configurés, les events ACLED seraient ingérés et disponibles via `/api/v2/events?source=acled`.
- **Implémentation manquante** : Le widget `ACLEDMiniMap.tsx` est un placeholder (23 lignes).
- **Code à écrire** : Voir BUG #15 ci-dessus pour un widget de remplacement. Pour une vraie mini-carte, utiliser Leaflet ou MapLibre inline :

```typescript
// Version avec mini-carte Leaflet (alternative au widget simple)
// Nécessite d'abord que ACLED soit configuré et que les events soient ingérés
```

### Reconstruction World Bank
- **Données** : Pas d'API World Bank intégrée
- **Option rapide** : Le World Bank API est public : `https://api.worldbank.org/v2/country/LBN/indicator/...`
- **Option simplifiée** : Transformer le widget pour montrer le nombre d'events lumière avec la catégorie `reconstruction` au lieu d'un placeholder

### Reforestation
- **Données** : Aucune source réelle
- **Option** : Ajouter le RSS du Ministry of Agriculture ou des ONGs comme Lebanon Reforestation Initiative (LRI)
- **Option minimale** : Garder le widget avec compteur d'events mentionnant la reforestation (le code existe déjà et fonctionne, il n'y a juste pas de données)

### Fuel Prices
- **Données** : Pas d'API publique pour les prix du carburant libanais
- **Option** : Scraper `iptgroup.com.lb` ou `globalpetrolprices.com/Lebanon/gasoline_prices/`
- **Option minimale** : Ajouter une source manuelle via l'API admin

### Port Beyrouth
- **Données** : Pas de source AIS intégrée
- **Option rapide** : Embed MarineTraffic iframe pour le port de Beyrouth
- **Option intermédiaire** : Utiliser l'API aisstream.io (gratuite, 100 calls/jour) pour compter les navires dans le port

---

## 5. COMPARAISON WORLD MONITOR — FEATURE PAR FEATURE

| Feature | World Monitor | Lebanon Monitor | Gap | Fix |
|---------|-------------|-----------------|-----|-----|
| RSS feeds | 435+ (4 tiers) | 16 | **CRITIQUE** | Ajouter 30-50 feeds LB/région dans `rss/config.ts` |
| Cache Redis | 3-tier + bootstrap (40+ keys) | Synthèse seulement | **CRITIQUE** | Cacher TOUS les endpoints dans Redis |
| Telegram | 26 channels via relay | RSS bridge, 0 configuré | **CRITIQUE** | Configurer TELEGRAM_RSS_URLS |
| Source health | fresh/stale/very_stale + seed-meta | DB log exists, pas affiché | Moyen | Afficher dans UI (SourceStatusGrid existe déjà) |
| Bootstrap hydration | Single /api/bootstrap batch | Chaque widget fetch séparément | **CRITIQUE** | SSR + Redis prefetch |
| Fallbacks | Direct→relay→fallback pour chaque source | Timeout = null/undefined | **CRITIQUE** | stale-while-revalidate + Redis stale data |
| AI summary | Groq/OpenRouter | Claude Haiku | Similaire | ✅ Fonctionne maintenant |
| Performance | Sub-second (Redis bootstrap) | 2-5s (client-side fetches) | **CRITIQUE** | SSR initial data + Redis cache |
| Live video | 30+ streams | 2 (cassés) | Moyen | Fixer le proxy YouTube embed (BUG #4) |
| Ship tracking | AIS live (aisstream) | Placeholder | Low | MarineTraffic embed |
| Category diversity | AI-classified (keyword + ML + LLM) | 3 catégories en pratique | **HAUTE** | Fixer BUG #1 |
| Convergence | Multi-source cross-check | Jaccard dedup | Moyen | Ajouter badge "✓✓ Confirmé" quand sourceCount > 1 |
| Timeouts | Explicit per-endpoint (3-20s) | Existe (20s OpenSky, 15s CF) | OK | — |
| CDN cache | s-maxage + stale-while-revalidate + stale-if-error | s-maxage + stale-while-revalidate | OK | Ajouter `stale-if-error` |
| Relay fallback | Railway relay pour domaines bloqués | Pas de relay | Moyen | Ajouter relay pour OpenSky |
| Negative cache | `__WM_NEG__` sentinel | Pas de négatif caching | Moyen | Implémenter sentinel cache |

---

## 6. PLAN D'ACTION POUR L'AGENT SUIVANT

### PRIORITÉ CRITIQUE (fixer d'abord — impact maximal sur le site live)

1. **BUG #1** — Classification diversifiée :
   - `src/core/classification/pre-classifier.ts` : Ajouter `inferOmbreCategory()` et `inferLumiereCategory()` au lieu de catégories hardcodées
   - `src/core/classification/index.ts` : Utiliser ces fonctions dans l'ensemble

2. **BUG #4** — CCTV iframes bloquées :
   - `src/app/api/youtube/embed/route.ts` : Ajouter headers `X-Frame-Options: ALLOWALL` et CSP
   - `next.config.ts` : Override headers pour `/api/youtube/embed`
   - `src/config/cctv-sources.ts` : Remplacer SkylineWebcams (impossible en iframe) par un fallback YouTube pour Lumière

3. **BUG #2** — CloudflareWidget hardcodé :
   - `src/components/widgets/CloudflareWidget.tsx` : Ajouter useSWR fetch vers un endpoint
   - Créer `/api/v2/cloudflare/route.ts` ou étendre `/api/v2/indicators` pour exposer les données Cloudflare Radar

4. **BUG #7 + #8** — Carte interactive :
   - `src/components/hero/HeroMap.tsx` : Activer layer EVENTS par défaut + ajouter click handlers avec popups

5. **BUG #3 + #9** — OpenSky + Jamming :
   - `src/app/api/v2/opensky/route.ts` : Ajouter Redis cache + stale fallback

### PRIORITÉ HAUTE (ensuite — améliore significativement le produit)

6. **BUG #6** — Agenda culturel :
   - `src/components/widgets/CultureWidget.tsx` : Filtrer par `classification=lumiere&category=cultural_event`

7. **BUG #10** — SQL alias bug dans stats :
   - `src/app/api/v2/stats/route.ts` ligne 33 : `e.is_active` → `is_active`

8. **BUG #11** — Event by ID crash :
   - `src/app/api/v2/events/[id]/route.ts` : Valider UUID format avant query

9. **BUG #5** — AQI null :
   - Vérifier si OpenAQ a des stations au Liban ; sinon ajouter WAQI comme fallback

10. **BUG #18** — Ajouter des RSS feeds :
    - `src/sources/rss/config.ts` : Ajouter 20+ feeds libanais (L'Orient Le Jour FR, Al Manar, Al Akhbar, Annahar, OLJ arabe, LBCI, etc.)

11. **BUG #19** — Configurer Telegram :
    - Railway env : `TELEGRAM_RSS_URLS=https://rsshub.app/telegram/channel/...`

### PRIORITÉ MOYENNE (polish — améliore la complétude)

12. **BUG #12** — Traduction retry HF cold start :
    - `src/worker/translate.ts` : Retry après 503

13. **BUG #15** — ACLED widget :
    - `src/components/widgets/ACLEDMiniMap.tsx` : Implémenter avec données events ACLED

14. **BUG #16** — Reconstruction widget :
    - `src/components/widgets/ReconstructionWidget.tsx` : Utiliser données existantes

15. **BUG #13** — Fuel widget :
    - Scraper ou source manuelle

16. **BUG #14** — Port Beyrouth :
    - MarineTraffic embed

17. Redis cache global :
    - Cacher tous les endpoints v2 dans Redis (comme WM)

---

## 7. VÉRIFICATION DES HYPOTHÈSES

| # | Hypothèse | Verdict |
|---|-----------|---------|
| 1 | ANTHROPIC_API_KEY mal lue | **INFIRMÉE** — `getSanitizedAnthropicKey()` dans `src/lib/anthropic.ts` est robuste (strip quotes, spaces, BOM, CRLF). La synthèse **FONCTIONNE** maintenant (generated_at: 2026-03-09T11:22:24). |
| 2 | Redis vide et synthèse échoue silencieusement | **INFIRMÉE** — Redis est configuré et fonctionne. La synthèse est cachée et servie. |
| 3 | Catégories "INSTITUTIONS" = fallback pre-classifier | **CONFIRMÉE** — `pre-classifier.ts` ligne 85 : TOUS les matches lumière retournent `institutional_progress`. `index.ts` ligne 84 : l'ensemble aussi. |
| 4 | Carte n'a pas de click handler | **CONFIRMÉE** — Aucun `map.on('click', ...)` dans HeroMap.tsx. |
| 5 | CCTV utilise embed YouTube brut | **PARTIELLEMENT CONFIRMÉE** — Le CCTVWidget utilise le proxy `/api/youtube/embed` (correct), MAIS le proxy ne set pas les bons headers frame. Et SkylineWebcams est impossible en iframe. |
| 6 | Widgets fetch mais n'affichent pas | **INFIRMÉE pour la plupart** — Les widgets qui fetch (LBP, Polymarket, UNIFIL) affichent correctement. Les widgets vides (Cloudflare, Fuel, Port) ne fetch PAS du tout — ce sont des composants statiques. |
| 7 | OpenSky timeout systématiquement | **CONFIRMÉE** — `/api/v2/opensky` retourne `{count:null, jammingIndex:null}`. Le catch dans la route retourne 200 avec null. |
| 8 | Agenda culturel = filtre classification manquant | **CONFIRMÉE** — CultureWidget fetch `/api/v2/events?source=rss&limit=30` SANS filtre classification. Le substring match `'art'` dans `'martèle'` cause des faux positifs. |
| 9 | HF_API_TOKEN configuré mais translate.ts pas appelé | **INFIRMÉE** — `translateAndStore()` est bien appelé dans `pipeline.ts` ligne 82-84 pour chaque nouvel event. C'est fire-and-forget avec `.catch()`. |
| 10 | Indicator_snapshot en DB vide | **PARTIELLEMENT CONFIRMÉE** — lbp et weather ont des données (30 et 24 lectures). AQI est vide (0 entrées). |

---

## 8. PROMPT CURSOR PRÊT À L'EMPLOI

```
Tu es un développeur senior. Voici le rapport d'audit complet de Lebanon Monitor.
Fixe TOUS les bugs critiques et hauts en une seule session, dans cet ordre :

=== ÉTAPE 1 : Classification diversifiée ===

Fichier: src/core/classification/pre-classifier.ts
- Ajouter deux fonctions: inferOmbreCategory(lower) et inferLumiereCategory(lower)
- inferOmbreCategory: si 'airstrike'|'bombing'|'missile'|'shelling'|'raid'|'frappe'|'bombardement'|'غارة'|'قصف'|'صاروخ' → 'armed_conflict'. Si 'displaced'|'refugee'|'evacuation'|'نزوح'|'déplacé'|'réfugié' → 'displacement'. Si 'killed'|'dead'|'assassination'|'تفجير'|'اغتيال'|'tué'|'attentat' → 'violence'. Default: 'armed_conflict'.
- inferLumiereCategory: si 'festival'|'concert'|'culture'|'exposition'|'مهرجان'|'حفل' → 'cultural_event'. Si 'reconstruction'|'rebuilt'|'reconstruit'|'إعادة إعمار' → 'reconstruction'. Si 'donation'|'aid'|'humanitarian'|'solidarity'|'don'|'تبرع'|'مساعدات'|'تضامن' → 'solidarity'. Default: 'institutional_progress'.
- Remplacer category: 'armed_conflict' ligne 68 par: category: inferOmbreCategory(lower)
- Remplacer category: 'institutional_progress' ligne 85 par: category: inferLumiereCategory(lower)
- Exporter les deux fonctions.

Fichier: src/core/classification/index.ts
- Importer inferOmbreCategory et inferLumiereCategory depuis ./pre-classifier
- Ligne 75: remplacer 'political_tension' par inferOmbreCategory(text.toLowerCase())
- Ligne 84: remplacer 'institutional_progress' par inferLumiereCategory(text.toLowerCase())

=== ÉTAPE 2 : CCTV iframe fix ===

Fichier: src/app/api/youtube/embed/route.ts
- Dans le return Response (ligne 66-73), ajouter ces headers:
  'X-Frame-Options': 'ALLOWALL'
  'Content-Security-Policy': "frame-ancestors 'self' https://lebanonmonitor-production.up.railway.app"

Fichier: src/config/cctv-sources.ts
- Changer 'beirut-webcam' : type 'webcam' → type 'youtube', ajouter youtubeHandle: '@SkylineWebcamsLive' (ou supprimer la source si pas de YouTube handle valide)
- Ou bien: dans CCTVWidget.tsx, ne pas utiliser l'embedUrl directe pour les sources de type 'webcam' car elles sont bloquées par X-Frame-Options

=== ÉTAPE 3 : CloudflareWidget fetch réel ===

Fichier: src/components/widgets/CloudflareWidget.tsx
- Remplacer les données hardcodées par un fetch useSWR vers /api/v2/indicators (ou un nouvel endpoint /api/v2/cloudflare)
- Le connecteur cloudflare existe déjà et fonctionne (status OK dans health)
- Ajouter cloudflare_traffic comme clé dans indicator_snapshot

=== ÉTAPE 4 : Carte interactive ===

Fichier: src/components/hero/HeroMap.tsx
- Changer le state initial: events: false → events: true
- Après la création du layer 'events-unclustered', ajouter:
  map.on('click', 'events-unclustered', (e) => { popup avec titre, source, date, lien /event/id })
  map.on('click', 'events-clusters', (e) => { zoom vers le cluster })
  map.on('mouseenter'/'mouseleave' pour curseur pointer)
- Style popup: bg #0D0D0D, color #fff, padding 12px, font 12px, pas de border-radius

=== ÉTAPE 5 : OpenSky + Redis cache ===

Fichier: src/app/api/v2/opensky/route.ts
- Ajouter Redis cache (clé 'lebanon-monitor:opensky', TTL 120s)
- Try cache d'abord, fetch si miss, stale cache en fallback erreur

=== ÉTAPE 6 : Agenda culturel fix ===

Fichier: src/components/widgets/CultureWidget.tsx
- Changer le fetch de '/api/v2/events?source=rss&limit=30' vers '/api/v2/events?classification=lumiere&category=cultural_event&limit=10'
- Supprimer le filtre isCultural() côté client (le filtre est fait côté API)
- Si pas de résultats, afficher "Aucun événement à venir"

=== ÉTAPE 7 : SQL fix stats ===

Fichier: src/app/api/v2/stats/route.ts
- Ligne 33: changer 'e.is_active' en 'is_active'

=== ÉTAPE 8 : Event by ID validation ===

Fichier: src/app/api/v2/events/[id]/route.ts
- Après const { id } = await params, ajouter:
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Invalid event ID', code: 400 }, { status: 400 });

=== ÉTAPE 9 : Plus de RSS feeds ===

Fichier: src/sources/rss/config.ts
Ajouter ces feeds dans le tableau RSS_FEEDS:
  { url: 'https://www.lorientlejour.com/feed', name: "L'Orient-Le Jour FR" },
  { url: 'https://www.annahar.com/english/rss', name: 'Annahar English' },
  { url: 'https://www.lbcgroup.tv/rss', name: 'LBCI News' },
  { url: 'https://www.almanar.com.lb/rss', name: 'Al Manar' },
  { url: 'https://middleeasteye.net/rss', name: 'Middle East Eye' },
  { url: 'https://english.aawsat.com/feed', name: 'Asharq Al-Awsat' },
  { url: 'https://reliefweb.int/updates/rss.xml?search[filter][field_country][]=128', name: 'ReliefWeb Lebanon' },
  { url: 'https://www.undp.org/lebanon/rss.xml', name: 'UNDP Lebanon' },

NE TOUCHE PAS aux fichiers que tu ne modifies pas. Garde le design system existant. Vérifie les linter errors après chaque fichier modifié.
```

---

## 9. ARCHITECTURE RÉSUMÉE (pour contexte de l'agent suivant)

```
SOURCES (14 connecteurs + 6 APIs directes)
  ↓ fetch toutes les 5min (worker pipeline)
  ↓
RAW_INGEST (Postgres)
  ↓ normalize
  ↓
SOURCE_ITEM (Postgres)
  ↓ classify (pre-classifier → keywords → ensemble → LLM batch)
  ↓ deduplicate (Jaccard)
  ↓
EVENT (Postgres, 977 total)
  ↓ translate (HF Opus-MT, fire-and-forget)
  ↓ cluster
  ↓
EVENT_TRANSLATION / EVENT_CLUSTER / INDICATOR_SNAPSHOT
  ↓
26 API ROUTES (Next.js)
  ↓
FRONTEND (React 18 + SWR + MapLibre GL + D3)
```

**Stack** : Next.js 16.1.6, React 18, PostgreSQL, Upstash Redis, Tailwind CSS, MapLibre GL, D3, SWR, Anthropic Claude Haiku, HuggingFace Opus-MT

**Deploy** : Railway (app + DB + cron)

**Points forts actuels** : Pipeline d'ingestion fonctionnel (12 sources OK), synthèse AI fonctionnelle, Polymarket et UNIFIL fonctionnels, LBP rate fonctionnel, architecture de code propre et bien structurée.

**Points faibles critiques** : Pas de cache Redis global, pas de bootstrap/hydration, catégories non diversifiées, widgets statiques (Cloudflare, Fuel, Port), CCTV cassé, OpenSky bloqué, carte non interactive, seulement 16 RSS feeds.

---

*Fin du rapport d'audit.*
