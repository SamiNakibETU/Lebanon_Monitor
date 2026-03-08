# LEBANON MONITOR V4 — CATALOGUE EXHAUSTIF DES SOURCES

**Annexe au V4 VISION BLUEPRINT**
**Date : 8 mars 2026**

---

## COMPARAISON DE SCOPE AVEC WORLD MONITOR

| Catégorie | World Monitor | Lebanon Monitor V4 |
|-----------|--------------|-------------------|
| RSS feeds | 435+ (global) | 60+ (Lebanon-focused) |
| Telegram | 26 canaux (global OSINT) | 20+ canaux (Lebanon + MENA + OSINT) |
| APIs structurées | 28+ (GDELT, ACLED, OpenSky, AIS, FIRMS, etc.) | 25+ (mêmes + Lebanon-spécifiques) |
| Marchés financiers | Yahoo Finance, CoinGecko, Fear & Greed | LBP rate, fuel prices, Polymarket, gold LBP |
| Live video | 30+ streams | 4-6 streams (ciblés) |
| Langues | 21 | 3 (FR/EN/AR) |
| Couverture | Monde entier (large, survol) | Un seul pays (profond, radiographie) |

---

## 1. TELEGRAM — 20 CANAUX

### 1A. Canaux Libanais (primaires)

| Canal | Handle | Langue | Focus | Fréquence |
|-------|--------|--------|-------|-----------|
| Lebanese News and Updates | @LebUpdate | EN/AR | Breaking news Lebanon, conflits MENA | Très haute |
| Lebanon 24 News | @Lebanon24News | AR | News générales Liban | Haute |
| NNA (Agence Nationale d'Information) | @NNALeb | AR/EN | Agence de presse étatique | Haute |
| L'Orient Today | @loraborient | FR/EN | Journalisme de qualité | Moyenne |
| LBCI News | @LBCINews | AR/EN | Breaking TV | Très haute |
| MTV Lebanon News | @MTVLebanonNews | AR | Breaking TV | Haute |
| Al Jadeed News | @AlJadeedNews | AR | News TV | Haute |
| Megaphone News | @megaborig | AR | Journalisme indépendant | Moyenne |
| Daraj Media | @daaborig | AR/EN | Journalisme d'investigation | Moyenne |
| Revolution News Lebanon | @revolutionlebanonnews | AR/EN | Société civile, protestations | Variable |

### 1B. Canaux OSINT & Moyen-Orient (secondaires)

| Canal | Handle | Langue | Focus | Fréquence |
|-------|--------|--------|-------|-----------|
| Middle East Spectator | @MideastSpectator | EN | OSINT Moyen-Orient, conflits | Très haute |
| Middle East Now Breaking | @middleeastnow | EN | Breaking MENA | Haute |
| Aurora Intel | @AuroraIntel | EN | OSINT global, focus Moyen-Orient | Haute |
| OSINTdefender | @OSINTdefender | EN | OSINT Europe + conflits mondiaux | Très haute |
| Abu Ali Express | @AbuAliExpress | HE/EN | Intelligence Israël/Hezbollah | Haute |
| Clash Report | @ClashReport | EN | Conflits armés mondiaux | Haute |
| War Monitor | @WarMonitor | EN | Suivi conflits temps réel | Haute |
| Bellingcat | @Bellingcat | EN | Investigation OSINT vérifiée | Basse |
| OSINT Updates | @OSINTUpdates | EN | Agrégation OSINT | Haute |
| LiveUAMap | @LiveUAMap | EN | Cartographie conflits | Haute |

### Méthode d'intégration
- **MTProto** (comme World Monitor) : GramJS client sur Railway relay, cycle 60s, dedup par ID
- **Alternative légère** : RSShub bridge (`https://rsshub.app/telegram/channel/{handle}`)
- Classification par topic : `breaking`, `conflict`, `politics`, `humanitarian`, `culture`, `economy`

---

## 2. COMPTES X/TWITTER — 40+ COMPTES

### 2A. Journalistes & Analystes Liban

| Compte | Handle | Affiliation | Focus |
|--------|--------|-------------|-------|
| Timour Azhari | @timaborig | Al Jazeera English | Correspondant Beyrouth |
| Kareem Chehayeb | @chaborig | AP / ex-Al Jazeera | Correspondant Liban |
| Sunniva Rose | @saborig | The National | Correspondante Beyrouth |
| Nada Maucourant Atallah | @NadaAborigAtallah | L'Orient Today | Éditrice-en-chef |
| Luna Safwan | @lunaborig | Journaliste indépendante | Société civile, protestations |
| Leila Molana-Allen | @LeilaMolanaAllen | France 24 | Correspondante Moyen-Orient |
| Anchal Vohra | @ancaborig | Ex-Al Jazeera, freelance | Correspondante Beyrouth |
| Bassam Khawaja | @basaborig | Human Rights Watch | Droits humains Liban |
| Mona Fawaz | @monaborig | AUB / Beirut Urban Lab | Urbanisme, reconstruction |
| Carmen Geha | @caraborig | AUB | Politiques publiques |
| Sami Nader | @saborig | Levant Institute | Analyste politique |
| Sami Atallah | @saborig | LCPS | Think tank politique |
| Hanin Ghaddar | @hanaborig | Washington Institute | Analyste Hezbollah/politique |

### 2B. OSINT & Intelligence Moyen-Orient

| Compte | Handle | Focus |
|--------|--------|-------|
| OSINTdefender | @sentdefender | OSINT global, breaking conflicts |
| Aurora Intel | @AuroraIntel | OSINT aérien, naval, conflits |
| Charles Lister | @Charles_Lister | Middle East Institute, Syrie/Liban |
| Faysal Itani | @faborig | Analyste sécurité Liban |
| Nicholas Blanford | @nickaborig | Atlantic Council, Hezbollah expert |
| Rami Khouri | @ramiaborig | AUB, analyste politique |
| Elijah Magnier | @ejaborig | Analyste politique, axe de résistance |
| Lina Sinjab | @linaborig | BBC, correspondante Levant |
| Borzou Daragahi | @baborig | Independent, MENA |
| Joyce Karam | @joyceaborig | The National, Washington |
| Hasan Illaik | @hasaborig | Journaliste libanais |
| Ali Hashem | @aliaborig | Al Jazeera Arabic, analyste |
| Firas Maksad | @firasaborig | MEI, analyste libanais-américain |
| Maha Yahya | @mahaaborig | Carnegie MEC, directrice |
| Ronnie Chatah | @ronnieaborig | Podcast "The Beirut Banyan" |

### 2C. Institutions & Comptes Officiels

| Compte | Handle | Type |
|--------|--------|------|
| UNIFIL | @ABORIG | Opérations de paix sud-Liban |
| UNHCR Lebanon | @UNHCRLeb | Réfugiés |
| UNICEF Lebanon | @UNICEFLebanon | Enfants, éducation |
| WFP Lebanon | @WFP_Lebanon | Aide alimentaire |
| WHO Lebanon | @WHOLebanon | Santé publique |
| UNDP Lebanon | @UNDPLebanon | Développement |
| Lebanese Red Cross | @RedCrossLebanon | Urgences, ambulances |
| LAF (Armée libanaise) | @LebArmy | Sécurité militaire |
| ISF (Forces de sécurité) | @ISFLebanon | Sécurité intérieure |
| Banque du Liban | @BDLLebanon | Banque centrale |
| EDL (Électricité du Liban) | @EDLABORIG | Coupures, fuel |

### Méthode d'intégration
- **Nitter RSS** : `https://nitter.net/{handle}/rss` (instances publiques, instable)
- **Twitter API v2** (Basic tier, $100/mois — hors budget MVP)
- **Alternative MVP** : scraping sélectif via RSSHub ou monitoring GDELT social
- **Priorité** : les comptes institutionnels (UNIFIL, UNHCR) ont souvent des RSS sur leur site web

---

## 3. MÉDIAS LIBANAIS — RSS FEEDS

### 3A. Médias francophones

| Média | RSS URL | Langue | Type |
|-------|---------|--------|------|
| L'Orient-Le Jour | `https://www.lorientlejour.com/rss` | FR | Quotidien de référence |
| L'Orient Today | `https://today.lorientlejour.com/rss` | EN | Version anglaise OLJ |
| Libnan News | `https://libnanews.com/feed` | FR | Média citoyen |
| Ici Beyrouth | `https://icibeyrouth.com/feed` | FR | Info Liban, diaspora |
| Courrier du Liban | (scraping) | FR | Hebdo |
| Le Commerce du Levant | `https://www.lecommercedulevant.com/feed` | FR | Économie, business |

### 3B. Médias anglophones

| Média | RSS URL | Langue | Type |
|-------|---------|--------|------|
| Daily Star Lebanon | `https://www.dailystar.com.lb/RSS.aspx` | EN | Quotidien anglophone |
| Naharnet | `https://www.naharnet.com/stories/en/rss` | EN | Breaking news |
| The961 | `https://the961.com/feed` | EN | Lifestyle + news positives (LUMIÈRE) |
| Executive Magazine | `https://www.executive-magazine.com/feed` | EN | Business, économie |
| NOW Lebanon | (scraping) | EN | Analyse politique |
| Beirut Today | `https://beirut-today.com/feed` | EN | Journalisme indépendant |

### 3C. Médias arabophones

| Média | RSS URL | Langue | Type |
|-------|---------|--------|------|
| NNA (Agence nationale) | `https://www.nna-leb.gov.lb/ar/rss` | AR | Agence officielle |
| LBCI | `https://www.lbcgroup.tv/rss/ar` | AR | TV + web |
| MTV Lebanon | `https://www.mtv.com.lb/rss` | AR | TV + web |
| Al Manar (Hezbollah) | (scraping) | AR | Axe de résistance |
| Al Jadeed / New TV | (scraping) | AR | TV indépendante |
| An-Nahar | `https://www.annahar.com/rss` | AR | Quotidien historique |
| Al Akhbar | `https://al-akhbar.com/rss` | AR | Quotidien pro-8 Mars |
| Al Modon | `https://www.almodon.com/rss` | AR | Analyse politique |
| Janoubia | (scraping) | AR | Info Sud-Liban |
| Lebanon Debate | `https://www.lebanondebate.com/rss` | AR | Agrégateur |
| Lebanon Files | `https://www.lebanonfiles.com/rss` | AR | Agrégateur |

### 3D. Médias internationaux (couverture Liban)

| Média | RSS URL | Langue | Focus Liban |
|-------|---------|--------|-------------|
| Al Jazeera English | `https://www.aljazeera.com/xml/rss/all.xml` | EN | Couverture MENA |
| Al Jazeera Arabic | `https://www.aljazeera.net/aljazeerarss/` | AR | Couverture MENA |
| France 24 | `https://www.france24.com/fr/moyen-orient/rss` | FR | Moyen-Orient |
| BBC Arabic | `https://feeds.bbci.co.uk/arabic/rss.xml` | AR | MENA |
| Reuters Middle East | `https://www.reuters.com/rss/middleeast` | EN | Wire service |
| AP Middle East | (scraping) | EN | Wire service |
| Al-Monitor Lebanon | `https://www.al-monitor.com/rss/lebanon` | EN | Analyse MENA |
| Middle East Eye | `https://www.middleeasteye.net/rss` | EN | Analyse indépendante |
| The New Arab | `https://www.newarab.com/rss` | EN | Info MENA |
| Al Arabiya | `https://www.alarabiya.net/rss.xml` | AR/EN | Info MENA (perspective Golfe) |
| i24News | `https://www.i24news.tv/fr/rss` | FR/EN | Perspective israélienne |
| Times of Israel | `https://www.timesofisrael.com/feed` | EN | Perspective israélienne |

---

## 4. APIs STRUCTURÉES — 25 CONNECTEURS

### 4A. Sécurité & Conflits

| # | Source | API / URL | Données | Fréquence | Coût | Côté |
|---|--------|-----------|---------|-----------|------|------|
| 1 | ACLED | `https://acleddata.com/acleddatanew/wp-content/uploads/dlm_uploads/` | Conflits géolocalisés, acteurs, types | Hebdo (batch) + update quotidien | Gratuit (academic) | OMBRE |
| 2 | UCDP (Uppsala) | `https://ucdpapi.pcr.uu.se/api/` | Conflits armés historiques | Mensuel | Gratuit | OMBRE |
| 3 | GDELT | `https://api.gdeltproject.org/api/v2/` | News globales, tone, thèmes, géoloc | 15 min | Gratuit | L+O |
| 4 | LiveUAMap | `https://lebanon.liveuamap.com/` | Events géolocalisés Liban temps réel | Continu | Scraping | OMBRE |
| 5 | OREF (Pikud HaOref) | `https://www.oref.org.il/` | Alertes roquettes Israël (indicateur tension) | Temps réel | Scraping via proxy | OMBRE |

### 4B. Infrastructure & Signaux Faibles

| # | Source | API / URL | Données | Fréquence | Coût | Côté |
|---|--------|-----------|---------|-----------|------|------|
| 6 | OpenSky Network | `https://opensky-network.org/api/states/all?lamin=33.0&lamax=34.7&lomin=35.0&lomax=36.7` | Vols ADS-B au-dessus du Liban, NIC (jamming) | 30s | Gratuit (4000 crédits/jour) | INFRA |
| 7 | Cloudflare Radar | `https://api.cloudflare.com/client/v4/radar/` | Trafic internet Liban, anomalies, outages | 5 min | Gratuit (CC BY-NC 4.0) | INFRA |
| 8 | NASA FIRMS | `https://firms.modaps.eosdis.nasa.gov/api/` | Feux actifs satellite (VIIRS/MODIS) | 15 min | Gratuit | OMBRE |
| 9 | USGS Earthquakes | `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minlatitude=33&maxlatitude=35&minlongitude=34&maxlongitude=37` | Séismes autour du Liban | 5 min | Gratuit | OMBRE |
| 10 | GDACS | `https://www.gdacs.org/xml/rss.xml` | Alertes catastrophes naturelles | 30 min | Gratuit (RSS) | OMBRE |
| 11 | OpenAQ | `https://api.openaq.org/v3/locations?countries_id=122` | Qualité de l'air (PM2.5, PM10, NO2) par station | 1h | Gratuit | OMBRE |
| 12 | GPSJam / OpenSky NIC | Dérivé de OpenSky (NIC < 5 = interférence) | Score de brouillage GPS/GNSS | 24h | Gratuit (calculé) | INFRA |
| 13 | Flightradar24 GPS Jamming | `https://www.flightradar24.com/data/gps-jamming` | Carte interférence GNSS | 6h | Scraping | INFRA |

### 4C. Maritime & Transport

| # | Source | API / URL | Données | Fréquence | Coût | Côté |
|---|--------|-----------|---------|-----------|------|------|
| 14 | AIS — MyShipTracking | `https://www.myshiptracking.com/?port=100` | Navires port de Beyrouth | 5 min | Scraping | INFRA |
| 15 | MarineTraffic (embed) | Embed widget | Trafic maritime côte libanaise | Temps réel | Embed gratuit | INFRA |
| 16 | Beirut Airport (OLBA) | `https://www.beirutairport.gov.lb/` + OpenSky arrivals | Vols arrivée/départ Hariri | 30 min | Scraping + API | INFRA |

### 4D. Économie & Finance

| # | Source | API / URL | Données | Fréquence | Coût | Côté |
|---|--------|-----------|---------|-----------|------|------|
| 17 | LBP taux parallèle | Scraping `https://lirarate.org/` ou `https://lbprate.com/` | USD/LBP marché noir | 30 min | Gratuit | OMBRE |
| 18 | Prix carburant | Scraping `https://lbp.sp-today.com/en` | Benzin 95/98, Diesel, Gaz en LBP | 24h | Gratuit | OMBRE |
| 19 | Prix or LBP | Scraping `https://lbp.sp-today.com/en` | Once + gramme d'or en USD | 24h | Gratuit | OMBRE |
| 20 | Polymarket | `https://gamma-api.polymarket.com/` | Contrats prédiction géopolitiques | 5 min | Gratuit | O |
| 21 | World Bank Indicators | `https://api.worldbank.org/v2/country/LBN/indicator/` | GDP, inflation, dette, chômage | Mensuel/trimestriel | Gratuit | CONTEXTE |
| 22 | BDL (Banque du Liban) | `https://www.bdl.gov.lb/` | Réserves, masse monétaire, Sayrafa rate | Hebdo | Scraping | OMBRE |

**Keywords Polymarket élargis :**
`"Lebanon"`, `"Hezbollah"`, `"Israel"`, `"Iran"`, `"ceasefire"`, `"Middle East"`, `"war"`, `"nuclear"`, `"Trump"`, `"Syria"`, `"UNIFIL"`, `"sanctions"`, `"oil price"`
Fallback : top 5 contrats géopolitiques par volume si aucun match Lebanon.

### 4E. Humanitaire & Reconstruction (LUMIÈRE)

| # | Source | API / URL | Données | Fréquence | Coût | Côté |
|---|--------|-----------|---------|-----------|------|------|
| 23 | ReliefWeb | `https://api.reliefweb.int/v1/reports?filter[field]=country&filter[value]=Lebanon` | Rapports humanitaires, UNIFIL, NGOs | 1h | Gratuit | L+O |
| 24 | World Bank Projects | `https://search.worldbank.org/api/v2/projects?countrycode=LB&format=json` | Projets reconstruction géolocalisés | 24h | Gratuit | LUMIÈRE |
| 25 | UNDP Projects Lebanon | `https://data.undp.org/dataset/Projects-in-Lebanon/y9z7-dfth` | Projets développement | 24h | Gratuit (Socrata) | LUMIÈRE |
| 26 | HDX (Humanitarian Data Exchange) | `https://data.humdata.org/api/3/action/package_search?q=Lebanon` | 193 datasets humanitaires | Variable | Gratuit | L+O |
| 27 | Open Map Lebanon | `https://openmaplebanon.org/` | Damage assessment, reconstruction Beyrouth | Batch | GeoJSON téléchargeable | LUMIÈRE |

### 4F. Culture & Société (LUMIÈRE)

| # | Source | API / URL | Données | Fréquence | Coût | Côté |
|---|--------|-----------|---------|-----------|------|------|
| 28 | Agenda Culturel | `https://www.agendaculturel.com/rss` | Événements culturels Liban | 6h | RSS gratuit | LUMIÈRE |
| 29 | Beirut.com Events | `https://www.beirut.com/feed` | Sorties, restaurants, culture | 6h | RSS gratuit | LUMIÈRE |
| 30 | AUB Events | (scraping page events) | Conférences, recherche | 24h | Scraping | LUMIÈRE |
| 31 | LAU Events | (scraping page events) | Conférences, recherche | 24h | Scraping | LUMIÈRE |
| 32 | Baalbeck Festival | @BaalbeckFest (X + Instagram) | Programmation festival | Saisonnier | Social scraping | LUMIÈRE |
| 33 | Beiteddine Festival | @BeiteddineFest (X) | Programmation festival | Saisonnier | Social scraping | LUMIÈRE |
| 34 | Sursock Museum | @SursockMuseum (X) | Expositions | Mensuel | Social scraping | LUMIÈRE |

### 4G. Environnement (LUMIÈRE + OMBRE)

| # | Source | API / URL | Données | Fréquence | Coût | Côté |
|---|--------|-----------|---------|-----------|------|------|
| 35 | Jouzour Loubnan | `https://jouzourloubnan.org/` | Projets reforestation | Mensuel | Scraping | LUMIÈRE |
| 36 | SPNL (Société Protection Nature) | `https://www.spnl.org/` | Conservation, biodiversité | Mensuel | Scraping | LUMIÈRE |
| 37 | OpenWeatherMap | `https://api.openweathermap.org/data/2.5/weather?q=Beirut&appid=` | Météo Beyrouth | 30 min | Gratuit (1000 appels/jour) | CONTEXTE |
| 38 | Open-Meteo | `https://api.open-meteo.com/v1/forecast?latitude=33.89&longitude=35.50` | Météo 7j, pas de clé API | 1h | Gratuit | CONTEXTE |

### 4H. Gouvernance & Politique

| # | Source | API / URL | Données | Fréquence | Coût | Côté |
|---|--------|-----------|---------|-----------|------|------|
| 39 | Liban Vote | `https://lfrench-parliament-votes.com/` ou données manuelles | Votes parlement, sessions | Variable | Scraping | CONTEXTE |
| 40 | LCPS (Lebanese Center for Policy Studies) | `https://www.lcps-lebanon.org/feed` | Analyses politiques, rapports | Hebdo | RSS gratuit | CONTEXTE |
| 41 | Carnegie MEC | `https://carnegie-mec.org/rss/` | Analyses géopolitiques Liban/MENA | Hebdo | RSS gratuit | CONTEXTE |
| 42 | ICG (International Crisis Group) | `https://www.crisisgroup.org/rss.xml` | Rapports Liban, alertes | Mensuel | RSS gratuit | OMBRE |

---

## 5. LIVE VIDEO — 6 FLUX

| # | Source | URL/Embed | Type | Côté |
|---|--------|-----------|------|------|
| 1 | SkylineWebcams Beirut | YouTube embed | Webcam skyline | LUMIÈRE |
| 2 | Al Jazeera Arabic | YouTube live | TV news MENA | OMBRE |
| 3 | France 24 Arabic | YouTube live | TV news FR/MENA | OMBRE |
| 4 | LBCI Live | YouTube live | TV libanaise | L+O |
| 5 | Al Jadeed Live | YouTube live | TV libanaise | L+O |
| 6 | Al Arabiya Live | YouTube live | TV news Golfe | OMBRE |

Proxy : `/api/youtube/embed` (IFrame Player API, autoplay, muted).
Rotation automatique si un flux est hors ligne.
Maximum 2 visibles simultanément dans l'UI.

---

## 6. INDICATEURS CALCULÉS (dérivés)

| Indicateur | Sources | Calcul | Stockage |
|------------|---------|--------|----------|
| **GPS Jamming Index** (0-100) | OpenSky NIC values, bounding box Liban | `100 × (avions NIC<5) / total_avions` sur 24h | `indicator_snapshot` |
| **Internet Health Score** (0-100) | Cloudflare Radar traffic + anomalies | Delta trafic vs baseline 7j, pondéré par anomalies | `indicator_snapshot` |
| **Air Quality Index** | OpenAQ stations Liban | Moyenne PM2.5 pondérée par population | `indicator_snapshot` |
| **Reconstruction Progress** | World Bank + UNDP projets | `terminés / (en_cours + terminés)` × 100 | `indicator_snapshot` |
| **Lumière/Ombre Ratio** | Events classifiés | `events_lumière / events_ombre` rolling 7j | `indicator_snapshot` |
| **Tension Index** (0-100) | ACLED incidents + OpenSky (avions mil.) + OREF alerts + Jamming | Composite pondéré, normalisé 0-100 | `indicator_snapshot` |
| **Economic Pulse** | LBP rate delta + fuel delta + gold delta | Composite normalisé | `indicator_snapshot` |

---

## 7. BASES DE DONNÉES GÉOGRAPHIQUES (GeoJSON / statiques)

| Dataset | Source | Format | Contenu |
|---------|--------|--------|---------|
| Frontières & gouvernorats | Natural Earth + OSM | GeoJSON | Limites admin Liban |
| Blue Line UNIFIL | UNIFIL / UN Cartographic | GeoJSON | Ligne de démarcation sud |
| Zone FINUL | Dérivé (sud du Litani) | GeoJSON | Périmètre opérations UNIFIL |
| Infrastructure critique | OSM + enrichissement manuel | GeoJSON | Aéroport Hariri, Port Beyrouth, centrales EDL (Zouk, Jiyeh, Deir Ammar, Zahrani), hôpitaux (AUBMC, HDF, Rafik Hariri Hospital), universités (AUB, LAU, USJ) |
| Camps de réfugiés | UNHCR + HDX | GeoJSON | Camps palestiniens (12) + installations syriennes |
| Open Map Lebanon — Damage | AUB Beirut Urban Lab + Rice University | GeoJSON | Évaluation dommages explosion 2020 + reconstruction |
| Routes principales | OSM | GeoJSON | Réseau routier principal |
| Rivière Litani | OSM | GeoJSON | Cours d'eau + barrage Qaraoun |
| Stations OpenAQ | OpenAQ API | Points | Stations qualité de l'air |
| Centrales/sous-stations EDL | Enrichissement manuel | Points | Réseau électrique |

---

## 8. CLASSIFICATION DE CRÉDIBILITÉ (4 tiers, comme World Monitor)

| Tier | Crédibilité | Exemples | Poids classification |
|------|-------------|----------|---------------------|
| **T1 — Wire services & agences** | Très haute | Reuters, AP, AFP, NNA | 1.0 |
| **T2 — Médias vérifiés** | Haute | L'Orient-Le Jour, LBCI, Al Jazeera, BBC, Daily Star | 0.85 |
| **T3 — Sources spécialisées** | Moyenne | OSINT accounts vérifiés, think tanks (LCPS, Carnegie, ICG), ONG (HRW, MSF) | 0.70 |
| **T4 — Social & non-vérifiés** | Basse | Telegram OSINT, comptes X individuels, forums | 0.50 |

Un event a plus de poids s'il est confirmé par plusieurs sources de tiers différents.
Algorithme de convergence : Jaccard similarity > 0.7 + source_count ≥ 2 + multi-tier = `HIGH_CONFIDENCE`.

---

## 9. DICTIONNAIRES DE CLASSIFICATION ENRICHIS

### Lumière (positif)

**Français :**
`reconstruction`, `réhabilitation`, `réouverture`, `inauguration`, `reforestation`, `plantation`, `diplôme`, `bourse`, `tourisme`, `startup`, `innovation`, `bénévolat`, `ouverture`, `lancement`, `record`, `succès`, `victoire`, `festival`, `concert`, `exposition`, `musée`, `bibliothèque`, `coopération`, `partenariat`, `investissement`, `croissance`, `emploi`, `embauche`, `formation`, `énergie solaire`, `énergie renouvelable`, `patrimoine`, `restauration`, `rénovation`, `aide humanitaire`, `don`, `solidarité`, `retour des déplacés`, `cessez-le-feu`, `accord de paix`, `stabilité`, `progrès`

**Anglais :**
`reconstruction`, `rehabilitation`, `reopening`, `inauguration`, `reforestation`, `planting`, `graduation`, `scholarship`, `tourism`, `startup`, `innovation`, `volunteering`, `launch`, `success`, `victory`, `festival`, `concert`, `exhibition`, `museum`, `library`, `cooperation`, `partnership`, `investment`, `growth`, `employment`, `hiring`, `training`, `solar energy`, `renewable`, `heritage`, `restoration`, `renovation`, `humanitarian aid`, `donation`, `solidarity`, `return of displaced`, `ceasefire`, `peace agreement`, `stability`, `progress`, `recovery`

**Arabe :**
`إعادة إعمار`, `إعادة تأهيل`, `افتتاح`, `تشجير`, `غرس`, `تخرج`, `منحة`, `سياحة`, `ابتكار`, `تطوع`, `إطلاق`, `نجاح`, `فوز`, `مهرجان`, `حفل`, `معرض`, `متحف`, `مكتبة`, `تعاون`, `شراكة`, `استثمار`, `نمو`, `توظيف`, `تدريب`, `طاقة شمسية`, `طاقة متجددة`, `تراث`, `ترميم`, `مساعدة إنسانية`, `تبرع`, `تضامن`, `عودة النازحين`, `وقف إطلاق النار`, `اتفاق سلام`, `استقرار`, `تقدم`

### Ombre (négatif)

**Français :**
`frappe`, `bombardement`, `raid`, `explosion`, `attentat`, `tirs`, `roquette`, `missile`, `drone`, `victime`, `mort`, `blessé`, `déplacé`, `réfugié`, `crise`, `effondrement`, `pénurie`, `coupure`, `panne`, `blackout`, `inflation`, `dévaluation`, `corruption`, `manifestation`, `protestation`, `émeute`, `arrestation`, `détention`, `violation`, `pollution`, `incendie`, `séisme`, `inondation`, `tension`, `escalade`, `confrontation`, `embargo`, `sanction`, `menace`, `alerte`

**Anglais :**
`strike`, `bombing`, `raid`, `explosion`, `attack`, `shelling`, `rocket`, `missile`, `drone`, `casualty`, `killed`, `wounded`, `displaced`, `refugee`, `crisis`, `collapse`, `shortage`, `outage`, `blackout`, `inflation`, `devaluation`, `corruption`, `protest`, `riot`, `arrest`, `detention`, `violation`, `pollution`, `fire`, `earthquake`, `flood`, `tension`, `escalation`, `confrontation`, `embargo`, `sanction`, `threat`, `alert`, `airstrike`, `incursion`

**Arabe :**
`غارة`, `قصف`, `انفجار`, `هجوم`, `إطلاق نار`, `صاروخ`, `طائرة مسيّرة`, `ضحية`, `قتيل`, `جريح`, `نازح`, `لاجئ`, `أزمة`, `انهيار`, `نقص`, `انقطاع`, `تعتيم`, `تضخم`, `انخفاض`, `فساد`, `احتجاج`, `تظاهرة`, `اعتقال`, `احتجاز`, `انتهاك`, `تلوث`, `حريق`, `زلزال`, `فيضان`, `توتر`, `تصعيد`, `مواجهة`, `حصار`, `عقوبات`, `تهديد`, `إنذار`

---

## 10. RÉSUMÉ — TOTAL DES SOURCES

| Catégorie | Nombre |
|-----------|--------|
| Canaux Telegram | 20 |
| Comptes X/Twitter suivis | 40+ |
| Flux RSS médias | 35+ |
| APIs structurées | 25 |
| Datasets GeoJSON statiques | 10 |
| Live video | 6 |
| Indicateurs calculés | 7 |
| **TOTAL connecteurs** | **143+** |

World Monitor : ~500+ sources (global).
Lebanon Monitor V4 : ~143+ sources (un seul pays, profondeur maximale).

Le ratio sources/km² est SUPÉRIEUR à World Monitor.
