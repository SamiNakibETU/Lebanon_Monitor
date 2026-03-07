# Déploiement — Lebanon Monitor

Guide pas à pas pour déployer sur Railway.

---

## 🔗 Connexion base de données — Guide simplifié

La base de données (PostgreSQL) stocke les événements. Sans elle, l'app affiche "DB not configured" et aucun événement.

### Option A : En local (sur ton PC)

1. **Installer PostgreSQL**  
   - Windows : [postgresql.org/download/windows](https://www.postgresql.org/download/windows)  
   - Ou via [Docker](https://www.docker.com/) : `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres`

2. **Créer une base**  
   - Ouvre pgAdmin ou la ligne de commande  
   - Crée une base nommée `lebanon_monitor`

3. **Configurer `.env.local`** à la racine du projet :
   ```
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lebanon_monitor
   ```
   Remplace `postgres:postgres` par ton utilisateur:mot_de_passe si différent.

4. **Lancer les migrations** :
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **Lancer le worker** (pour remplir la base) :
   ```bash
   npm run worker
   ```

### Option B : Sur Railway (déploiement en ligne)

1. **Créer le projet** : New Project → Deploy from GitHub repo → choisis LEBANON_MONITOR.

2. **Ajouter PostgreSQL** :  
   - Clique sur **+ New** dans ton projet  
   - Choisis **Database** → **PostgreSQL**  
   - Railway crée une base automatiquement (tu verras un bloc "Postgres" sur le canvas).

3. **Lier la base à ton app** :  
   - Clique sur ton **service Web** (l'app Next.js)  
   - Onglet **Variables**  
   - **New Variable**  
   - Nom : `DATABASE_URL`  
   - Valeur : tape `${{` puis sélectionne **Postgres** → **DATABASE_URL** dans l'autocomplete  
   - (Si ton service s'appelle autrement, remplace "Postgres" par son nom exact)

4. **Migrations** (une seule fois) :  
   - Clique sur le service **PostgreSQL**  
   - Onglet **Variables**  
   - Copie la valeur de `DATABASE_PUBLIC_URL`  
   - Sur ton PC, dans le terminal du projet :
     ```bash
     # Windows PowerShell :
     $env:DATABASE_URL="postgresql://postgres:xxx@xxx.railway.app:12345/railway"
     npm run db:migrate
     npm run db:seed
     ```
   - Colle ta vraie URL à la place de `postgresql://...` (Railway → PostgreSQL → Variables → DATABASE_PUBLIC_URL)

5. **Redéploie** l'app si besoin (Settings → Redeploy).

### Vérifier que ça marche

- **En local** : `npm run db:check` → doit afficher "DB OK"
- **En prod** : ouvre `https://ton-app.railway.app/api/health` → `database` doit être `"connected"`

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

## 2. Ajouter PostgreSQL et lier `DATABASE_URL`

### 2.1 Créer la base PostgreSQL

1. Ouvrir ton projet Railway
2. Cliquer sur **+ New** (ou `Ctrl+K` / `Cmd+K` → menu)
3. Choisir **Database** → **PostgreSQL**
4. Railway déploie une instance PostgreSQL. Le service apparaît sur le canvas (ex. nommé « Postgres » ou « PostgreSQL »)

### 2.2 Variables exposées par PostgreSQL

Le service PostgreSQL expose automatiquement :

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | URL complète de connexion (réseau privé interne) |
| `PGDATABASE` | Nom de la base |
| `PGPASSWORD` | Mot de passe |
| `PGUSER` | Utilisateur |
| `PGPORT` | Port |
| `PGHOST` | Hôte |

L’app Lebanon Monitor utilise `DATABASE_URL` (comportement par défaut de Prisma, Drizzle, Knex, etc.).

### 2.3 Référencer `DATABASE_URL` dans le service Web

Pour que ton **service Web** (Lebanon Monitor) accède à la base :

1. Cliquer sur le **service Web** (ton app Next.js)
2. Onglet **Variables**
3. Cliquer **New Variable**
4. Dans le **nom** : `DATABASE_URL`
5. Dans la **valeur** : utiliser la syntaxe de référence Railway :
   ```
   ${{ Postgres.DATABASE_URL }}
   ```
   **Important** : remplacer `Postgres` par le **nom exact** de ton service PostgreSQL (visible sur le canvas). Exemples : `Postgres`, `PostgreSQL`, `lebanon-monitor-postgres`, etc.
6. Railway propose un **autocomplete** dans le champ valeur : taper `${{` puis sélectionner le service et la variable dans la liste
7. **Deploy** pour appliquer les changements

### 2.4 URL privée vs publique

| Variable | Usage |
|----------|--------|
| `DATABASE_URL` | Réseau **privé** Railway (recommandé en prod). Utilise `postgres.railway.internal` pour les connexions service-à-service |
| `DATABASE_PUBLIC_URL` | Réseau **public** (TCP Proxy). À utiliser si tu te connectes **depuis l’extérieur** (ex. migrations en local avec l’URL copiée). Des frais d’egress peuvent s’appliquer |

Pour les migrations **en local** avec la vraie DB Railway : copier `DATABASE_PUBLIC_URL` depuis l’onglet Variables du service PostgreSQL.

### 2.5 PostGIS (optionnel)

Le template PostgreSQL standard n’inclut pas PostGIS. Pour PostGIS :

- Template [PostGIS](https://railway.com/deploy/postgis) dans le marketplace, **ou**
- Migrations Lebanon Monitor adaptées sans PostGIS (colonnes `lat`/`lng`)

---

## 3. Variables d’environnement

Dans **Web Service** → **Variables** :

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `DATABASE_URL` | Oui* | Référencer depuis le service PostgreSQL (Add Reference) |
| `NEXT_PUBLIC_APP_URL` | Non | URL publique (ex. `https://xxx.railway.app`) — SEO, sitemap |
| `NODE_ENV` | Non | `production` (défaut sur Railway) |
| `OWM_API_KEY` | Non | OpenWeatherMap pour la météo |
| `FIRMS_MAP_KEY` | Non | NASA FIRMS pour incendies |
| `CF_API_TOKEN` | Non | Cloudflare Radar |
| `HF_API_TOKEN` | Non | Hugging Face Inference (NLP) |
| `UCDP_ACCESS_TOKEN` | Non | UCDP API (conflits) |
| `RELIEFWEB_APPNAME` | Non | ReliefWeb appname approuvé (ex. `SNakib-lebanonmonitor-sn7k2`) |
| `OPENAQ_API_KEY` | Non | Qualité de l’air (OpenAQ v3) |

\* Si `DATABASE_URL` est absent, l’app fonctionne en mode dégradé (sans persistance).

---

## 4. Migrations et seed

**Avant le premier déploiement**, exécuter les migrations une fois :

```bash
# Depuis ta machine : utiliser DATABASE_PUBLIC_URL (pas DATABASE_URL)
# Copier la valeur dans : PostgreSQL service → Variables → DATABASE_PUBLIC_URL

export DATABASE_URL="postgresql://user:password@host.railway.app:PORT/railway"
npm run db:migrate
npm run db:seed
```

**Où trouver l’URL** : Railway Dashboard → service **PostgreSQL** → **Variables** → `DATABASE_PUBLIC_URL` → copier la valeur.

**Alternative** (migrations au démarrage du conteneur) : **Settings** → **Deploy** → **Custom Start Command** :
```bash
npm run db:migrate && npm run start
```
À éviter en prod : les migrations s’exécuteraient à chaque redémarrage.

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

## 8. Worker (ingestion)

Pour que les événements soient ingérés en production, déployer un **service Worker** séparé :

1. **+ New** → **Empty Service** (ou **Deploy from GitHub** avec le même repo)
2. **Settings** → **Build** : désactiver le build (ou utiliser le même build que le Web)
3. **Settings** → **Deploy** → **Custom Start Command** :
   ```bash
   npm run worker
   ```
4. **Variables** : référencer `DATABASE_URL` depuis PostgreSQL (comme le service Web)
5. **Variables** : ajouter les clés optionnelles (ANTHROPIC_API_KEY, HF_API_TOKEN, ACLED_*, etc.) si besoin

Le worker tourne en boucle (intervalle 5 min). Pour un cron externe à la place : utiliser **Railway Cron** ou un service type cron-job.org qui appelle un endpoint dédié.

---

## Dépannage

| Problème | Piste |
|----------|--------|
| Build échoue (Turbopack) | Le script utilise `--webpack` |
| DB non connectée | 1) Vérifier `/api/health` : si `dbError` est présent, il indique la cause (ex. `ECONNREFUSED`, `ETIMEDOUT`). 2) Sur Railway : utiliser la référence `${{ Postgres.DATABASE_URL }}` (pas une copie manuelle). 3) Si tu as copié l’URL : utiliser `DATABASE_PUBLIC_URL` du service Postgres (le client ajoute `sslmode=require` automatiquement). 4) Vérifier que Web et Postgres sont dans le même projet Railway. |
| Timeout healthcheck | Utiliser `/api/health/live` pour le healthcheck Railway |
| **`extension "postgis" is not available`** | La migration actuelle n’utilise **pas** PostGIS (lat/lng uniquement). Si tu vois cette erreur, une ancienne version est déployée. Pull le dernier code, push, redéploie. Puis réinitialise la DB : supprimer le service PostgreSQL Railway et en recréer un, ou `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` puis `npm run db:migrate` et `npm run db:seed`. |
| **`column "geometry" of relation "place" does not exist`** | Même cause : seed exécuté avec une migration PostGIS. Utilise la migration actuelle (lat/lng) et réinitialise la DB comme ci-dessus. |

---

## Coûts estimés (Hobby)

- Web : ~5 €/mois
- PostgreSQL : ~5 €/mois
- Total : ~10–20 €/mois
