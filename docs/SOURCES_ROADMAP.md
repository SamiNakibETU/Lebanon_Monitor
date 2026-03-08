# Lebanon Monitor — Roadmap des sources de données

> Extension du brief V4. Objectif : architecture riche en données — infrastructures, médias régionaux (Syrie, Israël), bases FR/EN avec filtre Liban.

---

## 1. Clé Anthropic (401 corrigé)

**Problème** : `ANTHROPIC_API_KEY = "sk-ant-..."` avec espaces ou guillemets → 401.

**Solution** : `src/lib/anthropic.ts` sanitize la clé (trim, strip quotes). 

**Railway** : `ANTHROPIC_API_KEY=sk-ant-api03-ul1-VOTRECLE` — pas d'espace autour de `=`, pas de guillemets.

---

## 2. Médias régionaux (FAIT)

### RSS étendu — Syrie, Israël, FR/EN

| Source | Type | Filtre |
|--------|------|--------|
| Al Arabiya | Arabe | Liban |
| France 24 EN/FR | FR/EN | Liban |
| BBC Middle East | EN | Liban |
| Reuters World | EN | Liban |
| Le Monde International | FR | Liban |
| Syria Direct | Région | Liban |
| Times of Israel | Région | Liban |

Filtre : mots-clés `lebanon`, `beirut`, `hezbollah`, `unifil`, `liban`, etc.

---

## 3. Infrastructures

### 3.1 OpenStreetMap / Overpass API (FAIT)

- **API** : `GET /api/v2/infrastructure` — hôpitaux, cliniques, militaires, aéroports, centrales, ports
- **HeroMap** : layer INFRA alimenté par cette API (remplace GeoJSON statique)

### 3.2 Humanitarian Data Exchange (HDX)

- https://data.humdata.org/
- Datasets Liban : déplacés, santé, éducation, infrastructures endommagées
- API ou CSV périodique

### 3.3 OCHA Lebanon

- https://www.unocha.org/lebanon
- Rapports de situation, cartes
- Pas d’API publique — scraping ou manuel

### 3.4 World Bank / UNDP

- Projets de reconstruction (déjà mentionnés dans le brief)
- API ou données ouvertes

---

## 4. ReliefWeb multi-pays

ReliefWeb permet `filter[conditions]` avec OR sur plusieurs pays :

```json
{
  "filter": {
    "operator": "OR",
    "conditions": [
      { "field": "primary_country", "value": "Lebanon" },
      { "field": "primary_country", "value": "Syria" }
    ]
  }
}
```

Puis filtre côté code pour garder uniquement les items pertinents Liban.

---

## 5. Ordre d’implémentation

| Phase | Source | Statut |
|-------|--------|--------|
| ✅ | RSS régionaux (Syrie, Israël, FR/EN) | Haute | Faible |
| ✅ | Sanitization clé Anthropic | Haute | Faible |
| — | OSM Overpass + API infrastructure | ✅ |
| — | ReliefWeb multi-pays | ✅ |
| — | UNIFIL press (scraping) | ✅ |
| — | CultureWidget, Telegram SectionLive | ✅ |
| — | HeroMap FLIGHTS, FIRES, JAMMING | ✅ |
| À venir | HDX — datasets Liban | Moyenne |
| À venir | Port Beyrouth AIS (MarineTraffic) | Moyenne |

---

## 6. Connecteurs créés

### `src/sources/osm-overpass/` — FAIT

```
fetcher.ts    — Requête Overpass pour amenities
normalizer.ts — LebanonEvent avec lat/lng, type (hospital, military, etc.)
config.ts     — Bbox Liban, types d’objets
```

### `src/sources/unifil/` — FAIT

- fetcher.ts scrape unifil.unmissions.org
- API /api/v2/unifil

---

## 7. Variables d’environnement

```bash
# OSM Overpass (gratuit, pas de clé)
# Pas de config requise

# HDX (si API)
# HDX_API_KEY=  # si nécessaire
```
