# Data Model — Lebanon Monitor

**Version**: 1.0  
**Date**: 2025-03-06

---

## 1. Tables principales

### 1.1 raw_ingest

Stockage brut immuable des données récupérées.

| Colonne | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| source_name | varchar(50) | gdelt, usgs, firms, etc. |
| fetch_time | timestamptz | |
| source_url | text | URL de la requête |
| raw_content_type | varchar(50) | application/json, text/csv, etc. |
| raw_storage_path | text | chemin bucket ou inline |
| hash | varchar(64) | SHA-256 du contenu |
| request_metadata | jsonb | headers, params |
| response_metadata | jsonb | status, headers réponse |
| ingest_status | varchar(20) | pending, processed, failed |

### 1.2 source_item

Élément normalisé depuis une source (avant fusion en event).

| Colonne | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| raw_ingest_id | uuid FK | |
| source_name | varchar(50) | |
| external_id | varchar(255) | ID externe (URL hash, etc.) |
| observed_title | text | |
| observed_summary | text | |
| observed_at | timestamptz | |
| source_url | text | |
| raw_data | jsonb | |
| first_seen_at | timestamptz | |
| last_seen_at | timestamptz | |

### 1.3 place

Référentiel des lieux (gazetteer).

| Colonne | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| name_primary | varchar(255) | |
| name_ar | varchar(255) | |
| name_fr | varchar(255) | |
| name_en | varchar(255) | |
| place_type | varchar(50) | governorate, district, city, village, camp, port, etc. |
| parent_place_id | uuid FK | hiérarchie |
| geometry | geometry(Point, 4326) | PostGIS |
| bbox | geometry(Polygon, 4326) | optionnel |
| metadata | jsonb | |

### 1.4 place_alias

Alias et translittérations pour résolution toponymique.

| Colonne | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| place_id | uuid FK | |
| alias | varchar(255) | |
| language | char(2) | ar, fr, en |
| alias_type | varchar(20) | canonical, transliteration, abbreviation |

### 1.5 event

Événement canonique enrichi.

| Colonne | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| canonical_title | text | |
| canonical_summary | text | |
| original_language | char(2) | |
| event_type | varchar(50) | |
| sub_type | varchar(50) | |
| polarity_ui | varchar(10) | lumiere, ombre, neutre |
| impact_score | decimal(3,2) | 0-1 |
| severity_score | decimal(3,2) | 0-1 |
| confidence_score | decimal(3,2) | 0-1 |
| verification_status | varchar(30) | unverified, partially_verified, verified, disputed |
| occurred_at | timestamptz | |
| first_seen_at | timestamptz | |
| last_seen_at | timestamptz | |
| place_id | uuid FK | lieu principal |
| geo_precision | varchar(20) | exact_point, neighborhood, city, district, governorate, country, inferred, unknown |
| primary_cluster_id | uuid FK | |
| canonical_source_item_id | uuid FK | |
| is_active | boolean | |
| metadata | jsonb | |

### 1.6 event_observation

Lien source_item ↔ event (plusieurs observations pour un même événement).

| Colonne | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| source_item_id | uuid FK | |
| event_id | uuid FK | |
| observed_title | text | |
| observed_summary | text | |
| observed_at | timestamptz | |
| source_reliability_score | decimal(3,2) | |
| extraction_confidence | decimal(3,2) | |
| matching_confidence | decimal(3,2) | |
| dedup_reason | varchar(50) | |
| translation_status | varchar(20) | |
| geocode_status | varchar(20) | |

### 1.7 event_cluster

Regroupement sémantique d'événements.

| Colonne | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| label | varchar(255) | |
| summary | text | |
| first_event_at | timestamptz | |
| last_event_at | timestamptz | |
| event_count | int | |
| metadata | jsonb | |

### 1.8 entity

Acteurs, organisations, lieux nommés.

| Colonne | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| name | varchar(255) | |
| entity_type | varchar(50) | person, organization, location |
| metadata | jsonb | |

### 1.9 event_entity

Lien event ↔ entity (many-to-many).

| Colonne | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| event_id | uuid FK | |
| entity_id | uuid FK | |
| role | varchar(50) | actor, location, mentioned |

### 1.10 event_translation

Traductions FR/EN/AR.

| Colonne | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| event_id | uuid FK | |
| language | char(2) | |
| title | text | |
| summary | text | |
| translated_at | timestamptz | |
| provider | varchar(50) | |

### 1.11 event_social_metrics

Métriques d'engagement social.

| Colonne | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| event_id | uuid FK | |
| platform | varchar(20) | twitter, telegram |
| post_id | varchar(255) | |
| author_id | varchar(255) | |
| likes | int | |
| reposts | int | |
| replies | int | |
| views | int | |
| engagement_rate | decimal(5,4) | |
| captured_at | timestamptz | |
| raw_metrics | jsonb | |

### 1.12 media_asset

Médias associés aux événements.

| Colonne | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| event_id | uuid FK | |
| source_item_id | uuid FK | |
| media_type | varchar(20) | image, video |
| url | text | |
| thumbnail_url | text | |
| metadata | jsonb | |

### 1.13 verification_record

Traces de vérification.

| Colonne | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| event_id | uuid FK | |
| verification_status | varchar(30) | |
| verified_at | timestamptz | |
| source | varchar(50) | |
| metadata | jsonb | |

### 1.14 indicator_snapshot

Snapshots d'indicateurs pré-calculés.

| Colonne | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| indicator_key | varchar(100) | |
| period_start | timestamptz | |
| period_end | timestamptz | |
| payload | jsonb | |
| computed_at | timestamptz | |

### 1.15 source_health_log

Log de santé des sources.

| Colonne | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| source_name | varchar(50) | |
| checked_at | timestamptz | |
| status | varchar(20) | ok, error, rate-limited |
| response_time_ms | int | |
| item_count | int | |
| error_message | text | |

### 1.16 pipeline_run

Exécution du pipeline d'ingestion.

| Colonne | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| started_at | timestamptz | |
| finished_at | timestamptz | |
| status | varchar(20) | running, success, partial_failure, failure |
| sources_run | text[] | |
| raw_count | int | |
| events_created | int | |
| events_updated | int | |
| error_details | jsonb | |

### 1.17 taxonomy_label

Libellés de la taxonomie hiérarchique.

| Colonne | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| code | varchar(50) | |
| parent_code | varchar(50) | |
| label_fr | varchar(255) | |
| label_en | varchar(255) | |
| label_ar | varchar(255) | |
| depth | int | |

### 1.18 event_taxonomy_assignment

Assignation taxonomique des événements.

| Colonne | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| event_id | uuid FK | |
| taxonomy_label_id | uuid FK | |
| confidence | decimal(3,2) | |

### 1.19 narrative_frame

Cadres narratifs pour regroupement éditorial.

| Colonne | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| label | varchar(255) | |
| cluster_id | uuid FK | |
| summary | text | |
| metadata | jsonb | |

### 1.20 event_relationship

Relations entre événements.

| Colonne | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| source_event_id | uuid FK | |
| target_event_id | uuid FK | |
| relationship_type | varchar(50) | follows, part_of, contradicts |
| metadata | jsonb | |

---

## 2. Index recommandés

- `raw_ingest(source_name, fetch_time)`
- `source_item(source_name, external_id)` UNIQUE
- `event(first_seen_at DESC)`, `event(place_id)`, `event(primary_cluster_id)`
- `event_observation(event_id)`, `event_observation(source_item_id)`
- `place_alias(alias)` (gin pour recherche)
- `indicator_snapshot(indicator_key, period_start)`
- `source_health_log(source_name, checked_at DESC)`
