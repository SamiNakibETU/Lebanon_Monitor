# Variables Railway — Tout configurer pour que ça marche

**Railway Dashboard** → Projet `shimmering-alignment` → Service **Web** → **Variables** → **Add Variable**

Copie-colle ces paires (remplace les valeurs entre `...` par tes vrais tokens).

---

## Obligatoires

| Variable | Valeur |
|----------|--------|
| `DATABASE_URL` | `${{ Postgres.DATABASE_URL }}` (Add Reference → Postgres) |
| `RELIEFWEB_APPNAME` | `SNakib-lebanonmonitor-sn7k2` |
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` (clé depuis https://console.anthropic.com/) |

---

## APIs sources (pour l’ingest)

| Variable | Valeur | Où l’avoir |
|----------|--------|------------|
| `FIRMS_MAP_KEY` | Ta clé NASA | https://firms.modaps.eosdis.nasa.gov/api/map_key/ |
| `OWM_API_KEY` | Ta clé OpenWeather | https://openweathermap.org/api |
| `CF_API_TOKEN` | Token Cloudflare | https://dash.cloudflare.com/ |
| `OPENAQ_API_KEY` | Token OpenAQ | https://explore.openaq.org/register |
| `HF_API_TOKEN` | `hf_...` | https://huggingface.co/settings/tokens |
| `UCDP_ACCESS_TOKEN` | (optionnel) | Demander à mertcan.yilmaz@pcr.uu.se |

---

## Synthèse + cache (optionnel mais recommandé)

| Variable | Valeur | Rôle |
|----------|--------|------|
| `UPSTASH_REDIS_REST_URL` | `https://...upstash.io` | Cache synthèse |
| `UPSTASH_REDIS_REST_TOKEN` | `...` | https://upstash.com/ |
| `NEXT_PUBLIC_APP_URL` | `https://ton-app.railway.app` | URL publique de l’app |

---

## Déploiement

1. Ajoute toutes les variables ci-dessus dans Railway
2. Sauvegarde (les variables déclenchent un redéploiement)
3. Attends le redéploiement
4. Réinitialise la DB si besoin : en local, avec `DATABASE_PUBLIC_URL` dans `.env.local` : `npm run db:reset`
