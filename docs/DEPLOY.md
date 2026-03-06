# Déploiement — Lebanon Monitor

Guide pas à pas pour déployer sur Railway.

---

## Prérequis

- Compte [Railway](https://railway.app)
- GitHub repo connecté

---

## 1. Créer le projet Railway

1. **New Project** → **Deploy from GitHub repo**
2. Sélectionner le dépôt `LEBANON_MONITOR`
3. Railway détecte Next.js automatiquement

---

## 2. Ajouter PostgreSQL

1. Dans le projet → **+ New** → **Database** → **PostgreSQL**
2. Railway crée une instance et expose `DATABASE_URL`
3. **PostGIS** : dans les variables du service PostgreSQL, ou via le dashboard Railway, activer l’extension PostGIS si disponible (certains plans l’incluent)

---

## 3. Variables d’environnement

Dans **Web Service** → **Variables** :

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `DATABASE_URL` | Oui* | Fournie automatiquement si PostgreSQL est lié |
| `NODE_ENV` | Non | `production` (défaut sur Railway) |
| `OWM_API_KEY` | Non | OpenWeatherMap pour la météo |
| `FIRMS_MAP_KEY` | Non | NASA FIRMS pour incendies |
| `CF_API_TOKEN` | Non | Cloudflare Radar |
| `OPENAQ_API_KEY` | Non | Qualité de l’air |

\* Si `DATABASE_URL` est absent, l’app fonctionne en mode dégradé (sans persistance).

---

## 4. Migrations et seed

**Avant le premier déploiement**, ou via **Release Command** si configuré :

```bash
# En local avec DATABASE_URL Railway
export DATABASE_URL="postgresql://..."
npm run db:migrate
npm run db:seed
```

Ou dans Railway : **Settings** → **Deploy** → **Custom Start Command** (optionnel) :
```bash
npm run db:migrate && npm run start
```
À utiliser avec précaution (migrations à chaque redémarrage).

---

## 5. Build & Start

- **Build** : `npm run build` (next build --webpack)
- **Start** : `npm run start` (next start)
- **Port** : Railway injecte `PORT` ; Next.js l’utilise automatiquement

---

## 6. Healthcheck

- **Path** : `/api/health/live` (réponse rapide, pas d’appels externes)
- **Full health** : `/api/health` (DB + statut des sources)

Configurer dans Railway : **Settings** → **Health Check** → Path: `/api/health/live`

---

## 7. Vérification

1. Ouvrir l’URL du service (ex. `*.railway.app`)
2. Tester `/api/health` → `database: "connected"` si PostgreSQL est configuré
3. Vérifier la carte et les panels Lumière/Ombre

---

## Dépannage

| Problème | Piste |
|----------|--------|
| Build échoue (Turbopack) | Le script utilise `--webpack` |
| DB non connectée | Vérifier `DATABASE_URL` et le lien au service PostgreSQL |
| Timeout healthcheck | Utiliser `/api/health/live` pour le healthcheck Railway |
| PostGIS manquant | Vérifier le plan PostgreSQL Railway ; migrer vers un provider avec PostGIS si besoin |

---

## Coûts estimés (Hobby)

- Web : ~5 €/mois
- PostgreSQL : ~5 €/mois
- Total : ~10–20 €/mois
