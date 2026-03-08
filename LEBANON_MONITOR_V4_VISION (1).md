# LEBANON MONITOR V4 — VISION BLUEPRINT

**Document fondateur — Ne pas coder avant d'avoir lu et validé chaque section.**
**Date : 8 mars 2026**
**Auteur : Sami Nakib**

---

## I. PHILOSOPHIE

Lebanon Monitor n'est PAS un agrégateur de news avec une carte.

C'est un **système nerveux** focalisé sur un seul pays. Il croise des signaux de nature radicalement différente — vols aériens, trafic maritime, coupures internet, qualité de l'air, taux de change, feux de forêt, conflits armés, projets de reconstruction — et c'est la **convergence** de ces signaux qui crée l'intelligence.

La différenciation par rapport à World Monitor :
- World Monitor est **large** (monde entier, survol). Lebanon Monitor est **profond** (un pays, radiographie complète).
- World Monitor montre **l'horreur**. Lebanon Monitor montre **les deux** : Lumière (reconstruction, culture, espoir) ET Ombre (crises, conflits, effondrement).
- World Monitor a une esthétique **Bloomberg terminal** (dense, utilitaire). Lebanon Monitor a une esthétique **Norgram** (épurée, éditoriale, silencieuse).

### Principes Norgram appliqués
1. **Being real** — Chaque pixel montre une donnée vraie. Pas de décoration.
2. **Crafted to the detail** — Chaque transition, chaque espacement est intentionnel.
3. **Character over conformity** — Pas de template dashboard. Pas de AI slop.
4. **Considerate throughout** — L'utilisateur comprend en 2 secondes, explore en 2 minutes, revient chaque jour.

---

## II. EXPÉRIENCE UTILISATEUR — LE PARCOURS

### Étape 1 : L'arrivée (0-2 secondes)

Plein écran. Une carte du Liban. Rien d'autre.

La carte affiche une **heatmap animée bicolore** :
- Vert doux (#2E7D32 → #A5D6A7) qui pulse là où il y a des signaux Lumière (reconstruction, événements culturels, reforestation)
- Rouge profond (#C62828 → #EF9A9A) qui pulse là où il y a des signaux Ombre (conflits, frappes, coupures, incidents)

Pas de chiffre. Pas de texte sur la carte. Pas de sidebar. Juste le pays qui **respire** devant toi.

Le header est minimal : `LB: LEBANON MONITOR` à gauche. Heure locale Beyrouth à droite. Rien entre les deux.

La heatmap utilise la carte CARTO Voyager (neutre, ni claire ni sombre) en arrière-plan. Le Liban est centré, zoomé pour que le pays entier soit visible avec un peu de marge (Chypre visible au nord-ouest, nord d'Israël visible au sud).

### Étape 2 : L'exploration de la carte (2-30 secondes)

L'utilisateur peut :
- **Zoomer** sur une zone (Beyrouth, Sud-Liban, Bekaa, Tripoli)
- **Activer des layers** via des pills discrets en bas à gauche de la carte :
  - `EVENTS` — Points individuels (vert Lumière / rouge Ombre)
  - `FLIGHTS` — Avions en temps réel au-dessus du Liban (OpenSky ADS-B)
  - `SHIPS` — Navires dans le port de Beyrouth et le long de la côte (AIS)
  - `FIRES` — Feux actifs satellite (NASA FIRMS)
  - `INFRA` — Infrastructure critique (aéroport Hariri, port Beyrouth, centrales EDL, hôpitaux majeurs)
  - `UNIFIL` — Zone FINUL au sud du Litani
  - `JAMMING` — Zones d'interférence GPS/GNSS (dérivé OpenSky NIC data)
- **Cliquer sur un point** pour voir un tooltip minimal : titre, source, heure, catégorie

Par défaut à l'arrivée : **seulement la heatmap**. Tout le reste est désactivé. Clean. Norgram.

### Étape 3 : Le scroll — Descente dans les données (30 secondes+)

Quand l'utilisateur commence à scroller vers le bas :

1. La carte **se réduit progressivement** en mini-carte fixe dans le **coin supérieur droit** (environ 280×200px, border-radius: 0, ombre subtile). Elle reste là, toujours visible, toujours live. L'utilisateur peut cliquer dessus pour la remettre en plein écran.

2. Apparaissent les **sections thématiques** en scroll vertical :

---

### SECTION A : SYNTHÈSE LUMIÈRE / OMBRE (premier contenu visible après la carte)

**Layout : deux colonnes côte à côte**
- Colonne gauche : fond `#F5F2EE` (crème Lumière)
- Colonne droite : fond `#0A0A0A` (noir Ombre)

**Contenu de chaque colonne :**

**En tête de colonne : Carte de synthèse AI**

Un résumé quotidien auto-généré par Claude Haiku. 3-4 phrases max. Écrit comme un briefing d'analyste, pas comme un chatbot.

Exemple Lumière :
> Le ministère de l'Éducation rouvre 12 écoles dans le Akkar après réhabilitation UNICEF. Le festival de Baalbeck confirme son édition 2026. Trois projets de reforestation lancés dans le Chouf cette semaine, portant le total à 47 hectares replantés depuis janvier.

Exemple Ombre :
> Tensions persistantes au sud du Litani avec 3 incidents FINUL signalés. Coupure internet de 4h détectée dans la Bekaa hier (Cloudflare Radar). Le taux de change LBP reste stable à 89 500 mais le prix du diesel a augmenté de 3% cette semaine. Qualité de l'air dégradée à Beyrouth (PM2.5 : 47 µg/m³).

**Sous la synthèse AI : indicateurs clés**

Colonne Lumière :
- Projets de reconstruction actifs (nombre + tendance)
- Événements culturels cette semaine
- Nouveaux arbres plantés (reforestation tracker)
- Indice de confiance économique (composite)

Colonne Ombre :
- Incidents sécuritaires (24h / 7j / 30j)
- Heures sans électricité EDL (moyenne nationale estimée)
- Taux LBP parallèle + sparkline 30j
- Qualité de l'air (PM2.5 moyen, pire station)
- Score de jamming GPS (dérivé NIC, 0-100)

**Sous les indicateurs : feed condensé**

Pas de tweets embeds. Pas d'images. Une ligne par événement :
```
HH:MM  Source  │  Titre condensé                          Catégorie
14:32  ACLED   │  Incident frontière Naqoura               Sécurité
14:15  UNDP    │  $2.3M débloqués pour eau potable Saïda   Reconstruction
13:58  FIRMS   │  Feu détecté Chouf (34.52°N, 35.61°E)     Environnement
```

Chaque ligne est cliquable → page de détail de l'événement.

---

### SECTION B : INFRASTRUCTURE LAYER

**Layout : grille de widgets, fond neutre `#FAFAFA`**

Quatre widgets en grille 2×2 :

**B1. Trafic Internet Lebanon**
Source : Cloudflare Radar API (gratuit, CC BY-NC 4.0)
Sparkline du trafic HTTP sur 7 jours. Point rouge si anomalie détectée.
En dessous : statut des principaux ASN libanais (Ogero, Touch, Alfa).

**B2. Espace Aérien**
Source : OpenSky Network API (gratuit pour recherche)
Nombre d'avions actuellement au-dessus du Liban. Sparkline 24h.
Icône d'alerte si nombre anormalement bas (indicateur de tension).
Lien vers le layer carte FLIGHTS.

**B3. Port de Beyrouth**
Source : AIS data (scraping ou API gratuite type myshiptracking)
Nombre de navires au port / en approche.
Dernier arrivage fuel (si détectable par type de navire).

**B4. GPS Jamming Index**
Source : Dérivé des données OpenSky (NIC — Navigation Integrity Category)
Score 0-100 calculé quotidiennement.
Couleur : vert si < 20, jaune si 20-50, rouge si > 50.
Sparkline 30 jours.

---

### SECTION C : ÉCONOMIE & QUOTIDIEN

**Layout : fond `#0A0A0A` (noir), texte blanc, style Ombre**

**C1. Taux de change LBP/USD**
Source : Scraping lirarate.org ou lbprate.com
Grand chiffre : `89,500 LBP` (font-weight: 300, 48px, blanc)
Sparkline 90 jours. Delta vs semaine dernière.

**C2. Prix du carburant**
Source : Scraping sptoday.com ou équivalent
Benzin 95, Benzin 98, Diesel, Gaz — en LBP.
Sparkline mensuelle pour chaque.

**C3. Qualité de l'air**
Source : OpenAQ API (gratuit)
Stations de mesure au Liban avec PM2.5 / PM10 en temps réel.
Code couleur AQI.

**C4. Électricité (quand données disponibles)**
Source : Estimation indirecte (corrélation Cloudflare traffic drops + fuel shipments)
Heures moyennes de courant EDL par jour (estimation).
Note : cette donnée est approximative et clairement étiquetée comme telle.

---

### SECTION D : GÉOPOLITIQUE & SÉCURITÉ

**Layout : fond `#0A0A0A` persistant**

**D1. Carte des incidents ACLED**
Mini-carte centrée sur le sud-Liban avec les incidents des 30 derniers jours.
Timeline horizontale en dessous.

**D2. Polymarket — Contrats géopolitiques**
Source : Polymarket API
Filtrage élargi : contrats contenant "Lebanon", "Hezbollah", "Iran", "Israel", "ceasefire", "Middle East", "war", "nuclear"
Affichage : nom du contrat + probabilité + sparkline.
Fallback : top 3 contrats géopolitiques si aucun contrat Lebanon spécifique.

**D3. UNIFIL Status**
Source : RSS ReliefWeb + UNIFIL press releases
Dernier communiqué FINUL. Nombre d'incidents signalés ce mois.

---

### SECTION E : LUMIÈRE — RECONSTRUCTION & CULTURE

**Layout : fond `#F5F2EE` (crème), retour à l'ambiance Lumière**

**E1. Projets de reconstruction**
Source : World Bank Projects API + UNDP Lebanon dataset + ReliefWeb
Carte des projets actifs avec statut (planifié / en cours / terminé).
Montants en USD. Bailleurs de fonds.

**E2. Agenda culturel**
Source : RSS Agenda Culturel, Beirut.com, feeds festivals
Prochains événements : concerts, expos, festivals.
Le Liban qui vit, pas seulement le Liban qui survit.

**E3. Reforestation tracker**
Source : Jouzour Loubnan, SPNL + données manuelles
Nombre d'hectares replantés. Carte des zones.

---

### SECTION F : LIVE FEEDS (tout en bas)

**Layout : fond noir**

**F1. CCTV minimal**
2 flux maximum, pas 8. Un flux Beyrouth (webcam skyline), un flux news (Al Jazeera ou France 24 Arabic). Petit, pas dominant.

**F2. Telegram OSINT**
Feed condensé des canaux Telegram libanais.
Pas de widget Twitter. Pas d'embed.

---

## III. DESIGN SYSTEM V4

### Typographie
- Font : `"DM Sans", "Helvetica Neue", -apple-system, sans-serif`
- Hero chiffres : 48px, font-weight: 300 (LIGHT)
- Labels : 11px, uppercase, letter-spacing: 0.08em
- Body : 14px, font-weight: 400
- Feed lignes : 13px, font-family: `"DM Mono", "SF Mono", monospace`

### Couleurs

| Élément | Lumière | Ombre |
|---------|---------|-------|
| Background | `#F5F2EE` | `#0A0A0A` |
| Texte principal | `#1A1A1A` | `#FFFFFF` |
| Texte secondaire | `#888888` | `#666666` |
| Accent positif | `#2E7D32` | — |
| Accent négatif | — | `#C62828` |
| Dividers | `#E0DCD7` | `#1A1A1A` |
| Carte fond | CARTO Voyager | CARTO Voyager |

### Règles anti-AI-slop (ABSOLUES)
- `border-radius: 0` sur TOUS les conteneurs
- AUCUN `box-shadow` (sauf la mini-carte réduite : `0 2px 12px rgba(0,0,0,0.15)`)
- AUCUN gradient de fond
- AUCUN `hover:scale-105`
- AUCUN skeleton shimmer
- AUCUN CountUp animation sur les chiffres
- AUCUN emoji dans l'interface
- Hover = changement de couleur texte uniquement (`transition: color 0.15s`)
- Events = lignes avec dividers 1px, PAS des cartes avec bordures
- Font Inter INTERDITE
- `rounded-xl` INTERDIT

### Transitions
- Carte hero → mini-carte : `transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1)`
- Layer toggle ON/OFF : `transition: opacity 0.3s ease`
- Hover liens : `transition: color 0.15s ease`
- Rien d'autre ne bouge.

---

## IV. DATA ARCHITECTURE

### Sources — 18 connecteurs

| # | Source | Type | Fréquence | Côté | API/Méthode | Coût |
|---|--------|------|-----------|------|-------------|------|
| 1 | GDELT | News + Tone | 15 min | L+O | REST API | Gratuit |
| 2 | ACLED | Conflits géolocalisés | 1h | O | REST API | Gratuit (academic) |
| 3 | OpenSky Network | ADS-B vols temps réel | 30s | Infra | REST API bounding box | Gratuit |
| 4 | Cloudflare Radar | Trafic internet + anomalies | 5 min | Infra | REST API | Gratuit (CC BY-NC) |
| 5 | NASA FIRMS | Feux actifs satellite | 15 min | O | REST API | Gratuit |
| 6 | USGS Earthquakes | Séismes | 5 min | O | REST API | Gratuit |
| 7 | GDACS | Alertes catastrophes | 30 min | O | RSS | Gratuit |
| 8 | OpenAQ | Qualité de l'air | 1h | O | REST API v3 | Gratuit |
| 9 | ReliefWeb | Rapports humanitaires | 1h | L+O | REST API | Gratuit |
| 10 | World Bank Projects | Projets reconstruction | 24h | L | REST API | Gratuit |
| 11 | Polymarket | Marchés prédiction | 5 min | O | REST API | Gratuit |
| 12 | LBP Rate | Taux de change parallèle | 30 min | O | Scraping lirarate.org | Gratuit |
| 13 | Fuel Prices | Benzin/Diesel LBP | 24h | O | Scraping | Gratuit |
| 14 | RSS Lebanese media | News locales | 5 min | L+O | RSS (OLJ, NNA, L'Orient Today, Daily Star) | Gratuit |
| 15 | RSS Cultural | Événements culturels | 6h | L | RSS (Agenda Culturel, Beirut.com) | Gratuit |
| 16 | Telegram OSINT | Canaux Liban | 5 min | L+O | RSShub bridge | Gratuit |
| 17 | UNDP Lebanon | Projets développement | 24h | L | Socrata API | Gratuit |
| 18 | Weather | Météo Beyrouth | 30 min | Contexte | OpenWeatherMap ou OpenMeteo | Gratuit |

### Pipeline de données

```
┌─────────────────────────────────────────────────────────────┐
│                    INGEST LAYER                              │
│  Worker Node.js (cron 5 min)                                │
│  Pour chaque source :                                        │
│    1. Fetch data                                             │
│    2. Normalize → raw_ingest table                           │
│    3. Dedup (Jaccard similarity > 0.7)                       │
│    4. Geocode si pas géolocalisé (Nominatim)                 │
│    5. Filter is_about_lebanon                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                CLASSIFICATION LAYER                          │
│                                                              │
│  Étape 1 : Pre-classifier (keywords + negation check)        │
│    → ~60% classifié directement                              │
│                                                              │
│  Étape 2 : Claude Haiku batch (40% restants)                 │
│    → 50 titres par appel                                     │
│    → Output : classification (lumière/ombre/neutre),         │
│              catégorie, sévérité (1-5), entités              │
│                                                              │
│  Ensemble final : LLM 0.60 + keywords 0.25 + tone 0.15      │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                TRANSLATION LAYER                             │
│  Helsinki-NLP Opus-MT via HF Inference API (gratuit)         │
│  ar→en, ar→fr, fr→en, fr→ar, en→fr, en→ar                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                AI SYNTHESIS LAYER                             │
│  Claude Haiku — 2 appels/jour                                │
│                                                              │
│  Appel 1 (matin 8h Beyrouth) :                              │
│    Input : tous les events des dernières 24h                 │
│    Output : synthèse Lumière (3-4 phrases)                   │
│           + synthèse Ombre (3-4 phrases)                     │
│                                                              │
│  Appel 2 (soir 20h Beyrouth) :                              │
│    Même chose, mise à jour du résumé                         │
│                                                              │
│  Coût estimé : ~$0.20/jour = ~$6/mois                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                INDICATOR LAYER                               │
│  Calculs dérivés stockés dans indicator_snapshot :            │
│                                                              │
│  - GPS Jamming Index (0-100) : % avions avec NIC < 5         │
│    dans la bounding box Liban, fenêtre 24h                   │
│                                                              │
│  - Internet Health Score : delta trafic Cloudflare vs        │
│    baseline 7j + nombre d'anomalies                          │
│                                                              │
│  - Air Quality Index : moyenne PM2.5 stations OpenAQ         │
│                                                              │
│  - Reconstruction Progress : nombre de projets WB/UNDP       │
│    statut "en cours" vs "terminé"                            │
│                                                              │
│  - Lumière/Ombre Ratio : events L / events O, rolling 7j     │
└─────────────────────────────────────────────────────────────┘
```

### Caching (3-tier)

```
Requête client
    │
    ▼
┌─────────────┐    miss    ┌─────────────┐    miss    ┌──────────┐
│  In-memory   │ ────────> │   Redis      │ ────────> │ Upstream  │
│  (Node.js)   │           │  (Upstash)   │           │  (APIs)   │
│  TTL: 30s    │           │  TTL: 5min   │           │           │
└─────────────┘           └─────────────┘           └──────────┘
```

Redis : Upstash, plan gratuit (10K commandes/jour, largement suffisant).

---

## V. TECH STACK

| Layer | Choix | Raison |
|-------|-------|--------|
| Framework | Next.js 14 App Router | Déjà en place, SSR pour SEO |
| Language | TypeScript strict | Déjà en place |
| Carte | MapLibre GL JS | Gratuit, performant, custom styles |
| Tile basemap | CARTO Voyager (défaut) | Neutre, propre |
| Graphiques | D3.js (sparklines custom) | Contrôle total, pas de lib chart lourde |
| Styling | Tailwind CSS | Déjà en place |
| DB | PostgreSQL (Railway) | Déjà en place |
| Cache | Upstash Redis | Gratuit, serverless |
| Hosting | Railway | Déjà en place |
| AI Classification | Claude Haiku (Anthropic API) | ~$0.50/mois |
| AI Synthesis | Claude Haiku (Anthropic API) | ~$6/mois |
| Traduction | Helsinki-NLP Opus-MT (HF) | Gratuit |
| Cron | cron-job.org | Déjà en place |

**Budget mensuel total estimé : ~$12-15** (Railway $5 + Anthropic ~$7 + domaine)

---

## VI. PHASES DE DÉVELOPPEMENT

### PHASE 0 : NETTOYAGE (1-2 jours)
- [ ] Supprimer le dual-map split
- [ ] Supprimer les tweet embeds et le feed brut actuel
- [ ] Supprimer les widgets cassés (Polymarket vide, CCTV pub)
- [ ] Nettoyer le layout pour avoir une page blanche propre
- [ ] Configurer Upstash Redis (gratuit)
- [ ] Configurer les variables Railway (ANTHROPIC_API_KEY, HF_API_TOKEN)

### PHASE 1 : CARTE HERO + HEATMAP (2-3 jours)
- [ ] Carte MapLibre plein écran, centrée sur le Liban
- [ ] Heatmap bicolore Lumière/Ombre depuis les events existants
- [ ] Animation pulse subtile (opacité qui varie 0.6 → 1.0, period 3s)
- [ ] Header minimal (logo + heure Beyrouth)
- [ ] Layer pills en bas à gauche (tous désactivés par défaut)
- [ ] Comportement scroll : carte → mini-carte coin droit

### PHASE 2 : SPLIT LUMIÈRE/OMBRE (2-3 jours)
- [ ] Section deux colonnes sous la carte
- [ ] Synthèse AI : endpoint `/api/v2/synthesis` qui appelle Claude Haiku
- [ ] Cron synthèse : 2x/jour (8h et 20h Beyrouth)
- [ ] Indicateurs clés dans chaque colonne
- [ ] Feed condensé une-ligne-par-event

### PHASE 3 : INFRASTRUCTURE LAYER (2-3 jours)
- [ ] Intégration Cloudflare Radar API (trafic + anomalies)
- [ ] Intégration OpenSky (vols au-dessus du Liban, bounding box)
- [ ] GPS Jamming Index calculé depuis OpenSky NIC data
- [ ] Widgets : Internet, Espace aérien, Port, Jamming
- [ ] Layers carte correspondants (FLIGHTS, JAMMING)

### PHASE 4 : ÉCONOMIE & QUOTIDIEN (1-2 jours)
- [ ] Scraper LBP rate (lirarate.org)
- [ ] Scraper fuel prices
- [ ] Intégration OpenAQ
- [ ] Sparklines D3.js custom pour chaque indicateur

### PHASE 5 : GÉOPOLITIQUE & LUMIÈRE (2-3 jours)
- [ ] Polymarket élargi (keywords : Iran, war, ceasefire, Middle East...)
- [ ] World Bank Projects API → carte reconstruction
- [ ] ReliefWeb API → rapports FINUL et humanitaires
- [ ] Agenda culturel RSS
- [ ] CCTV réduit (2 flux max, bien intégré)

### PHASE 6 : POLISH & DEPLOY (1-2 jours)
- [ ] Responsive (mobile = carte + sections empilées, pas de split)
- [ ] SEO meta tags, OpenGraph
- [ ] Performance : lighthouse > 85
- [ ] README GitHub professionnel avec screenshots
- [ ] Tests Vitest pour les endpoints critiques

**Durée totale estimée : 10-16 jours de travail effectif**

---

## VII. CE QUI REND LE PROJET "WOW"

1. **La heatmap qui respire** — Première impression silencieuse et puissante. Personne ne fait ça pour un seul pays.

2. **Le GPS Jamming Index** — Donnée OSINT unique. Tu vois en temps réel l'intensité de la guerre électronique au-dessus du Liban. Aucun autre dashboard ne montre ça sous cette forme.

3. **La synthèse AI bipolaire** — Lumière et Ombre côte à côte. En 10 secondes tu sais "le Liban reconstruit ET le Liban souffre". C'est le concept éditorial le plus fort du projet.

4. **La convergence de signaux** — Quand le trafic internet chute (Cloudflare), que les avions évitent l'espace aérien (OpenSky), et que le jamming GPS monte (NIC), tu n'as pas besoin de lire une seule news pour comprendre que quelque chose se passe. C'est ça, l'intelligence OSINT.

5. **L'esthétique Norgram** — Dans un monde de dashboards AI slop avec des rounded-xl et des gradient violets, Lebanon Monitor est un objet de design. Sobre, intentionnel, respectueux de l'information et de l'utilisateur.

6. **Le Lumière** — World Monitor ne montre que l'ombre. Lebanon Monitor montre aussi les arbres qu'on replante, les festivals qui reprennent, les écoles qui rouvrent. C'est politiquement et humainement fort.

---

## VIII. QUESTIONS OUVERTES (à trancher avant le code)

1. **Nom de domaine** — `lebanonmonitor.app` ? `lb-monitor.com` ? Autre ?
2. **Langue par défaut** — FR, EN, ou AR ? Toggle visible ?
3. **AIS maritime** — API gratuite fiable ? Ou se contenter de l'embed MarineTraffic ?
4. **Données électricité EDL** — Estimation indirecte seulement, ou source directe possible ?
5. **Accès ACLED** — Clé API academic obtenue ?
6. **Fréquence de mise à jour synthèse AI** — 2x/jour suffisant ? Ou à chaque ingest (plus cher) ?

---

## IX. FICHIERS DE RÉFÉRENCE EXISTANTS

- `AGENT_PROMPT_V2.md` — Brief technique V2 (obsolète pour le layout, valide pour le pipeline)
- `DESIGN_SYSTEM_V2.md` — Design system (mis à jour dans ce document)
- `AGENT_BRIEF_V3_AMENDMENT.md` — Amendment V3 dual-panel (remplacé par ce document)
- `DIAGNOSTIC_FINAL.md` — Bugs V3 (la plupart résolus par le redesign V4)

**Ce document (V4 VISION) est désormais la référence unique.**
