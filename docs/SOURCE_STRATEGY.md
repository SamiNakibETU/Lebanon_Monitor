# Source Strategy — Lebanon Monitor

**Version**: 1.0  
**Date**: 2025-03-06

---

## 1. Catégories de sources

| Catégorie | Sources actuelles | Rôle |
|-----------|-------------------|------|
| news / médias | GDELT, RSS, Twitter | Signaux éditoriaux |
| humanitaire / crise | ReliefWeb | Rapports, situation |
| géophysique | USGS, FIRMS, GDACS | Séismes, incendies, catastrophes |
| économie | LBP Rate | Taux change |
| connectivité | Cloudflare | Pannes internet |
| social | Twitter (Nitter) | Amplification, signaux |
| indicateurs | Weather, OpenAQ | Contexte météo, air |
| référentiel | UCDP (optionnel) | Conflits |

---

## 2. Fiche par source

### GDELT

| Attribut | Valeur |
|----------|--------|
| Mode | API DOC JSON |
| Fréquence | 15 min TTL |
| Coût | Gratuit |
| Fragilité | Haute (429 rate limit) |
| Qualité | Bonne (tone, géo partiel) |
| Couverture | Nationale (sourceloc) |
| Risques | Rate limit, format variable |
| Fallback | Réduire fréquence, cache agressif |

### USGS

| Attribut | Valeur |
|----------|--------|
| Mode | GeoJSON FDSN |
| Fréquence | 5 min |
| Coût | Gratuit |
| Fragilité | Faible |
| Qualité | Excellente (coords précises) |
| Fallback | - |

### FIRMS

| Attribut | Valeur |
|----------|--------|
| Mode | CSV (MAP_KEY) |
| Fréquence | 3h TTL |
| Coût | Gratuit (500 req/jour) |
| Fragilité | Moyenne (key requise) |
| Qualité | Bonne (lat/lng) |
| Fallback | Skip si non configuré |

### RSS

| Attribut | Valeur |
|----------|--------|
| Mode | rss-parser |
| Fréquence | 15 min |
| Coût | Gratuit |
| Fragilité | Moyenne (403, 404 certains flux) |
| Qualité | Variable |
| Fallback | Ignorer les flux en erreur |

### GDACS

| Attribut | Valeur |
|----------|--------|
| Mode | GeoJSON API |
| Fréquence | 1h |
| Coût | Gratuit |
| Fragilité | Faible |
| Qualité | Bonne (alertes) |
| Fallback | 204 No Content = normal |

### ReliefWeb

| Attribut | Valeur |
|----------|--------|
| Mode | REST API |
| Fréquence | 1h |
| Coût | Gratuit (appname requis) |
| Fragilité | Haute (403 appname) |
| Qualité | Excellente |
| Fallback | Demander approubation appname |

### Weather

| Attribut | Valeur |
|----------|--------|
| Mode | OpenWeatherMap API |
| Fréquence | 1h |
| Coût | Gratuit (1000/jour) |
| Fragilité | Faible |
| Rôle | Indicateur, pas événement |

### Cloudflare

| Attribut | Valeur |
|----------|--------|
| Mode | Radar API |
| Fréquence | 30 min |
| Coût | Gratuit (token) |
| Fragilité | Faible |
| Fallback | Skip si non configuré |

### LBP Rate

| Attribut | Valeur |
|----------|--------|
| Mode | Scrape lirarate.org |
| Fréquence | 1h |
| Coût | Gratuit |
| Fragilité | Moyenne (structure HTML) |
| Rôle | Indicateur |

### OpenAQ

| Attribut | Valeur |
|----------|--------|
| Mode | API v3 |
| Fréquence | 1h |
| Coût | Gratuit (clé) |
| Fragilité | Faible |
| Rôle | Indicateur |

### Twitter

| Attribut | Valeur |
|----------|--------|
| Mode | Nitter RSS |
| Fréquence | 15 min |
| Coût | Gratuit |
| Fragilité | Haute (instances instables) |
| Qualité | Signal social, pas vérifié |
| Distinction | Signal social, pas event confirmé |

### UCDP

| Attribut | Valeur |
|----------|--------|
| Mode | API (token) |
| Fréquence | 1j |
| Coût | 5000 req/jour |
| Statut | Non connecté au registry |

---

## 3. Interface connecteur standard

```typescript
interface SourceConnector {
  readonly name: string;
  fetch(): Promise<FetchResult>;
  normalize(raw: unknown, fetchedAt: Date): NormalizedSourceItem[];
  healthcheck(): Promise<HealthStatus>;
  getTTL(): number;           // secondes
  getRateLimitHints(): { requestsPerMinute?: number };
  getSourceReliability(): 'high' | 'medium' | 'low';
  getCostClass(): 'free' | 'low' | 'medium' | 'high';
}
```

### Réponse fetch

- `raw payload` : contenu brut
- `normalized source items` : après normalize()
- `status` : ok | error | rate-limited | no-data
- `warnings` : tableau de strings

---

## 4. Registry déclaratif

Chaque connecteur enregistré avec :
- `name`
- `category` (news, humanitarian, geophysical, etc.)
- `eventSource` (bool) : produit des événements ?
- `indicatorSource` (bool) : produit des indicateurs ?
- `connector` : instance implémentant l'interface
