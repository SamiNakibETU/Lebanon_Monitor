# Variables Railway — Tout configurer pour que ça marche

**Railway Dashboard** → Ton projet → Service **Web** → **Variables**

---

## Obligatoires

| Variable | Valeur |
|----------|--------|
| `DATABASE_URL` | **Add Reference** → Postgres → `DATABASE_URL` (donne `${{ Postgres.DATABASE_URL }}`). L'app accepte aussi `DATABASE_PRIVATE_URL` ou `DATABASE_PUBLIC_URL` si Railway les injecte. |
| `RELIEFWEB_APPNAME` | `SNakib-lebanonmonitor-sn7k2` |
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` (clé depuis https://console.anthropic.com/) |

**⚠️ Ne mets PAS DATABASE_PUBLIC_URL** sur le service Web — c’est pour les migrations en local uniquement.

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

## Synthèse + cache + ingest

| Variable | Valeur | Rôle |
|----------|--------|------|
| `UPSTASH_REDIS_REST_URL` | `https://...upstash.io` | Cache synthèse |
| `UPSTASH_REDIS_REST_TOKEN` | `...` | https://upstash.com/ |
| `NEXT_PUBLIC_APP_URL` | URL réelle du service (Settings → Networking) | SEO, sitemap |
| `INGEST_SECRET` | `openssl rand -hex 24` | Protection cron. **Pas de `,` `*` etc.** |

---

## Déploiement

1. Ajoute toutes les variables ci-dessus dans Railway
2. Sauvegarde (les variables déclenchent un redéploiement)
3. Attends le redéploiement
4. Réinitialise la DB si besoin : en local, avec `DATABASE_PUBLIC_URL` dans `.env.local` : `npm run db:reset`

## Premier déploiement (base vide)

Si tu viens d'ajouter Postgres au projet, la base est vide. **Les migrations s'exécutent automatiquement au démarrage** depuis le dernier push. Redéploie une fois : les tables seront créées au lancement.

## Vérifier que tout marche

Après déploiement, ouvre :
- `https://ton-app.railway.app/api/v2/health` — indique `env.DATABASE_URL: "ok"` ou `"missing"`
- `https://ton-app.railway.app/api/v2/events?limit=3` — doit renvoyer `{"events":[],...}` et non "Database not configured"
- Si `relation "event" does not exist` dans les logs : les migrations n'ont pas tourné. Vérifie que `DATABASE_URL` (référence Postgres) est bien sur le service Web. (nom de la variable : `DATABASE_URL`)
