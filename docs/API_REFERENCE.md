# API Reference — Lebanon Monitor Data Sources

## 1. GDELT DOC API

**Purpose**: Main event feed — news articles about Lebanon with geolocation and tone.
**Endpoint**: `https://api.gdeltproject.org/api/v2/doc/doc`
**Auth**: None
**Rate limit**: No published limit, but be respectful (~1 req/min)
**TTL**: 15 minutes

**Parameters**:
| Param | Value | Notes |
|-------|-------|-------|
| query | `sourceloc:Lebanon` | Can combine: `sourceloc:Lebanon tone<-5` |
| mode | `ArtList` | Returns article list |
| maxrecords | `75` | Max 250 |
| format | `json` | Also: `html`, `rss`, `csv` |
| sort | `DateDesc` | Newest first |
| timespan | `1d` | Last 24h. Options: `15min`, `1h`, `1d`, `7d` |

**Response shape** (JSON mode):
```json
{
  "articles": [
    {
      "url": "https://...",
      "url_mobile": "",
      "title": "Lebanon's parliament approves...",
      "seendate": "20250301T120000Z",
      "socialimage": "https://...",
      "domain": "lorientlejour.com",
      "language": "French",
      "sourcecountry": "Lebanon",
      "tone": -2.34,
      "extrasdata": ""
    }
  ]
}
```

**Tone interpretation**: -100 (extremely negative) to +100 (extremely positive). Most scores are -10 to +10.

**Lumière/Ombre mapping**:
- tone > 3 → lumière (confidence: tone/10, capped at 1)
- tone < -3 → ombre (confidence: abs(tone)/10, capped at 1)
- -3 ≤ tone ≤ 3 → neutre (confidence: 0.5)

**Geolocation**: GDELT does not return lat/lng in DOC API. Must geocode from article content or use GKG API. For MVP: assign default lat/lng based on `domain` mapping (OLJ → Beirut, etc.) or skip geoloc for this source initially.

---

## 2. USGS Earthquake API

**Purpose**: Real-time seismic activity in/near Lebanon.
**Endpoint**: `https://earthquake.usgs.gov/fdsnws/event/1/query`
**Auth**: None
**Rate limit**: None published
**TTL**: 5 minutes (seismic data is time-critical)

**Parameters**:
| Param | Value |
|-------|-------|
| format | `geojson` |
| minlatitude | `33.0` |
| maxlatitude | `34.7` |
| minlongitude | `35.0` |
| maxlongitude | `36.7` |
| minmagnitude | `2.0` |
| orderby | `time` |
| limit | `20` |

**Response shape** (GeoJSON):
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "mag": 3.2,
        "place": "15 km NE of Beirut, Lebanon",
        "time": 1709312400000,
        "url": "https://earthquake.usgs.gov/...",
        "title": "M 3.2 - 15 km NE of Beirut",
        "type": "earthquake",
        "alert": null,
        "tsunami": 0
      },
      "geometry": {
        "type": "Point",
        "coordinates": [35.55, 33.95, 10.0]
      },
      "id": "us7000..."
    }
  ]
}
```

**Classification**: All earthquakes → ombre. Severity: mag < 3 → low, 3-4.5 → medium, 4.5-6 → high, > 6 → critical.

---

## 3. NASA FIRMS (Fire Information)

**Purpose**: Active fire/hotspot detection via satellite.
**Endpoint**: `https://firms.modaps.eosdis.nasa.gov/api/area/csv/{MAP_KEY}/VIIRS_NOAA20_NRT/{AREA}/{DAYS}`
**Auth**: MAP_KEY (free, get from https://firms.modaps.eosdis.nasa.gov/api/map_key/)
**Rate limit**: 500 transactions/day
**TTL**: 3 hours

**Parameters**:
- `{MAP_KEY}`: your registered key
- `{AREA}`: `35,33,36.7,34.7` (west,south,east,north — Lebanon bbox)
- `{DAYS}`: `1` to `10`

**Response**: CSV with columns:
```
latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight
34.1234,35.5678,312.5,0.39,0.36,2025-03-01,1245,N,VIIRS,nominal,2.0NRT,290.1,5.2,D
```

**Key fields**: `latitude`, `longitude`, `acq_date`, `acq_time`, `confidence` (nominal/low/high), `frp` (fire radiative power).

**Classification**: All fires → ombre. Severity based on `frp`: < 10 → low, 10-50 → medium, > 50 → high.

---

## 4. GDACS (Global Disaster Alerts)

**Purpose**: Natural disaster alerts (earthquakes, floods, cyclones, droughts).
**Endpoint**: `https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH`
**Auth**: None
**Rate limit**: Be respectful
**TTL**: 1 hour

**Parameters**:
| Param | Value |
|-------|-------|
| eventtype | `EQ,FL,WF,TC` |
| country | `LBN` |
| alertlevel | `Orange;Red` (skip Green) |
| limit | `20` |

**Response**: GeoJSON FeatureCollection. Key properties: `alertlevel`, `eventtype`, `name`, `description`, `fromdate`, `todate`, `country`.

**Classification**: All disasters → ombre. Severity: Green → low, Orange → high, Red → critical.

---

## 5. ReliefWeb API

**Purpose**: Humanitarian reports, situation updates, funding flows.
**Endpoint**: `https://api.reliefweb.int/v1/reports`
**Auth**: None (add `appname` param for identification)
**Rate limit**: None published
**TTL**: 1 hour

**Parameters**:
```
?appname=lebanon-monitor
&filter[field]=country
&filter[value]=Lebanon
&limit=20
&sort[]=date:desc
&fields[include][]=title
&fields[include][]=date.original
&fields[include][]=source
&fields[include][]=url
&fields[include][]=theme
&fields[include][]=body-html
```

**Response**:
```json
{
  "data": [
    {
      "id": "123456",
      "fields": {
        "title": "Lebanon: Flash Update No. 5",
        "date": {"original": "2025-03-01T00:00:00+00:00"},
        "source": [{"name": "OCHA"}],
        "url": "https://reliefweb.int/report/...",
        "theme": [{"name": "Food and Nutrition"}, {"name": "Health"}]
      }
    }
  ]
}
```

**Classification**: Keyword-based on title + theme. Keywords like "emergency", "crisis", "attack", "displacement" → ombre. Keywords like "recovery", "donation", "reconstruction", "programme" → lumière. Default: neutre.

---

## 6. OpenWeatherMap

**Purpose**: Current weather conditions in major Lebanese cities.
**Endpoint**: `https://api.openweathermap.org/data/2.5/weather`
**Auth**: API key (free tier: 1000 calls/day)
**TTL**: 1 hour

**Params**: `?lat=33.8938&lon=35.5018&appid={KEY}&units=metric`

**Response**: Standard OWM JSON with `main.temp`, `weather[0].main`, `wind.speed`, etc.

**Classification**: Extreme weather → ombre (temp > 40 or < 0, wind > 80 km/h). Otherwise: neutre. Weather is contextual, not directly lumière/ombre.

---

## 7. Cloudflare Radar (Internet Outages)

**Purpose**: Detect internet connectivity disruptions in Lebanon.
**Endpoint**: `https://api.cloudflare.com/client/v4/radar/annotations/outages`
**Auth**: Bearer token (free Cloudflare account)
**TTL**: 30 minutes

**Params**: `?location=LB&limit=10`
**Headers**: `Authorization: Bearer {CF_API_TOKEN}`

**Response**: Array of outage annotations with `startDate`, `endDate`, `scope`, `asns`, `locations`.

**Classification**: All outages → ombre. Severity based on duration: < 1h → medium, > 1h → high, > 6h → critical.

---

## 8. RSS Feeds (Lebanese Media)

**Purpose**: News headlines from major Lebanese and regional outlets.
**Feeds**:
| Outlet | URL | Language |
|--------|-----|----------|
| L'Orient-Le Jour | `https://www.lorientlejour.com/rss` | fr |
| NNA (National News Agency) | `http://nna-leb.gov.lb/en/rss` | en |
| Al Jazeera English | `https://www.aljazeera.com/xml/rss/all.xml` | en |
| France 24 English | `https://www.france24.com/en/rss` | en |
| Daily Star Lebanon | `https://www.dailystar.com.lb/rss` | en |
| MTV Lebanon | `https://www.mtv.com.lb/rss` | ar/en |

**Auth**: None
**TTL**: 15 minutes

**Processing**:
1. Parse RSS/Atom with `rss-parser` npm package
2. Filter articles mentioning Lebanon (for non-Lebanese sources)
3. Extract: title, link, pubDate, description
4. Classify title using keyword dictionaries
5. Geolocation: extract city names from title/description, map to coordinates

---

## 9. LBP/USD Exchange Rate (Scrape)

**Purpose**: Track Lebanese Pound parallel market rate.
**Target**: `https://lirarate.org/`
**Backup**: `https://lbprate.com/`
**Auth**: None
**TTL**: 1 hour

**Method**: HTTP fetch + Cheerio (or regex on raw HTML). The rate is displayed prominently on the page.

**Classification**: 
- Rate stable or decreasing → lumière
- Rate increasing (devaluation) → ombre
- Need to store previous value to compute delta

---

## 10. OpenAQ (Air Quality)

**Purpose**: Air quality measurements from Lebanese monitoring stations.
**Endpoint**: `https://api.openaq.org/v2/latest`
**Auth**: None
**TTL**: 1 hour

**Params**: `?country=LB&limit=50`

**Response**:
```json
{
  "results": [
    {
      "location": "Beirut",
      "city": "Beirut",
      "country": "LB",
      "coordinates": {"latitude": 33.89, "longitude": 35.50},
      "measurements": [
        {"parameter": "pm25", "value": 35.2, "unit": "µg/m³", "lastUpdated": "..."}
      ]
    }
  ]
}
```

**Classification**: PM2.5 > 35 (WHO guideline) → ombre. PM2.5 ≤ 12 → lumière (clean air). Between → neutre.
