# Guide de déploiement complet — Lebanon Monitor

**Auteur** : Sami Nakib — sami.nakib@etu.cyu.fr  
**Projet** : Lebanon Monitor — Dashboard OSINT temps réel pour le Liban  
**Dernière mise à jour** : 7 mars 2025

---

## Table des matières

1. [Prérequis](#1-prérequis)
2. [Créer le projet Railway](#2-créer-le-projet-railway)
3. [Ajouter PostgreSQL](#3-ajouter-postgresql)
4. [Lier la base à l'app](#4-lier-la-base-à-lapp)
5. [Exécuter les migrations](#5-exécuter-les-migrations)
6. [Variables d'environnement](#6-variables-denvironnement)
7. [Configurer l'ingestion des événements](#7-configurer-lingestion-des-événements)
8. [Clés API optionnelles](#8-clés-api-optionnelles)
9. [Vérifications finales](#9-vérifications-finales)
10. [Dépannage](#10-dépannage)

---

## 1. Prérequis

Avant de commencer, assure-toi d'avoir :

| Élément | Où l'obtenir |
|--------|--------------|
| **Compte Railway** | [railway.app](https://railway.app) → Sign up (avec GitHub) |
| **Repo GitHub** | [github.com/SamiNakibETU/Lebanon_Monitor](https://github.com/SamiNakibETU/Lebanon_Monitor) |
| **Node.js 20+** | Pour les migrations en local |

---

## 2. Créer le projet Railway

### 2.1 Connexion

1. Va sur **https://railway.app**
2. Clique sur **Login** → **Login with GitHub**
3. Autorise Railway à accéder à ton compte GitHub

### 2.2 Nouveau projet

1. Clique sur **New Project**
2. Choisis **Deploy from GitHub repo**
3. Si c'est la première fois : **Configure GitHub App** → sélectionne le repo `Lebanon_Monitor` (ou "All repositories")
4. Sélectionne le dépôt **SamiNakibETU/Lebanon_Monitor**
5. Railway détecte automatiquement Next.js et lance le build

### 2.3 Premier déploiement

- Attends la fin du build (2–5 min)
- Une fois terminé, clique sur le **service Web** (icône train)
- Onglet **Settings** → **Networking** → **Generate Domain**
- Tu obtiendras une URL du type : `https://lebanonmonitor-production.up.railway.app`

---

## 3. Ajouter PostgreSQL

### 3.1 Créer la base

1. Dans ton projet Railway, clique sur **+ New** (bouton violet en haut à droite)
2. Choisis **Database**
3. Sélectionne **PostgreSQL**
4. Railway déploie une instance PostgreSQL (1–2 min)
5. Un nouveau bloc apparaît sur le canvas : **Postgres** (ou **PostgreSQL** selon la version)

### 3.2 Récupérer les variables

1. Clique sur le service **Postgres**
2. Onglet **Variables**
3. Tu verras notamment :
   - `DATABASE_URL` — URL interne (réseau Railway)
   - `DATABASE_PUBLIC_URL` — URL publique (pour migrations depuis ton PC)
   - `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, etc.

**Important** : garde l’onglet Variables ouvert, tu en auras besoin pour les étapes suivantes.

---

## 4. Lier la base à l'app

### 4.1 Ajouter DATABASE_URL au service Web

1. Clique sur le **service Web** (ton app Next.js, pas Postgres)
2. Onglet **Variables**
3. Clique sur **+ New Variable** ou **Add Variable**
4. Dans le champ **Variable Name** : `DATABASE_URL`
5. Dans le champ **Value** : tape `${{`
6. Une liste déroulante apparaît : sélectionne **Postgres** (ou le nom exact de ton service) → **DATABASE_URL**
7. La valeur affichée sera du type : `${{ Postgres.DATABASE_URL }}`
8. Clique sur **Add**

### 4.2 Si l'URL interne ne fonctionne pas (ENOTFOUND)

Si après déploiement tu vois une erreur `ENOTFOUND postgres.railway.internal` :

1. Ajoute une **deuxième variable** sur le service Web :
   - Nom : `DATABASE_PUBLIC_URL`
   - Valeur : `${{ Postgres.DATABASE_PUBLIC_URL }}`
2. Le client DB utilisera cette URL en priorité
3. Redéploie (Settings → Redeploy)

### 4.3 Redéployer

1. Onglet **Deployments**
2. Clique sur **Redeploy** sur le dernier déploiement (ou attends le déploiement automatique après l’ajout des variables)

---

## 5. Exécuter les migrations

Les migrations créent les tables (event, source_item, taxonomy_label, etc.). À faire **une seule fois** par base.

### 5.1 Copier DATABASE_PUBLIC_URL

1. Clique sur le service **Postgres**
2. Onglet **Variables**
3. Trouve **DATABASE_PUBLIC_URL**
4. Clique sur l’icône **Copy** à côté de la valeur  
   L’URL ressemble à : `postgresql://postgres:XXXXXX@XXXXX.proxy.rlwy.net:12345/railway`

### 5.2 Lancer les migrations sur ton PC

Ouvre **PowerShell** dans le dossier du projet :

```powershell
cd D:\Users\Proprietaire\Desktop\Projet_perso\LEBANON_MONITOR
```

Puis exécute (en remplaçant `POSTGRESQL_URL_ICI` par l’URL copiée) :

```powershell
$env:DATABASE_URL="postgresql://postgres:XXXXX@XXXXX.proxy.rlwy.net:12345/railway"
npm run db:migrate
npm run db:seed
```

**Exemple concret** (remplace par ta vraie URL) :

```powershell
$env:DATABASE_URL="postgresql://postgres:AbCdEf123@monorail.proxy.rlwy.net:54321/railway"
npm run db:migrate
npm run db:seed
```

### 5.3 Vérifier

Tu dois voir :

```
Applying: 001_initial_schema.sql
Migrations applied: 1
Seed applied: 001_taxonomy.sql
Seed applied: 002_places.sql
```

---

## 6. Variables d'environnement

### 6.1 Variables obligatoires (déjà fait)

| Variable | Valeur | Statut |
|----------|-------|--------|
| `DATABASE_URL` | `${{ Postgres.DATABASE_URL }}` | ✅ Ajoutée à l’étape 4 |

### 6.2 Variables recommandées

| Variable | Description | Où l’obtenir |
|----------|-------------|--------------|
| `NEXT_PUBLIC_APP_URL` | URL publique de l’app (SEO, sitemap) | Ex. `https://lebanonmonitor-production.up.railway.app` |
| `INGEST_SECRET` | Secret pour l’endpoint d’ingestion (cron) | Générer avec `openssl rand -hex 24` (voir section 7) |

### 6.3 Où les ajouter

1. Service Web → **Variables**
2. **+ New Variable** pour chaque variable
3. Nom = nom de la variable, Valeur = valeur ou référence `${{ ... }}`

---

## 7. Configurer l'ingestion des événements

Sans ingestion, le dashboard affiche **0 événement**. Deux options :

### Option A : cron-job.org (recommandé — gratuit, pas de service supplémentaire)

#### Étape 1 : Générer INGEST_SECRET

Sur ton PC (PowerShell ou Git Bash) :

```powershell
# Si tu as OpenSSL (Git Bash, WSL, ou installé) :
openssl rand -hex 24
```

Sinon, génère une clé aléatoire de 48 caractères hexadécimaux sur [randomkeygen.com](https://randomkeygen.com/) (onglet "CodeIgniter Encryption Keys").

Exemple de résultat : `a1b2c3d4e5f6789012345678901234567890abcdef`

#### Étape 2 : Ajouter INGEST_SECRET sur Railway

1. Service Web → **Variables**
2. **+ New Variable**
3. Nom : `INGEST_SECRET`
4. Valeur : la clé générée (ex. `a1b2c3d4e5f6...`)
5. **Add**

#### Étape 3 : Créer le cron sur cron-job.org

1. Va sur **https://cron-job.org**
2. **Sign up** (gratuit) ou **Login**
3. **Create cronjob**
4. Remplis :
   - **Title** : `Lebanon Monitor Ingest`
   - **URL** : `https://lebanonmonitor-production.up.railway.app/api/admin/ingest`
   - **Schedule** : `*/5 * * * *` (toutes les 5 minutes) ou utilise l’interface pour "Every 5 minutes"
   - **Request Method** : `POST`
5. Section **Request** :
   - **Headers** : ajoute un header
     - Name : `X-Ingest-Secret`
     - Value : ta valeur `INGEST_SECRET` (celle ajoutée sur Railway)
6. **Create**

#### Étape 4 : Vérifier

- Attends 5–10 minutes
- Ouvre `https://lebanonmonitor-production.up.railway.app`
- Les événements devraient apparaître progressivement

### Option B : Service Worker Railway

Si tu préfères un worker dédié (coût supplémentaire ~5 €/mois) :

1. **+ New** → **Empty Service**
2. **Settings** → **Connect Repo** → même repo `Lebanon_Monitor`
3. **Settings** → **Deploy** → **Custom Start Command** : `npm run worker`
4. **Variables** : `DATABASE_URL` = `${{ Postgres.DATABASE_URL }}`
5. Optionnel : `ANTHROPIC_API_KEY`, `HF_API_TOKEN` pour classification et traduction

---

## 8. Clés API optionnelles

Ces clés améliorent les sources de données. Toutes sont **optionnelles**.

| Variable | Rôle | Où l’obtenir |
|----------|------|--------------|
| `OWM_API_KEY` | Météo Beyrouth | [openweathermap.org/api](https://openweathermap.org/api) — gratuit |
| `FIRMS_MAP_KEY` | Incendies NASA | [firms.modaps.eosdis.nasa.gov](https://firms.modaps.eosdis.nasa.gov/api/map_key/) — gratuit |
| `CF_API_TOKEN` | Cloudflare Radar | [dash.cloudflare.com](https://dash.cloudflare.com/) → Profile → API Tokens |
| `OPENAQ_API_KEY` | Qualité de l’air | [explore.openaq.org/register](https://explore.openaq.org/register) — gratuit |
| `ANTHROPIC_API_KEY` | Classification LLM (titres ambigus) | [console.anthropic.com](https://console.anthropic.com/) |
| `HF_API_TOKEN` | Traduction AR/FR/EN | [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) — gratuit |
| `ACLED_API_KEY` + `ACLED_EMAIL` | Données conflits ACLED | [acleddata.com/register](https://acleddata.com/register) — compte chercheur |
| `UCDP_ACCESS_TOKEN` | Données UCDP | Demander à mertcan.yilmaz@pcr.uu.se |
| `RELIEFWEB_APPNAME` | ReliefWeb | Voir ci-dessous |

### ReliefWeb — Appname (avec ton email)

1. Va sur **https://apidoc.reliefweb.int/**
2. Section **Appname** : demande un appname avec ton email **sami.nakib@etu.cyu.fr**
3. Format typique : `SamiNakib-lebanonmonitor-xxxx` (ReliefWeb te l’enverra par email)
4. Ajoute sur Railway : `RELIEFWEB_APPNAME` = la valeur reçue

---

## 9. Vérifications finales

### 9.1 Health check

Ouvre : `https://lebanonmonitor-production.up.railway.app/api/health`

Tu dois voir :

```json
{
  "status": "ok",
  "database": "connected",
  "databaseUrlSet": true,
  "sources": [...]
}
```

### 9.2 Dashboard

1. Ouvre `https://lebanonmonitor-production.up.railway.app`
2. Vérifie : carte, feed d’événements, indicateurs (LBP, météo si configurés)
3. Si 0 événement : attends 5–10 min (cron) ou vérifie que le Worker tourne

### 9.3 API v2

- Événements : `https://lebanonmonitor-production.up.railway.app/api/v2/events?limit=5`
- Stats : `https://lebanonmonitor-production.up.railway.app/api/v2/stats`

---

## 10. Dépannage

| Problème | Solution |
|----------|----------|
| **Build échoue** | Vérifie que `npm run build` passe en local. Le projet utilise `--webpack` (pas Turbopack). |
| **`ENOTFOUND postgres.railway.internal`** | Ajoute `DATABASE_PUBLIC_URL` = `${{ Postgres.DATABASE_PUBLIC_URL }}` sur le service Web. |
| **`database: "disconnected"`** | Vérifie que `DATABASE_URL` est bien une référence `${{ Postgres.DATABASE_URL }}` et que Web et Postgres sont dans le même projet. |
| **0 événements** | 1) Vérifie que les migrations ont été exécutées. 2) Configure cron-job.org (Option A) ou le Worker (Option B). 3) Attends 5–10 min. |
| **`INGEST_SECRET not configured`** | Ajoute la variable `INGEST_SECRET` sur Railway (section 7, Option A). |
| **401 Unauthorized** sur `/api/admin/ingest` | Vérifie que le header `X-Ingest-Secret` sur cron-job.org correspond exactement à `INGEST_SECRET` sur Railway. |
| **Timeout healthcheck** | Railway utilise `/api/health/live`. Vérifie que cette route répond (pas d’appels externes). |

---

## Récapitulatif des étapes

1. ✅ Créer le projet Railway (Deploy from GitHub)
2. ✅ Ajouter PostgreSQL
3. ✅ Lier `DATABASE_URL` au service Web
4. ✅ Exécuter migrations + seed avec `DATABASE_PUBLIC_URL`
5. ✅ Ajouter `NEXT_PUBLIC_APP_URL` et `INGEST_SECRET`
6. ✅ Configurer cron-job.org (URL + header `X-Ingest-Secret`)
7. ✅ (Optionnel) Ajouter les clés API (OWM, FIRMS, ReliefWeb, etc.)
8. ✅ Vérifier `/api/health` et le dashboard

---

**Contact** : Sami Nakib — sami.nakib@etu.cyu.fr
