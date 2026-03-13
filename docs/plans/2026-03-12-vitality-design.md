# Vitality Design — 12 mars 2026

## Objectif

Remplacer la logique produit **Lumière** (positivité / signaux positifs) par un module **Vitality** fondé sur des signaux explicites de continuité territoriale, reprise et capacité.

## Principes

- **Ne pas déduire la vitalité de la polarité lumiere/ombre.** La vitalité territoriale repose sur des indicateurs mesurables et des proxies, pas sur le classement positif/négatif des événements.
- **Séparer** : measured, proxy, estimable, narrative.
- **Couverture et gaps explicites** : documenter ce qui est disponible et ce qui manque.

## Structure du contrat Vitality

- `summary` — résumé synthétique
- `measuredIndicators` — LBP, EDL heures, pannes internet (données brutes)
- `proxyIndicators` — projets WB, infrastructure, volatilité LBP
- `narrativeSignals` — rapports ReliefWeb (Recovery, Education, Health)
- `supportingEvents` — événements type reconstruction, solidarité, continuité
- `supportingPlaces` — territoires couverts (gouvernorats)
- `coverage` — ce que les données couvrent
- `gaps` — ce qui manque
- `caveats` — avertissements

## API

- `GET /api/v2/vitality` — vitalité globale
- `GET /api/v2/places/[id]/vitality` — vitalité scopée à un lieu
