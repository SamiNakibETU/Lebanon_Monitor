# Lebanon Monitor — Document Directeur Stratégique

**Version** : 1.0  
**Date** : 12 mars 2026  
**Nature** : Plan directeur pour la transformation en plateforme d'intelligence géotemporelle

---

## 1. Résumé exécutif

**Ce qu'est le projet aujourd'hui** : Un dashboard OSINT éditorial pour le Liban qui agrège 14 connecteurs (GDELT, USGS, FIRMS, RSS, GDACS, ReliefWeb, Weather, Cloudflare, LBP, OpenAQ, Twitter, UCDP, Telegram), classifie les événements en Lumière/Ombre/Neutre, les affiche sur une carte MapLibre avec heatmap bicolore, et propose des synthèses AI (Groq/Anthropic), des signaux composites et une UI Norgram. Le pipeline d'ingestion persistant (raw_ingest → source_item → event → event_observation) est réel et fonctionnel. Le produit reste toutefois un agrégateur enrichi, pas une plateforme d'intelligence.

**Ce qu'il pourrait devenir** : Une plateforme d'intelligence géotemporelle centrée sur le Liban, avec ontologie explicite, claim graph, moteur d'épisodes, géospatial analytique (emprises, incertitude, multi-résolution), module de vitalité/continuité en remplacement du Lumière décoratif, et agents IA outillés sur un monde structuré.

**Les 5 problèmes principaux** :

1. **Ontologie implicite** : Aucune séparation claire entre document, claim, fait, inférence, hypothèse. Les "événements" mélangent tout.
2. **Clustering nominal** : `/api/v2/clusters` renvoie des trending event_type, pas des clusters sémantiques. `event_cluster` existe en DB mais n'est pas exposé. Pas de moteur d'épisodes.
3. **Géolocalisation faible** : Majorité des coords via `getCityCoords()` inférées depuis le titre. Gazetteer limité. Pas d'emprises, incertitude ni multi-résolution.
4. **Lumière éditorial** : Le module Lumière reste une rubrique "positif" (reconstruction, culture) sans modèle analytique de continuité, vitalité ou capacité territoriale.
5. **Signaux composites sans causalité** : Les "signals" sont des heuristiques (spike volume, dominance ombre, convergence zone) sans modèle causal ni claim graph.

**Les 5 décisions structurantes** :

1. **Adopter une ontologie explicite** (Actor, Event, Claim, Episode, Place, Infrastructure, etc.) et un claim graph.
2. **Construire un moteur d'épisodes** qui fusionne signaux en épisodes et gère rattachement / création.
3. **Remplacer Lumière par un module Vitalité/Continuité** centré sur continuité fonctionnelle, reprise locale et capacité territoriale.
4. **Renforcer la géospatialité** : emprises, incertitude, multi-résolution, relation place-infrastructure.
5. **Cibler l'analyste** plutôt que le grand public : prioriser profondeur et mémoire sur viralité.

---

## 2. Reconstitution du système actuel

### 2.1 Architecture front

- **Stack** : Next.js 16 App Router, React 18, Tailwind CSS, MapLibre GL, D3.js, SWR.
- **Structure** : `src/app/page.tsx` assemble des sections scrollables : HeroMap (plein écran puis mini-carte), SectionLumiereOmbre, SectionInfrastructure, SectionEconomie, SectionGeopolitique, SectionLumiere, SectionLive, Footer.
- **État** : Pas de state global. Langue dans `localStorage`, chaque widget fetch ses propres APIs via SWR.
- **Vues** : Home (dashboard), Search (`/search`), Event detail (`/event/[id]`).
- **Points fragiles** : Duplication de logique map (HeroMap vs MapWidget), pas de bootstrap wiring, widgets indépendants sans hydration SSR.

### 2.2 Architecture back

- **Pipeline DB** : `runIngest()` → `raw_ingest` ; `runNormalize()` → `source_item` ; classify (pre-classifier + keywords + tone + Groq batch) ; enrich (language, entities, place resolution) ; geocode (locality-extractor, fallback LLM) ; dedupe (Jaccard) ; `storeNewEvent` / `linkToExistingEvent` ; `translateAndStore` ; `runIndicators` ; `runCluster`.
- **Worker** : `npm run worker` — boucle 5 min, ou `POST /api/admin/ingest` déclenché par cron-job.org.
- **APIs** : 45+ routes sous `src/app/api/v2/` : events, search, synthesis, indicators, signals, convergence, clusters, timeline, analyst-workbench, bootstrap, etc.
- **Stockage** : PostgreSQL (Railway), Upstash Redis (cache synthesis, indicators, bootstrap partiel), raw payloads en JSONB inline dans `raw_ingest`.

### 2.3 Flux de données — deux plans coexistent

**Plan A (principal)** : `connector-registry` → fetch → raw_ingest → normalize → classify → enrich → geocode → dedupe → store (event + event_observation) → translate → indicators → cluster. Lecture via `/api/v2/events`, `/api/v2/search`, etc.

**Plan B (legacy, non utilisé par le dashboard actuel)** : `sources/registry.ts` `fetchAll()` — fetch direct, classify, dedupe, enrich, cluster en mémoire. Utilisé par `/api/events`, `/api/indicators`, `/api/health` si jamais appelés. Cache 1 min. Pas de persistance.

### 2.4 Logique UI

- Split Lumière (crème #F5F2EE) / Ombre (#0A0A0A) dans SectionLumiereOmbre.
- AISynthesis, IndicatorStrip, EventTrendChart, CondensedFeed par variante.
- SectionLumiere : ReconstructionWidget, CultureWidget, SolidarityActiveWidget, LumiereBoard (Now / Momentum / Structural).
- SectionGeopolitique : ConflictGauge, ACLEDMiniMap, PolymarketWidget, UNIFILWidget, RegionalWidget, SignalsWidget, CausalTimelineWidget, etc.

### 2.5 Logique map

- HeroMap : MapLibre GL, CARTO Dark Matter, centre Liban, heatmaps Lumière/Ombre, layers (events, strikes, convergence, flights, fires, infra, unifil, media, statements), pills de toggle, playback 6–72h, mode analyste (filtres confidence/geo/multiSource).
- Données : `/api/v2/events`, FIRMS, OpenSky positions, infrastructure GeoJSON statique, convergence, UNIFIL, social-feed, official-statements, regional.
- Popups sur events, strikes, flights, fires, convergence, UNIFIL, infra.

### 2.6 Logique ingestion

- 14 connecteurs actifs : gdelt, usgs, firms, rss, gdacs, reliefweb, weather, cloudflare, lbp-rate, openaq, twitter, ucdp, telegram.
- ACLED et Telegram souvent "not configured" (clés manquantes).
- Normalisation vers `LebanonEvent`, déduplication Jaccard, enrichissement (langue, entités, résolution lieu), géocodage (gazetteer ou LLM), scoring Lumière.

### 2.7 Logique catégorielle

- Pre-classifier (HARD_OMBRE, HARD_LUMIERE, NEGATION) → ~60 % classés.
- Ensemble : keywords 0.35 + tone 0.2 + HF 0.45 si disponible.
- Groq batch pour cas ambigus (max 15–30 par run).
- Catégories Ombre : armed_conflict, displacement, violence, economic_crisis, political_tension, environmental_negative.
- Catégories Lumière : cultural_event, reconstruction, solidarity, institutional_progress, environmental_positive, economic_positive, international_recognition.

### 2.8 Logique IA actuelle

- **Classification** : Groq (Llama) pour titres ambigus.
- **Traduction** : HuggingFace Opus-MT (ar↔fr↔en), fire-and-forget.
- **Synthèse** : Groq ou Anthropic, 2×/jour (8h et 20h Beyrouth), Redis cache 12h.
- **Brief par event** : Groq on-demand, cache 1h.
- **Convergence briefs** : Groq pour les 5 zones principales.
- Pas d'agents autonomes, pas de retrieval structuré multi-couche.

### 2.9 Logique documentaire

- `raw_ingest` stocke `response_metadata.raw` (JSONB). Pas de S3/bucket.
- `source_item` : observed_title, observed_summary, raw_data.
- `event` : canonical_title, canonical_summary, metadata (latitude, longitude, source, evidence, etc.).
- `event_observation` : lien source_item ↔ event, matching_confidence, dedup_reason.
- Tables `entity`, `event_entity`, `media_asset`, `verification_record`, `narrative_frame`, `event_relationship` : schéma présent, **non alimentées** par le pipeline actuel.

### 2.10 Ce qui est réel, partiel, aspirational

| Élément | Statut |
|---------|--------|
| Pipeline ingest → store | Réel |
| Classification pre + ensemble + Groq | Réel |
| Traduction HF | Réel (si clé configurée) |
| Synthèse AI | Réel |
| event_cluster (DB) | Partiel — alimenté par runCluster (Jaccard titre), pas exposé via API |
| /api/v2/clusters | Trompeur — retourne trending event_type, pas clusters |
| entity, event_entity | Aspirational — schéma seul |
| narrative_frame, event_relationship | Aspirational |
| PostGIS geometry | Aspirational — schéma utilise lat/lng |
| ACLED, Telegram | Partiel — connecteurs présents, souvent non configurés |
| Bootstrap | Partiel — endpoint existe, non utilisé par le front |

---

## 3. Diagnostic stratégique du projet actuel

### 3.1 Proposition de valeur réelle

- **Forte** : focalisation pays unique, combinaison de signaux hétérogènes, design Norgram cohérent, synthèse Lumière/Ombre distinctive, pipeline de données fonctionnel.
- **Faible** : pas de mémoire analytique, pas de raisonnement structuré, pas de séparation claim/fait, géolocalisation illustrative.

### 3.2 Niveau de maturité

- **Pipeline** : ~75 % — ingestion, normalisation, classification, stockage, traduction opérationnels.
- **Analytique** : ~25 % — signaux heuristiques, convergence par zone, pas de claim graph ni épisodes.
- **Géospatial** : ~30 % — points sur carte, heatmap, pas d'emprises ni incertitude.
- **Produit** : ~50 % — UI riche mais juxtaposition de widgets, pas d'architecture produit adulte.

### 3.3 Cohérence produit

- **Incohérence majeure** : La vision V4 parle de "système nerveux", convergence de signaux, profondeur. Le runtime est un dashboard avec flux, cartes et synthèses. Pas de knowledge graph, pas d'épisodes, pas de claims.
- **Dérive documents** : STATUS_PLAN dit ACLED/MapLibre "done" ; AUDIT_EXPERT dit ACLED non configuré, carte interactive corrigée récemment.

### 3.4 Profondeur géopolitique

- **Suffisante pour** : suivi opérationnel quotidien, vue d'ensemble sécurité/économie/culture.
- **Insuffisante pour** : analyse de causalité, mémoire des épisodes, identification des acteurs et de leurs relations, territorialité fine.

### 3.5 Profondeur technique

- **Points forts** : pipeline modulaire, connecteurs déclaratifs, classification multi-source, évidence/convergence partiellement modélisées.
- **Points faibles** : pas de graphe, pas de vector store, recherche full-text basique, pas de retrieval sémantique.

### 3.6 Faiblesses structurelles

- Absence d'ontologie explicite.
- Pas de distinction document / claim / fait / hypothèse.
- Pas de moteur d'épisodes.
- Géolocalisation largement inférée.
- Lumière = rubrique positive, pas modèle analytique.

### 3.7 Illusions de sophistication

| Module | Apparence | Réalité |
|--------|-----------|---------|
| /api/v2/clusters | Clusters d'événements | Trending event_type sur 24h |
| Analyst Workbench | Outil analyste | Liste events avec claim_count = observation_count |
| Signals | Signaux faibles | Heuristiques (spike, ombre dominance, convergence zone, LBP delta) |
| Convergence | Zone de convergence | Agrégation par resolvedPlaceName/admin1, score heuristique |
| event_cluster | Clustering sémantique | Jaccard sur titres, par event_type |

### 3.8 Zones prometteuses

- Pipeline de données solide.
- Design system cohérent.
- Synthèse Lumière/Ombre et brief par event utiles.
- Structure evidence/convergence dans event_observation.
- Gazetter et locality-extractor déjà en place.

---

## 4. Reformulation stratégique du produit cible

### 4.1 Nature du produit cible

Plateforme d'intelligence géotemporelle sur le Liban : représentation structurée des événements, épisodes, acteurs, lieux, infrastructures, claims et signaux, avec mémoire analytique, lien cohérent entre entités, et outils d'exploration (carte, timelines, épisodes, requêtes analystes).

### 4.2 Trois options de repositionnement produit

**Option A — Outil analyste premium**  
Public : analystes, ONG, décideurs, journalistes. Valeur : profondeur, mémoire, épisodes, claim graph. UX : requêtes, exploration graphe, briefs. Prix : abonnement ou B2B.

**Option B — Dashboard OSINT public**  
Public : grand public intéressé par le Liban. Valeur : vue d'ensemble, synthèses, carte. UX : home épurée, sections thématiques. Gratuit, monétisation indirecte.

**Option C — Hybride analyste + public**  
Public : analystes (noyau) et curieux (périphérie). Valeur : même base de données, modes d'accès différents. UX : mode "overview" et mode "explore".

**Recommandation** : Option A. Le Liban comme pays unique justifie la profondeur ; le grand public n'a pas besoin d'épisodes ni de claim graph. Mieux vaut un outil analyste crédible qu'un dashboard grand public superficiel.

### 4.3 Public cible principal recommandé

Analystes OSINT, responsables de programme (ONG, agences), journalistes spécialisés, décideurs ayant besoin d'une vue structurée et mémorisée.

### 4.4 Publics secondaires

Étudiants en géopolitique, diaspora libanaise informée, think tanks.

### 4.5 Cas d'usage réels

- Suivre un épisode (ex. tensions Sud-Liban) sur la durée avec rattachement des nouveaux documents.
- Vérifier une affirmation (claim) via convergence de sources.
- Explorer les acteurs et lieux autour d'un événement.
- Évaluer la vitalité/continuité d'un territoire (remplacement Lumière).
- Recevoir des alertes sur signaux de convergence ou ruptures.

### 4.6 Valeur unique

Profondeur Liban + mémoire analytique + claim graph + épisodes + géospatial sérieux + module vitalité (pas juste "positif").

### 4.7 Différenciation

| Concurrent | Différence Lebanon Monitor |
|------------|----------------------------|
| Dashboard pays classique | Mémoire, épisodes, claims, ontologie |
| Outil OSINT générique | Focalisation Liban, multilangue, vitalité |
| Média augmenté | Pas éditorial, données structurées, requêtes |
| Knowledge graph pays | Spécificité Liban, claim-centric, géotemporal |

---

## 5. Architecture conceptuelle cible

```
┌─────────────────────────────────────────────────────────────────┐
│  COUCHE INGESTION                                                │
│  Connecteurs → raw_ingest (immuable)                             │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  COUCHE NORMALISATION                                            │
│  raw → source_item, extraction titre/summary/date/source         │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  COUCHE EXTRACTION                                               │
│  NER, entités (Person, Organization, Place), claims bruts        │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  COUCHE RÉSOLUTION D'ENTITÉS                                     │
│  Place resolution, entity disambiguation, linking               │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  COUCHE CLAIMS                                                   │
│  Extraction de claims, rattachement à Event, contradictions      │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  COUCHE ÉVÉNEMENTS                                               │
│  Document/Signal → Event, classification, géocodage              │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  COUCHE ÉPISODES                                                 │
│  Fusion d'events en Episode, rattachement, création nouvel       │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  COUCHE KNOWLEDGE GRAPH                                          │
│  Actor, Place, Infrastructure, Event, Episode, Claim, relations │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  COUCHE SIGNAUX                                                  │
│  Indicateurs, alertes, convergence, ruptures                    │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  COUCHE GÉOTEMPORELLE                                            │
│  Footprints, incertitude, multi-résolution, voisinage            │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  COUCHE MÉMOIRE                                                  │
│  Faits, épisodes, patterns, contradictions, territoriale      │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  COUCHE RETRIEVAL                                                │
│  Relationnel, graphe, sémantique, temporel, géospatial           │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  COUCHE AGENTS                                                   │
│  Synthèse, alerte, exploration, comparaison, qualification      │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  COUCHE PRODUIT / UX                                             │
│  Vues, navigation, carte, timelines, épisodes, requêtes         │
└─────────────────────────────────────────────────────────────────┘
```

### Rôle des couches

- **Ingestion** : capturer le brut sans transformation.
- **Normalisation** : schéma canonique source_item.
- **Extraction** : NER, claims bruts depuis texte.
- **Résolution d'entités** : unifier Person, Org, Place.
- **Claims** : modéliser affirmation, source, contradiction.
- **Événements** : créer Event à partir de document/signal.
- **Épisodes** : regrouper Events en Episode.
- **Knowledge graph** : graphe d'entités et relations.
- **Signaux** : indicateurs et alertes.
- **Géotemporal** : emprises, temps, incertitude.
- **Mémoire** : persistance analytique.
- **Retrieval** : accès multi-modal aux données.
- **Agents** : tâches LLM outillées.
- **Produit** : interfaces utilisateur.

---

## 6. Ontologie cible

### Actor (acteur abstrait)

- **Définition** : Entité pouvant agir ou être mentionnée (Person ou Organization).
- **Attributs** : name, type (person|organization), aliases, metadata.
- **Exemple libanais** : Hezbollah, Hassan Nasrallah, Banque du Liban.
- **Relations** : PART_OF, MENTIONED_IN, ACTOR_IN.

### Person

- **Définition** : Individu nommé.
- **Attributs** : name, role, aliases, affiliations.
- **Exemple** : Najib Mikati, Nabih Berri.
- **Relations** : MEMBER_OF, ACTOR_IN, MENTIONED_IN.

### Organization

- **Définition** : Groupe, parti, institution.
- **Attributs** : name, type, country, aliases.
- **Exemple** : UNIFIL, EDL, Amal.
- **Relations** : LOCATED_IN, PART_OF, ACTOR_IN.

### Place

- **Définition** : Lieu géographique.
- **Attributs** : name_primary, name_ar, name_fr, name_en, place_type, parent_id, lat, lng, bbox.
- **Exemple** : Beyrouth, Sud-Liban, Naqoura.
- **Relations** : PART_OF, NEAR, EXPOSED_TO.

### Infrastructure

- **Définition** : Équipement ou réseau (aéroport, port, centrale, hôpital).
- **Attributs** : name, type, place_id, status.
- **Exemple** : Aéroport Rafic Hariri, Port de Beyrouth.
- **Relations** : LOCATED_IN, AFFECTED_BY, DEPENDS_ON.

### Event

- **Définition** : Occurrence temporelle localisée, dérivée de documents/signaux.
- **Attributs** : canonical_title, canonical_summary, occurred_at, place_id, event_type, polarity_ui, confidence_score, verification_status.
- **Exemple** : Frappe aérienne sur Tyr, 12 mars 2026.
- **Relations** : PART_OF (Episode), HAS_CLAIM, LOCATED_AT, INVOLVES.

### Claim

- **Définition** : Affirmation extraite d'un document, rattachable à un Event.
- **Attributs** : text, source_document_id, event_id, confidence, status (asserted|contradicted|retracted).
- **Exemple** : "3 morts dans l'explosion" (source: Al Jazeera).
- **Relations** : ASSERTED_IN, ABOUT_EVENT, CONTRADICTS.

### Source

- **Définition** : Origine des données (connector).
- **Attributs** : name, category, reliability, ttl.
- **Relations** : PRODUCES (Document).

### Document

- **Définition** : Contenu brut ou normalisé ingéré.
- **Attributs** : source_id, external_id, observed_title, observed_summary, observed_at, raw_data.
- **Relations** : EXTRACTED_FROM, CONTAINS_CLAIM.

### Signal

- **Définition** : Indicateur ou mesure dérivée (trafic, LBP, AQI).
- **Attributs** : key, value, period_start, period_end, payload.
- **Relations** : CORRELATES_WITH (Event).

### Episode

- **Définition** : Séquence ou cluster d'Events liés temporellement et sémantiquement.
- **Attributs** : label, summary, first_event_at, last_event_at, event_count, footprint (géospatial).
- **Exemple** : "Tensions Sud-Liban mars 2026".
- **Relations** : CONTAINS (Event), FOLLOWS, PRECEDES.

### Narrative

- **Définition** : Cadre interprétatif (ex. "escalade", "cessez-le-feu").
- **Attributs** : label, cluster_id, summary.
- **Relations** : FRAMES (Episode).

### Project

- **Définition** : Projet structuré (reconstruction, développement).
- **Attributs** : name, status, funder, amount, place_id.
- **Exemple** : Projet UNICEF eau Akkar.
- **Relations** : LOCATED_IN, FUNDED_BY.

### Service

- **Définition** : Service public ou privé (électricité, eau, santé).
- **Attributs** : name, type, place_id, status.
- **Relations** : LOCATED_IN, AFFECTED_BY.

### Reconstruction project

- **Définition** : Projet de reconstruction explicite.
- **Attributs** : hérite de Project + sector, completion_pct.
- **Relations** : LOCATED_IN, FUNDED_BY.

### Cultural activity

- **Définition** : Événement culturel (festival, concert).
- **Attributs** : name, date, place_id, type.
- **Exemple** : Festival de Baalbeck.
- **Relations** : LOCATED_AT, PART_OF (Episode).

### Alert

- **Définition** : Alerte déclenchée par règles ou seuils.
- **Attributs** : type, severity, title, description, triggered_at, indicators.
- **Relations** : TRIGGERED_BY (Signal), ABOUT (Event/Episode).

### Hypothesis

- **Définition** : Hypothèse analytique (non vérifiée).
- **Attributs** : text, confidence, source, status.
- **Relations** : SUPPORTED_BY, CONTRADICTED_BY.

---

## 7. Modèle de données cible

### 7.1 Répartition des données

| Type | Stockage | Raison |
|------|----------|--------|
| Brut immuable | PostgreSQL `raw_ingest` ou S3 | Traçabilité |
| Normalisé | PostgreSQL `source_item`, `event`, `event_observation` | Requêtes relationnelles |
| Entités, relations | PostgreSQL + (optionnel) graphe | Entities, event_entity, place |
| Claims | PostgreSQL `claim`, `claim_source` | Requêtes, contradictions |
| Épisodes | PostgreSQL `episode`, `episode_event` | Requêtes temporelles |
| Embeddings | Vector store (pgvector ou externe) | Retrieval sémantique |
| Indicateurs | PostgreSQL `indicator_snapshot` | Time-series |
| Cache synthèses | Redis | Performance |

### 7.2 Tables/collections critiques

- **claim** : id, event_id, document_id, text, confidence, status, created_at.
- **episode** : id, label, summary, first_event_at, last_event_at, event_count, footprint_geojson, metadata.
- **episode_event** : episode_id, event_id, order.
- **entity** : id, name, entity_type, metadata (déjà en schéma, à alimenter).
- **event_entity** : event_id, entity_id, role (déjà en schéma).
- **place** : id, name_primary, place_type, lat, lng, bbox, parent_id (déjà, à étendre).

### 7.3 Règles de provenance

- Chaque event conserve `canonical_source_item_id`, `metadata.evidence`.
- Chaque claim référence document et event.
- Chaque observation a `matching_confidence`, `dedup_reason`.

### 7.4 Règles de timestamping

- `occurred_at` : date de l'occurrence réelle.
- `first_seen_at`, `last_seen_at` : fenêtre d'observation.
- `computed_at` pour indicateurs.

### 7.5 Confidence et lineage

- `confidence_score` 0–1 sur event.
- `verification_status` : unverified | partially_verified | verified | disputed.
- Lineage : metadata.chain pour traçabilité des étapes.

---

## 8. Claim Graph

### 8.1 Distinction document / claim / fait / hypothèse

- **Document** : source_item ou raw. Contenu brut.
- **Claim** : affirmation extraite ("X a fait Y", "Z morts").
- **Fait observé** : claim avec forte convergence multi-source, vérifié.
- **Hypothèse** : claim non vérifié, ou inférence analytique.

### 8.2 Extraction de claims

- Règles : patterns (nombre + mort/blessé, lieu + action).
- LLM : extraction structurée depuis titre/summary (JSON: claim_text, type, entities).
- Rattachement : claim → event_id (créé ou existant).

### 8.3 Rattachement à un événement

- Par similarité sémantique (embeddings) et fenêtre temporelle.
- Si aucun event proche : création nouvel event à partir du claim.

### 8.4 Contradictions

- Table `claim_contradiction` : claim_id_a, claim_id_b, type (direct|partial).
- Détection : comparaison numérique (3 vs 10 morts), négation sémantique.

### 8.5 Convergence

- `convergence_score` : nombre de sources distinctes pour un même event/claim.
- Affichage "Confirmé par N sources".

### 8.6 Démentis et versions

- `claim.status` : asserted | contradicted | retracted.
- `claim.retracted_at`, `claim.superseded_by_id` pour versions.

---

## 9. Event Engine et Episode Engine

### 9.1 Document/Signal → Event

- Chaque source_item normalisé produit un candidat Event.
- Classification, géocodage, déduplication (Jaccard) avant création.
- Si duplicate : linkToExistingEvent (observation supplémentaire).

### 9.2 Fusion en épisode

- Critères : même event_type ou thématique proche, fenêtre temporelle (ex. 7j), proximité géographique (même place ou admin1).
- Algorithme : clustering temporel + sémantique sur events récents.
- Création `episode`, liaison `episode_event`.

### 9.3 Épisodes simples vs complexes

- **Simple** : 2–5 events, même lieu, courte période (ex. incident frontière).
- **Complexe** : nombreux events, plusieurs lieux, longue période (ex. crise monétaire, tensions Sud).

### 9.4 Rattachement nouveau document à épisode existant

- Si event créé ou mis à jour : calcul similarité avec épisodes ouverts (last_event_at < 48h).
- Si similarité > seuil : ajouter event à l'épisode, mettre à jour last_event_at, event_count.

### 9.5 Création nouvel épisode

- Si aucun épisode candidat : épisode singleton ou regroupement avec nouvel event proche.

### 9.6 Exemples concrets

- **Incident Sud-Liban** : 3–4 events (ACLED, UCDP, RSS) → Episode "Incidents frontière mars 2026".
- **Nomination politique** : 1 event principal, pas d'épisode sauf suivi (réactions, démissions).
- **Fermeture axe** : event infra + events dérivés (trafic, déviation) → Episode.
- **Panne infrastructure** : event EDL + events Cloudflare/trafic → Episode.
- **Projet reconstruction** : Project + events UNDP/World Bank → pas d'épisode temporel, lien Project-Place.
- **Activité culturelle** : Festival → event cultural_activity.
- **Reprise locale** : agrégation indicateurs (fréquentation, LBP) → signal Vitalité.
- **Tension monétaire** : LBP spike + events crise → Episode économique.

---

## 10. Architecture géospatiale cible

### 10.1 Ce qui ne va pas aujourd'hui

- Coords majoritairement inférées depuis texte (getCityCoords, locality-extractor).
- Pas d'emprise (polygone), pas d'incertitude, pas de corridor.
- Place = point uniquement.

### 10.2 Géolocalisation analytique sérieuse

- Types : point, polyline, polygon, buffer, zone d'incertitude.
- Niveaux : exact_point, neighborhood, city, district, governorate, country.
- Attributs : precision, uncertainty_radius_m, method (source_exact|gazetteer|llm).

### 10.3 Objets spatiaux à gérer

- **Point** : event, infrastructure, hotspot FIRMS.
- **Polygon** : zone UNIFIL, governorate, zone convergence.
- **Buffer** : zone d'incertitude autour d'un point.
- **Corridor** : axe routier, frontière.
- **Heat** : agrégation de points (existant).

### 10.4 Échelles pertinentes pour le Liban

- Pays, governorate (8), district (~25), ville, quartier, point.
- Corridor Beyrouth–Tripoli, frontière Sud, Litani.

### 10.5 Relations critiques

- **Proximité** : distance euclidienne ou réseau.
- **Exposition** : lieu dans zone de danger (ex. sous les frappes).
- **Voisinage** : partage frontière.
- **Enclavement** : accessibilité réduite.
- **Dépendance infrastructure** : lieu desservi par X.
- **Diffusion** : propagation (incendie, rumeur).
- **Connectivité** : réseau routier, télécom.

### 10.6 Geotemporal engine

- Footprint d'un épisode : union des emprises des events, ou buffer agrégé.
- Évolution dans le temps : série de footprints par période.
- Requêtes : events dans bbox, dans polygon, à distance de point.

### 10.7 Qualité spatiale / incertitude

- `geo_precision` + `uncertainty_radius_m`.
- Affichage : taille du marqueur ou zone de flou selon incertitude.

---

## 11. Refonte du module anciennement "Lumière"

### 11.1 Problème du Lumière actuel

- Rubrique "positif" : reconstruction, culture, solidarité.
- Pas de modèle de continuité, vitalité ou capacité.
- Risque de positivisme décoratif.

### 11.2 Trois options de refonte

**Option A — Continuity Engine**  
Focus : continuité fonctionnelle (services, électricité, eau). Indicateurs : heures EDL, coupures internet, desserte.

**Option B — Vitality & Recovery Layer**  
Focus : vitalité territoriale, reprise locale, densité sociale. Indicateurs : projets reconstruction, événements culturels, fréquentation, LBP stabilité.

**Option C — Capacity & Resilience Layer**  
Focus : capacité de maintien, rebond, activité civique. Indicateurs : ONG actives, mobilisation, résilience communautaire.

**Recommandation** : Option B (Vitality & Recovery), avec sous-composants Continuity (infra) et Capacity (société civile).

### 11.3 Nouveau nom proposé

**Territorial Vitality** ou **Vitalité & Reprise**.

### 11.4 Sous-composants

1. **Reconstruction active** : projets WB/UNDP, statut, montants.
2. **Continuité des services** : électricité, eau, télécom (proxies).
3. **Activité culturelle** : festivals, expos, concerts.
4. **Vie économique locale** : LBP, commerce, tourisme (proxy).
5. **Mobilisation civile** : ONG, solidarité, initiatives.

### 11.5 Objets de données

- `reconstruction_project` : name, status, amount, place_id, funder.
- `vitality_indicator` : key, value, place_id, period.
- `cultural_activity` : name, date, place_id, type.

### 11.6 Indicateurs plausibles

| Indicateur | Mesurable | Proxy | Estimable | Narratif |
|------------|-----------|-------|-----------|----------|
| Projets reconstruction actifs | Oui (WB/UNDP) | — | — | — |
| Heures électricité | Non | Trafic Cloudflare | Oui | — |
| Événements culturels | Oui (RSS) | — | — | — |
| Stabilité LBP | Oui | — | — | — |
| Fréquentation | Non | — | Oui (médias) | Oui |
| Mobilisation ONG | Partiel | Events solidarity | — | Oui |

### 11.7 Distinction mesurable / proxy / estimable / narratif

- **Mesurable** : donnée directe (LBP, projets WB).
- **Proxy** : corrélation (trafic ↔ électricité).
- **Estimable** : modèle ou enquête.
- **Narratif** : synthèse qualitative, pas de chiffre.

### 11.8 Innovation forte vs gadget

Le module devient analytique si on mesure la **reprise effective** (projets livrés, événements réalisés, stabilité) et non seulement les annonces. Éviter le biais "tout ce qui est positif".

---

## 12. Catalogue d'indicateurs et signaux

### Sécurité

| Indicateur | Robustesse | Intérêt | Fréquence | Limites |
|------------|------------|---------|-----------|---------|
| Incidents ACLED/UCDP | Haute | Conflit | 1h | Couverture partielle |
| Convergence zone | Moyenne | Corroboration | 24h | Heuristique |
| UNIFIL statements | Haute | Contexte | Quotidien | Lag |

### Gouvernance

| Indicateur | Robustesse | Intérêt | Fréquence | Limites |
|------------|------------|---------|-----------|---------|
| Nominations, réformes | Moyenne | Stabilité | Variable | Saturation news |

### Économie

| Indicateur | Robustesse | Intérêt | Fréquence | Limites |
|------------|------------|---------|-----------|---------|
| LBP parallèle | Haute | Stress | 30 min | Source unique |
| Prix carburant | Moyenne | Coût vie | 24h | Scraping fragile |
| Polymarket | Moyenne | Sentiment | 5 min | Géopolitique large |

### Infrastructures

| Indicateur | Robustesse | Intérêt | Fréquence | Limites |
|------------|------------|---------|-----------|---------|
| Trafic Cloudflare | Haute | Connectivité | 5 min | Proxy |
| OpenSky (vols) | Haute | Espace aérien | 30s | Timeout possible |
| GPS Jamming | Moyenne | OSINT | 24h | Dépend OpenSky |

### Reconstruction

| Indicateur | Robustesse | Intérêt | Fréquence | Limites |
|------------|------------|---------|-----------|---------|
| Projets WB/UNDP | Haute | Montants | 24h | Lag |
| Reforestation | Faible | Environnement | Variable | Peu de sources |

### Culture / vie locale

| Indicateur | Robustesse | Intérêt | Fréquence | Limites |
|------------|------------|---------|-----------|---------|
| Agenda culturel | Moyenne | Vitalité | 6h | Filtrage à affiner |

### Environnement

| Indicateur | Robustesse | Intérêt | Fréquence | Limites |
|------------|------------|---------|-----------|---------|
| AQI (OpenAQ) | Moyenne | Santé | 1h | Stations limitées |
| FIRMS (feux) | Haute | Risque | 15 min | — |

### Informationnel

| Indicateur | Robustesse | Intérêt | Fréquence | Limites |
|------------|------------|---------|-----------|---------|
| Volume events GDELT/RSS | Moyenne | Attention | 5 min | Bruit |

---

## 13. Architecture IA / agents / retrieval

### 13.1 Pourquoi un LLM seul ne suffit pas

- Pas de mémoire structurée.
- Pas de raisonnement sur graphe.
- Hallucinations, confusion fait/hypothèse.
- Coût et latence.

### 13.2 Tâches symboliques / règles

- Classification binaire (Lumière/Ombre) : pre-classifier + keywords.
- Extraction entités : dictionnaires (politiciens, partis, villes).
- Déduplication : Jaccard.
- Rattachement épisode : similarité + fenêtre temporelle.

### 13.3 Tâches LLM

- Classification ambiguë (negation, contexte).
- Synthèse quotidienne.
- Brief par event.
- Extraction claims (structurée).
- Résolution lieu si gazetteer échoue.

### 13.4 Retrieval multi-couche

| Type | Usage | Stockage |
|------|-------|----------|
| Relationnel | Events par filtre, search SQL | PostgreSQL |
| Graphe | Acteurs, lieux, relations | PostgreSQL + event_entity, event_relationship |
| Sémantique | Recherche par similarité | Vector store |
| Temporel | Fenêtre, timeline | PostgreSQL |
| Géospatial | Bbox, distance | PostgreSQL (lat/lng) ou PostGIS |

### 13.5 Agents utiles

- **Agent de synthèse** : brief quotidien, input = events + épisodes.
- **Agent d'alerte** : détection anomalies, input = signaux.
- **Agent d'exploration** : "Que se passe-t-il à Tyr ?", input = retrieval multi-couche.
- **Agent de comparaison** : "Épisode A vs B", input = épisodes.
- **Agent de qualification d'épisode** : "Cet ensemble forme-t-il un épisode ?", input = events candidats.

### 13.6 Outils des agents

- `search_events(query, filters)`
- `get_episode(id)`
- `get_claims(event_id)`
- `get_entities(event_id)`
- `get_vitality(place_id)`

### 13.7 Mémoire

- Contexte conversation : fenêtre limitée.
- Mémoire produit : graphe + épisodes + claims.
- Pas de mémoire long terme agent sans architecture dédiée.

### 13.8 Évaluation

- Précision extraction : F1 sur NER, claims.
- Qualité linking : entités correctement liées.
- Rattachement épisode : précision/rappel manuel.
- Qualité synthèses : évaluation humaine ou LLM-as-judge.
- Hallucinations : détection sur faits non présents dans le contexte.
- Stabilité classements : accord inter-annotateur ou test set.

---

## 14. Expérience produit / UX / pages / vues

### 14.1 Trois options de home

**Option A — Carte prioritaire**  
Home = carte plein écran + pills layers. Scroll = sections thématiques. Carte réduite en mini.

**Option B — Episodes prioritaires**  
Home = liste épisodes actifs + carte secondaire. Entrée par "quoi se passe maintenant".

**Option C — Requête analyste**  
Home = barre de requête + résultats contextuels. Carte, épisodes, events selon la question.

**Recommandation** : Option A (actuelle, épurée) pour le public large ; Option C en mode "analyste" (toggle ou page dédiée).

### 14.2 Vues principales

- **Home** : carte hero, sections Lumière/Ombre (ou Vitalité/Ombre), infrastructure, économie, géopolitique, signaux.
- **Episodes** : liste épisodes actifs, détail épisode (events, timeline, footprint).
- **Events** : liste, détail event (claims, sources, entités).
- **Recherche** : full-text + filtres.
- **Lieux** : fiche lieu (events, épisodes, vitalité).
- **Acteurs** : fiche acteur (events liés).

### 14.3 Vues secondaires

- **Infrastructures** : carte infra, statut.
- **Indicateurs** : tableaux, sparklines.
- **Alertes** : liste signaux, sévérité.

### 14.4 Place de la carte

- Centrale sur home (hero).
- Présente dans Episode (footprint).
- Présente dans Lieu (contexte).

### 14.5 Place des épisodes

- Nouvelle section "Épisodes actifs" sur home.
- Page dédiée `/episodes`.
- Lien event → episode.

### 14.6 Recommandations franches

| Action | Élément |
|--------|---------|
| **Retirer** | 3e panneau Ombre duplicué, widgets placeholder (Fuel, Port si pas de données), Analyst Workbench tel quel (rebrand ou refonte) |
| **Simplifier** | Section Géopolitique (trop de widgets), CausalTimeline (nom trompeur, c'est activité horaire) |
| **Densifier** | Fiche event (claims, épisode), fiche épisode |
| **Hiérarchiser** | Episodes > events bruts pour la narration |

---

## 15. Roadmap par phases

### Phase 0 — Assainissement (1–2 semaines)

- **Objectifs** : Aligner docs et code, corriger bugs critiques (stats SQL, event by ID).
- **Livrables** : Docs à jour, 0 bug bloquant.
- **Risques** : Faible.
- **Validation** : Build OK, tests verts, audit relecture.

### Phase 1 — Noyau ontologique (3–4 semaines)

- **Objectifs** : Formaliser ontologie, alimenter entity/event_entity, étendre place.
- **Livrables** : Schéma claim, episode ; extraction entités systématique.
- **Dépendances** : Phase 0.
- **Risques** : Charge NER si tout en LLM.
- **Validation** : Events avec entités liées.

### Phase 2 — Event + Claim + Episode engine (4–6 semaines)

- **Objectifs** : Claim extraction, claim graph, moteur d'épisodes.
- **Livrables** : Tables claim, episode, episode_event ; API épisodes.
- **Dépendances** : Phase 1.
- **Risques** : Complexité algorithmique fusion épisodes.
- **Validation** : Episodes créés, rattachement correct.

### Phase 3 — Géospatial sérieux (2–3 semaines)

- **Objectifs** : Emprises, incertitude, PostGIS optionnel.
- **Livrables** : Champs uncertainty, footprint épisode.
- **Dépendances** : Phase 1.
- **Risques** : Migration PostGIS si Railway contraint.
- **Validation** : Requêtes spatiales fonctionnelles.

### Phase 4 — Module Vitalité / Continuité (2–3 semaines)

- **Objectifs** : Remplacer Lumière par Territorial Vitality.
- **Livrables** : Indicateurs vitalité, vues dédiées.
- **Dépendances** : Phase 1.
- **Risques** : Données insuffisantes pour certains indicateurs.
- **Validation** : Module cohérent, non décoratif.

### Phase 5 — Agents / Retrieval / Briefs (3–4 semaines)

- **Objectifs** : Retrieval multi-couche, agents outillés, evals.
- **Livrables** : API retrieval, agent synthèse v2, agent exploration.
- **Dépendances** : Phases 1, 2.
- **Risques** : Coût LLM, hallucinations.
- **Validation** : Benchmarks extraction, synthèse.

### Phase 6 — UX / Produit / Stabilisation (2–3 semaines)

- **Objectifs** : Vues épisodes, refonte home si besoin, polish.
- **Livrables** : Pages épisodes, lieux, acteurs.
- **Dépendances** : Phases 2–5.
- **Risques** : Scope creep.
- **Validation** : Parcours utilisateur complet.

### Phase 7 — Industrialisation (continu)

- **Objectifs** : Qualité, gouvernance, évals récurrentes.
- **Livrables** : CI evals, docs opérationnelles.
- **Validation** : Métriques stables.

### Trois niveaux d'ambition technique

| Niveau | Périmètre |
|--------|-----------|
| **Minimal** | Phase 0 + 1 + 2 (épisodes) + 4 (vitalité) + 6 (UX épisodes). Pas de claim graph complet, pas d'agents avancés. |
| **Intermédiaire** | Phases 0–6. Claim graph, épisodes, vitalité, retrieval relationnel+temporel, agent synthèse. |
| **Ambitieux** | Toutes phases + retrieval sémantique, agents multiples, PostGIS, evals continues. |

---

## 16. Quick wins, paris structurants, éléments à tuer

### Quick wins

- Corriger SQL stats (`e.is_active` → `is_active`).
- Valider UUID sur `/api/v2/events/[id]`.
- Activer ACLED et Telegram si clés disponibles.
- Brancher bootstrap sur le front (moins de fetches).
- Exposer `event_cluster` réel ou renommer `/api/v2/clusters` en "trending".

### Paris structurants

- **Episode engine** : plus fort levier différenciant.
- **Claim graph** : crédibilité analytique.
- **Module Vitalité** : innovation vs "positif".

### Éléments à tuer ou geler

- **Analyst Workbench** actuel : renommer ou refondre.
- **Clusters** : renommer en "Trending" ou implémenter vrai clustering.
- **Widgets placeholder** (Fuel, Port) : cacher ou implémenter.
- **3e panneau** Ombre : supprimer.
- **CausalTimeline** : renommer "Activité horaire".

### Features qui paraissent intelligentes sans l'être

- Convergence score : formule heuristique, pas de modèle causal.
- Signals "causal-escalation" : corrélation temporelle, pas causalité.
- "Claim count" dans workbench : = observation count, pas claims extraits.

---

## 17. Risques majeurs

| Catégorie | Risque |
|-----------|--------|
| **Produit** | Scope creep, dilution de la valeur |
| **Technique** | Migration PostGIS, coût LLM |
| **Géopolitique** | Sensibilité des données, acteurs |
| **Réputationnel** | Erreurs factuelles, biais |
| **Juridique** | Sources, droits, RGPD |
| **Data** | Fragilité APIs (GDELT, ReliefWeb) |
| **Géolocalisation** | Incertitude mal communiquée |
| **Sécurité** | Exposition clés, ingestion |
| **Hallucination** | LLM invente faits |
| **Confusion analytique** | Mélange fait/hypothèse |
| **Solutionnisme** | Survaloriser l'IA |
| **APIs fragiles** | Rate limits, changements |
| **Incohérence méthodologique** | Changement d'ontologie en cours de route |

---

## 18. Décisions structurantes à prendre maintenant

1. **Conserver ou abandonner Lumière/Ombre** : Recommandation — conserver comme axes narratifs, mais remplacer le contenu Lumière par le module Vitalité.
2. **Recentrer sur épisodes / lieux / acteurs** : Oui.
3. **Choisir le noyau ontologique** : Adopter la liste section 6.
4. **Prioriser le géospatial** : Emprises et incertitude avant PostGIS complet.
5. **Limiter le nombre de sources avant stabilisation** : Oui — 10–12 sources robustes plutôt que 18 fragiles.
6. **Choisir le public cible** : Analystes (Option A).
7. **Outil analyste vs dashboard grand public** : Outil analyste.
8. **Traiter la continuité comme module majeur** : Oui — Vitalité/Continuité.
9. **Claim graph** : Oui, phase 2.
10. **Agents** : Synthèse et exploration en priorité, pas d'agent autonome multi-étape sans cadre.
11. **Bootstrap** : Activer pour réduire latence perçue.
12. **Monorepo** : Optionnel, pas prioritaire.

---

## 19. Version ultra synthétique (15 lignes)

1. Lebanon Monitor est aujourd'hui un dashboard OSINT avec pipeline solide et UI Norgram, mais sans ontologie ni épisodes.
2. Il doit devenir une plateforme d'intelligence géotemporelle centrée sur le Liban.
3. Cinq problèmes : ontologie implicite, clustering nominal, géolocalisation faible, Lumière décoratif, signaux heuristiques.
4. Cinq décisions : ontologie explicite, moteur d'épisodes, module Vitalité, géospatial analytique, cible analystes.
5. Construire : claim graph, episode engine, module Territorial Vitality.
6. Remplacer Lumière par Vitalité (reconstruction, continuité, vie locale).
7. Géospatial : emprises, incertitude, multi-résolution.
8. IA : règles pour classification/dedup, LLM pour synthèse/extraction claims.
9. Retrieval : relationnel, temporel, graphe ; sémantique en option.
10. Agents : synthèse, exploration, qualification épisode ; outillés sur monde structuré.
11. Home : carte hero + sections ; mode analyste avec requêtes.
12. Roadmap : assainissement → ontologie → épisodes/claims → géospatial → vitalité → agents → UX.
13. Quick wins : fix stats, UUID, bootstrap, renommer clusters.
14. Tuer : Analyst Workbench actuel, clusters trompeurs, placeholders.
15. Risques : scope, fragilité APIs, hallucinations, confusion analytique.

---

## Appendice A — Architecture minimale viable

- Garder pipeline actuel.
- Ajouter table `episode`, `episode_event` ; algorithme de fusion simple (Jaccard + fenêtre 7j).
- Ajouter table `claim` ; extraction minimale (règles regex ou 1 champ LLM).
- Remplacer section Lumière par indicateurs Vitalité (projets WB, culture, LBP).
- Exposer API `/episodes`, page Episodes.
- Pas de graphe complet, pas de retrieval sémantique, pas d'agents multiples.
- Durée : 6–8 semaines.

---

## Appendice B — Architecture cible ambitieuse

- Ontologie complète, entity resolution, claim graph avec contradictions.
- Episode engine avancé (fusion multi-critères, propagation).
- PostGIS, emprises, multi-résolution.
- Module Vitalité riche (indicateurs, régression, tendances).
- Vector store, retrieval sémantique.
- Agents : synthèse, alerte, exploration, comparaison, qualification.
- Evals continues, CI quality.
- Durée : 6–12 mois.

---

## Appendice C — Matrice de comparaison

| Dimension | Dashboard pays | OSINT générique | Média augmenté | Knowledge graph pays | Plateforme géotemporelle |
|-----------|----------------|-----------------|----------------|----------------------|---------------------------|
| Focalisation | Large | Large | Éditorial | Pays | Pays + profondeur |
| Mémoire | Archive | Variable | Non | Oui | Oui |
| Claims | Non | Partiel | Non | Partiel | Oui |
| Épisodes | Non | Rare | Non | Partiel | Oui |
| Géospatial | Carte | Carte | Carte | Lieux | Emprises, temps |
| Agents | Non | Partiel | Non | Partiel | Oui |

**Position actuelle Lebanon Monitor** : Entre dashboard pays et média augmenté.

**Position cible** : Plateforme géotemporelle avec traits de knowledge graph pays.
