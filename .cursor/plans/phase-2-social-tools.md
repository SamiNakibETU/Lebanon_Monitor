# Phase 2 Plan — Social & Extended Sources

## Objective
Extend Lebanon Monitor with Twitter/X via Nitter, Python scraping phases, and additional data layers.

## Completed in Phase 2

### 1. TypeScript Twitter Source (integrated)
- **Path**: `src/sources/twitter/`
- **Method**: Nitter RSS for profile timelines (no API key)
- **Handles**: LBCgroup, AlJadeedLive, LBCI_NEWS, mtvlebanon, NNA_Lebanon, Lebanon24, The961, LorientLeJour
- **Registry**: Registered in `fetchAll()`, appears in `/api/events` and dashboard

### 2. Python Scraper (standalone)
- **Path**: `scrape_twitter.py`
- **Adapted for Lebanon**: handles, search queries, hashtags
- **Phases**:
  - **Phase 1 (profils)** : scrapes all LEBANON_HANDLES via RSS puis HTML fallback
  - **Phase 2 (recherche)** : requêtes Lebanon, Liban, Beirut
  - **Phase 3 (hashtags)** : #Lebanon, #Liban, #لبنان
- **Usage**:
  ```bash
  python scrape_twitter.py                    # tous les handles
  python scrape_twitter.py --lebanon-full    # phases 1+2+3
  python scrape_twitter.py --query "Lebanon" --limit 100
  python scrape_twitter.py --hashtag Lebanon
  ```
- **Output**: `data/raw/twitter/tweets_*.csv`

### 3. Config
- `config/nitter_instances.txt` : instances pour RSS profils
- `config/nitter_search_instances.txt` : instances pour search/hashtag HTML

## Future Phases (Phase 3+)

### Phase 3 — Enrichment
- Ingestion CSV Python → API ou fichier partagé
- Engagement (likes, RT, replies) si utile
- Dédoublonnage cross-source (Twitter vs RSS)

### Phase 4 — Additional Layers
- Telegram channels (si API/bot)
- WhatsApp/Signal (complexité légale)
- YouTube mapping

### Phase 5 — Alerts & Automation
- Cron pour `scrape_twitter.py --lebanon-full`
- Webhooks / notifications sur événements critiques
- Export CSV/JSON planifié
