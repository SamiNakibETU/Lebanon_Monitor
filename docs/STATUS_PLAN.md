# Lebanon Monitor V2 — État du plan et étapes détaillées

**Dernière mise à jour** : 7 mars 2025

---

## 1. OÙ ON EN EST

### Sprint 1 — Foundation ✅ (terminé)
| Tâche | Statut |
|-------|--------|
| Worker `src/worker/index.ts` | ✅ |
| Pipeline ingest → normalize → classify → store | ✅ |
| Pre-classifier avec negation check | ✅ |
| `raw_ingest` → `source_item` → `event` | ✅ |
| `indicator_snapshot` (LBP, weather, AQI) | ✅ |
| `/api/v2/events` (lecture DB) | ✅ |
| `/api/v2/indicators` | ✅ |
| BentoCard + Norgram layout | ✅ |
| Header (lang FR/EN/AR, LBP, weather, clock) | ✅ |
| Dark theme Norgram (#000, #0D0D0D) | ✅ |

### Sprint 2 — Intelligence ✅ (terminé)
| Tâche | Statut |
|-------|--------|
| Claude Haiku pour classification ambiguë | ✅ |
| Pre-classifier negation ("refus" → LLM) | ✅ |
| HF Opus-MT traduction (AR↔FR↔EN) | ✅ |
| Stockage `event_translation` | ✅ |
| Language selector | ✅ |
| D3 charts (Timeline, CategoryBars, SourceDonut, OmbreGauge, LBPSparkline) | ✅ |
| ResizeObserver (pas ResponsiveContainer) | ✅ |
| RTL (document.dir) | ✅ |

### Sprint 3 — Sources + Map + CCTV ✅ (terminé)
| Tâche | Statut |
|-------|--------|
| Telegram dans connector registry | ✅ |
| ACLED | ✅ |
| UCDP | ✅ |
| MapLibre GL (carte unique, clustering) | ✅ |
| CCTV multi-source (Al Jadeed → MTV → LBCI → Al Jazeera) | ✅ |
| Pills de sélection de source CCTV | ✅ |
| EventCard v2 (ligne, dot 6px, catégorie) | ✅ |
| EventFeedWidget | ✅ |
| Décodage URL arabe (Twitter) | ✅ |
| Page détail `/event/[id]` | ✅ |

### Sprint 4 — Polish + Deploy 🔄 (partiel)
| Tâche | Statut |
|-------|--------|
| Trending clusters | ✅ (algorithme existant) |
| Notification toasts (critical events) | ⏳ |
| Export CSV/JSON | ✅ |
| Event detail page | ✅ |
| SEO (meta, sitemap) | ⏳ |
| Performance (ISR, lazy load) | ⏳ |
| Déploiement Railway (Web + Worker) | ⏳ |
| 150+ tests | ⏳ (131 actuellement) |

---

## 2. CE QUI RESTE À FAIRE (par priorité)

### Priorité 1 — Avoir des données (CRITIQUE)
Sans DB + worker, le dashboard affiche "No events yet".

### Priorité 2 — Clés API optionnelles
Pour plus de sources et de fonctionnalités.

### Priorité 3 — Polish
Toasts, SEO, raccourcis clavier, etc.

---

## 3. ÉTAPES DÉTAILLÉES — OPTION A : LOCAL (Windows)

### Étape 1 : Vérifier PostgreSQL
```powershell
# Démarrer PostgreSQL (si pas déjà lancé)
& "D:\app\postgresql\bin\pg_ctl.exe" -D "D:\app\postgresql\data" start

# OU si installé ailleurs, cherche pg_ctl.exe :
# Get-ChildItem -Path D:\ -Filter pg_ctl.exe -Recurse -ErrorAction SilentlyContinue | Select-Object FullName
```

### Étape 2 : Créer la base
```powershell
# Connexion (remplace le chemin si nécessaire)
& "D:\app\postgresql\bin\psql.exe" -U postgres -h localhost -d postgres

# Si "rôle postgres n'existe pas", essaie ton compte Windows :
# & "D:\app\postgresql\bin\psql.exe" -U Proprietaire -h localhost -d postgres

# Dans psql (quand tu vois postgres=#) :
CREATE DATABASE lebanon_monitor;
\c lebanon_monitor
\q
```

### Étape 3 : Configurer .env.local
À la racine du projet, crée ou modifie `.env.local` :

```
DATABASE_URL=postgresql://Proprietaire@localhost:5432/lebanon_monitor
```

Avec mot de passe :
```
DATABASE_URL=postgresql://Proprietaire:TON_MOT_DE_PASSE@localhost:5432/lebanon_monitor
```

### Étape 4 : Migrations
```powershell
cd D:\Users\Proprietaire\Desktop\Projet_perso\LEBANON_MONITOR
npm run db:migrate
npm run db:seed
```

### Étape 5 : Vérifier la DB
```powershell
npm run db:check
```
→ Doit afficher "DB OK".

### Étape 6 : Lancer le worker (terminal 1)
```powershell
npm run worker
```
Le worker tourne en boucle (toutes les 5 min). Laisse-le ouvert.

### Étape 7 : Lancer l'app (terminal 2)
```powershell
npm run dev
```

### Étape 8 : Ouvrir le dashboard
http://localhost:3000

Les événements apparaîtront après le premier cycle du worker (~1–2 min).

---

## 4. ÉTAPES DÉTAILLÉES — OPTION B : RAILWAY (prod)

### Étape 1 : Projet Railway
1. Va sur [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub repo**
3. Sélectionne `LEBANON_MONITOR`
4. Railway détecte Next.js et déploie

### Étape 2 : Ajouter PostgreSQL
1. Dans le projet → **+ New**
2. **Database** → **PostgreSQL**
3. Attendre le déploiement

### Étape 3 : Lier DATABASE_URL au service Web
1. Clique sur le **service Web** (ton app)
2. **Variables** → **New Variable**
3. Nom : `DATABASE_URL`
4. Valeur : `${{ Postgres.DATABASE_URL }}` (remplace Postgres par le nom exact du service PostgreSQL)
5. **Add** puis **Deploy** si besoin

### Étape 4 : Migrations (une seule fois)
1. Clique sur le service **PostgreSQL**
2. **Variables** → copie `DATABASE_PUBLIC_URL`
3. Sur ton PC :
```powershell
$env:DATABASE_URL="postgresql://postgres:XXXX@XXXX.proxy.rlwy.net:XXXX/railway"
npm run db:migrate
npm run db:seed
```
(Colle la vraie URL à la place)

### Étape 5 : Déployer le Worker
1. **+ New** → **Empty Service**
2. **Settings** → **Connect Repo** → même repo LEBANON_MONITOR
3. **Settings** → **Build** : Root Directory = `/`, Build Command = `npm run build`
4. **Settings** → **Deploy** → **Custom Start Command** : `npm run worker`
5. **Variables** : ajoute `DATABASE_URL` = `${{ Postgres.DATABASE_URL }}`
6. (Optionnel) `ANTHROPIC_API_KEY`, `HF_API_TOKEN` pour classification LLM et traduction

### Étape 6 : Vérifier
- `https://ton-app.railway.app/api/health` → `database: "connected"`
- Dashboard → événements après 1–2 cycles worker

---

## 5. VARIABLES D'ENVIRONNEMENT (référence)

| Variable | Obligatoire | Rôle |
|---------|-------------|------|
| `DATABASE_URL` | Oui | Connexion PostgreSQL |
| `ANTHROPIC_API_KEY` | Non | Classification LLM (Macron/cessez-le-feu etc.) |
| `HF_API_TOKEN` | Non | Traduction HF Opus-MT |
| `TELEGRAM_RSS_URLS` | Non | URLs RSS des chaînes Telegram (séparées par virgule) |
| `ACLED_API_KEY` + `ACLED_EMAIL` | Non | ACLED (conflits) |
| `UCDP_ACCESS_TOKEN` | Non | UCDP (violence) |
| `OWM_API_KEY` | Non | Météo Beyrouth |
| `OPENAQ_API_KEY` | Non | Qualité de l'air |
| `RELIEFWEB_APPNAME` | Non | ReliefWeb |

---

## 6. RÉSUMÉ

**État actuel** : Sprint 1–3 terminés. Le code est prêt. Il manque surtout :
1. **DB + worker** pour avoir des données
2. **Déploiement Railway** (Web + Worker) pour la prod
3. Quelques finitions (toasts, SEO, tests)

**Prochaine action recommandée** : Suivre les étapes de la section 3 (local) ou 4 (Railway) pour avoir un dashboard fonctionnel avec des événements.
