# Diagnostic Railway — Pourquoi ça ne marche pas

## 1. URL de ton app

**ton-app.railway.app** renvoie la page par défaut Railway (ASCII art), pas ton app. Ça veut dire :
- Soit le domaine n’est pas lié au bon service
- Soit le build/deploy a échoué
- Soit le service a planté

**À faire** : Railway → ton projet → **service Web** (celui où tu as mis les variables) → onglet **Settings** → **Networking** → **Public Networking**. Note l’URL exacte (ex. `lebanon-monitor-production-xxx.up.railway.app`). C’est celle-là qu’il faut utiliser, pas forcément ton-app.

---

## 2. Variables à corriger

### DATABASE_URL — Utiliser la référence interne

Sur Railway, le **service Web** et **Postgres** sont sur le même réseau. Il faut utiliser l’URL interne :

- **À FAIRE** : Supprime la valeur manuelle de `DATABASE_URL`
- **À FAIRE** : Add Variable → Nom : `DATABASE_URL` → Add Reference → **Postgres** → **DATABASE_URL**

Tu dois obtenir : `${{ Postgres.DATABASE_URL }}` (Railway remplacera par l’URL interne au déploiement).

### DATABASE_PUBLIC_URL — À retirer du service Web

`DATABASE_PUBLIC_URL` sert **uniquement** pour les connexions depuis ta machine (migrations, db:reset).  
Sur le service Web Railway, **retire-la** : le client DB utilisera `DATABASE_URL` (référence interne).

### INGEST_SECRET — Caractères spéciaux

Ta valeur `cYeZ_g1kx,0*K:3zzAyqGk9_@(j-]>Qo` contient `,` `*` `:` `(` `)` `]` `>` qui peuvent poser problème.

Génère une nouvelle clé :
```powershell
openssl rand -hex 24
```
Remplace `INGEST_SECRET` par le résultat (ex. `a1b2c3d4e5f6...`).

---

## 3. Base de données — Reset obligatoire

Ta base a été créée avec une ancienne migration (PostGIS). Il faut la réinitialiser.

En local, avec ton `.env.local` contenant **uniquement** :
```
DATABASE_PUBLIC_URL=postgresql://postgres:ySeOcLDFlZEzXDiqhQtFjBVtllljHNaJ@shinkansen.proxy.rlwy.net:25763/railway
```

Lance :
```powershell
npm run db:reset
```

---

## 4. Vérifier le déploiement

1. Railway → service Web → **Deployments** → dernier deploy → **View Logs**
2. Build OK ? Erreurs ?
3. Au démarrage, le healthcheck `/api/health/live` doit renvoyer 200.

---

## 5. Checklist finale

| Étape | Action |
|-------|--------|
| 1 | Supprimer `DATABASE_PUBLIC_URL` des variables du service Web |
| 2 | Remplacer `DATABASE_URL` par la référence `${{ Postgres.DATABASE_URL }}` |
| 3 | Regénérer `INGEST_SECRET` (openssl rand -hex 24) |
| 4 | En local : `npm run db:reset` avec DATABASE_PUBLIC_URL dans .env.local |
| 5 | Noter l’URL réelle du service (Settings → Networking) |
| 6 | Tester : `https://TON-URL-REELLE/api/v2/health` |
