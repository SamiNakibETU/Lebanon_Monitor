# Alimenter le dashboard (projet déjà en ligne)

**Projet** : https://lebanonmonitor-production.up.railway.app/  
**Problème** : 0 événements car le worker n'alimente pas la base.

---

## Option 1 : Une fois (pour tester tout de suite)

### Étape 1 : Copier l'URL de la base

1. Va sur [Railway](https://railway.app) → ton projet
2. Clique sur le service **Postgres**
3. Onglet **Variables**
4. Copie la valeur de **`DATABASE_PUBLIC_URL`** (clic sur l'icône copier)

### Étape 2 : Lancer le worker une fois

Ouvre PowerShell dans le dossier du projet :

**Méthode A** (URL en argument) :
```powershell
cd D:\Users\Proprietaire\Desktop\Projet_perso\LEBANON_MONITOR
npm run railway:ingest "COLLE_ICI_L_URL_COPIEE"
```

**Méthode B** (variable d'environnement) :
```powershell
$env:DATABASE_URL="COLLE_ICI_L_URL_COPIEE"
npm run worker:once
```

Remplace `COLLE_ICI_L_URL_COPIEE` par l'URL (ex. `postgresql://postgres:xxx@xxx.proxy.rlwy.net:12345/railway`).

### Étape 3 : Vérifier

- Attends 1–2 min (le worker ingère GDELT, RSS, Twitter, etc.)
- Ouvre https://lebanonmonitor-production.up.railway.app/
- Les événements devraient apparaître

---

## Option 2 : En continu (cron toutes les 5 min)

### Étape 1 : Générer un secret

```powershell
openssl rand -hex 24
```

(Si pas d'OpenSSL : [randomkeygen.com](https://randomkeygen.com/) → "CodeIgniter Encryption Keys")

### Étape 2 : Ajouter sur Railway

1. Railway → service **Web** (ton app) → **Variables**
2. **+ New Variable**
3. Nom : `INGEST_SECRET`
4. Valeur : la clé générée
5. **Add** → Railway redéploie

### Étape 3 : Créer le cron sur cron-job.org

1. Va sur [cron-job.org](https://cron-job.org) → **Create cronjob**
2. **URL** : `https://lebanonmonitor-production.up.railway.app/api/admin/ingest`
3. **Request Method** : `POST`
4. **Headers** : `X-Ingest-Secret` = ta valeur `INGEST_SECRET`
5. **Schedule** : toutes les 5 minutes
6. **Create**

Après 5–10 min, le dashboard se remplit automatiquement.

---

## Traduction (FR / EN / AR)

Pour que le sélecteur de langue affiche des titres traduits, ajoute **`HF_API_TOKEN`** sur Railway :

1. Crée un token sur [Hugging Face](https://huggingface.co/settings/tokens)
2. Railway → service Web → Variables → `HF_API_TOKEN` = ton token
3. Les nouveaux événements ingérés seront traduits automatiquement (AR↔FR↔EN via Opus-MT)
4. **Pour les événements déjà en base** : après avoir configuré `HF_API_TOKEN`, exécute `npm run backfill:translations` (avec `DATABASE_URL` et `HF_API_TOKEN`) pour les traduire.

Sans ce token, les titres restent dans la langue d'origine.

---

## Classification (Lumière / Ombre)

La classification utilise des mots-clés + optionnellement Claude (ANTHROPIC_API_KEY). Pour améliorer la précision, tu peux ajuster les dictionnaires dans `src/core/classification/dictionaries/`.

---

## Résumé

| Action | Commande / Où |
|--------|----------------|
| Alimenter une fois | `$env:DATABASE_URL="..."; npm run worker:once` |
| Alimenter en continu | INGEST_SECRET sur Railway + cron sur cron-job.org |
| Traduction FR/EN/AR | HF_API_TOKEN sur Railway |
| Backfill traductions (événements existants) | `npm run backfill:translations` avec DATABASE_URL + HF_API_TOKEN |
