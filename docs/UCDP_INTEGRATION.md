# UCDP API — Intégration

## Statut

**Module créé, non branché au registry.** Utiliser une fois la base de données stabilisée.

## Configuration

1. Ajouter dans `.env.local` :
   ```
   UCDP_ACCESS_TOKEN=<votre-token>
   ```

2. Token fourni par UCDP (Mert Can Yilmaz) — à utiliser dans l’en-tête :
   `x-ucdp-access-token`

## Fichiers

- `src/sources/ucdp/` — fetcher, normalizer, types
- Filtre : `Country=660` (Lebanon, Gleditsch-Ward)

## Branchement ultérieur

1. Importer dans `registry.ts` : `runUcdp`, `normalizeUcdp`
2. Appeler dans `Promise.allSettled`
3. Normaliser et fusionner avec les autres événements
4. Appliquer `classify` et `deduplicateEvents` comme pour les autres sources

## Limites API

- 5 000 requêtes/jour
- Reset à minuit UTC
