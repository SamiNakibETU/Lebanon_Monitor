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
