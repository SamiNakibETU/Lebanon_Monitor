# SKILL.md — Lebanon Monitor

## Project Purpose
Real-time OSINT dashboard for Lebanon. Aggregates 10+ public data sources, classifies events as Lumière (positive) or Ombre (negative), and displays them on an interactive map with temporal charts.

## Domain Knowledge

### Lebanon Geography
- Bounding box: lat 33.05–34.69, lng 35.10–36.62
- Mohafazats (8): Beirut, Mount Lebanon, North, South, Bekaa, Baalbek-Hermel, Akkar, Nabatieh
- Key cities: Beirut (33.8938, 35.5018), Tripoli (34.4332, 35.8498), Sidon (33.5571, 35.3729), Tyre (33.2705, 35.2038), Baalbek (34.0047, 36.2110), Jounieh (33.9808, 35.6178)
- Seismic zone: Dead Sea Transform fault — earthquakes are relevant

### Lumière/Ombre Classification

**Lumière categories** (positive developments):
- `cultural_event` — festivals, exhibitions, concerts, awards
- `reconstruction` — rebuilding, infrastructure projects
- `institutional_progress` — elections, reforms, legislation
- `solidarity` — humanitarian aid received, donations, volunteering
- `economic_positive` — investment, job creation, LBP stabilization
- `international_recognition` — awards, diplomatic achievements
- `environmental_positive` — reforestation, clean-up, conservation

**Ombre categories** (negative developments):
- `armed_conflict` — shelling, airstrikes, clashes, military operations
- `economic_crisis` — LBP devaluation, bank closures, shortages
- `political_tension` — protests, political crises, government collapse
- `displacement` — refugee movements, internal displacement
- `infrastructure_failure` — power outages, internet cuts, water crisis
- `environmental_negative` — fires, pollution, waste crisis
- `disinformation` — coordinated campaigns, fake news waves
- `violence` — bombings, assassinations, crime surges

### Source Priority & Reliability
| Source | Reliability | Refresh | Auth |
|--------|-----------|---------|------|
| GDELT | medium | 15min | none |
| USGS | high | realtime | none |
| NASA FIRMS | high | 3h | MAP_KEY (free) |
| GDACS | high | 1h | none |
| ReliefWeb | high | daily | none |
| Cloudflare Radar | high | realtime | account |
| RSS media | varies | 15-30min | none |
| OpenWeatherMap | high | 1h | API key (free) |
| LBP/USD scrape | medium | 1h | none |
| OpenAQ | medium | 1h | none |

## Data Flow
```
Sources → Fetchers → Normalizers → Classifier → Registry → API Routes → Frontend
                                                    ↓
                                              LebanonEvent[]
                                              (unified schema)
```

## Key API Endpoints Reference

### GDELT DOC API
```
GET https://api.gdeltproject.org/api/v2/doc/doc
  ?query=sourceloc:Lebanon
  &mode=ArtList
  &maxrecords=75
  &format=json
  &sort=DateDesc
```
Filter by tone: add `tone>3` for positive, `tone<-3` for negative.

### USGS Earthquake
```
GET https://earthquake.usgs.gov/fdsnws/event/1/query
  ?format=geojson
  &minlatitude=33
  &maxlatitude=34.7
  &minlongitude=35
  &maxlongitude=36.7
  &minmagnitude=2
  &orderby=time
  &limit=20
```

### NASA FIRMS
```
GET https://firms.modaps.eosdis.nasa.gov/api/area/csv/{MAP_KEY}/VIIRS_NOAA20_NRT/35,33,36.7,34.7/2
```

### GDACS
```
GET https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH
  ?eventtype=EQ,FL,WF
  &country=LBN
  &limit=20
```

### ReliefWeb
```
GET https://api.reliefweb.int/v1/reports
  ?appname=lebanon-monitor
  &filter[field]=country
  &filter[value]=Lebanon
  &limit=20
  &sort[]=date:desc
```

### Cloudflare Radar (outages)
```
GET https://api.cloudflare.com/client/v4/radar/annotations/outages
  ?location=LB
  &limit=10
Headers: Authorization: Bearer {CF_API_TOKEN}
```

### OpenWeatherMap
```
GET https://api.openweathermap.org/data/2.5/weather
  ?lat=33.8938&lon=35.5018
  &appid={OWM_API_KEY}
  &units=metric
```

### OpenAQ
```
GET https://api.openaq.org/v2/latest
  ?country=LB
  &limit=50
```

### RSS Feeds (Lebanese media)
```
https://www.lorientlejour.com/rss
http://nna-leb.gov.lb/en/rss
https://www.aljazeera.com/xml/rss/all.xml  (filter: Lebanon)
https://www.france24.com/en/rss  (filter: Lebanon)
```

### LBP/USD Rate
Scrape from `https://lirarate.org/` — rate is in the DOM as text content.
Backup: `https://lbprate.com/`
