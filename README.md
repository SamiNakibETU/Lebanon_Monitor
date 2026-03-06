# Lebanon Monitor

Real-time intelligence dashboard for Lebanon. Aggregates 10+ public data sources, classifies events as Lumière (positive) or Ombre (negative), and displays them on an interactive map.

## Quick Start

```bash
npm install
npm run dev
```

## API Endpoints

- **GET /api/events** — Aggregated events from all sources
  - Query params: `source` (all|gdelt|usgs|...), `classification` (all|lumiere|ombre|neutre)
- **GET /api/health** — Source status and event counts

## Environment Variables

Copy `.env.local.example` to `.env.local`:

- `FIRMS_MAP_KEY` — NASA FIRMS (optional)
- `OWM_API_KEY` — OpenWeatherMap (optional)
- `CF_API_TOKEN` — Cloudflare Radar (optional)
- `OPENAQ_API_KEY` — OpenAQ v3 (optional, free at explore.openaq.org/register)

## Data Sources

| Source      | Auth   | Status                      |
|-------------|--------|-----------------------------|
| GDELT       | None   | Rate limit / format may vary |
| USGS        | None   | ✓                           |
| NASA FIRMS  | MAP_KEY| ✓ (with key)                |
| RSS         | None   | ✓ (some feeds may 403)       |
| GDACS       | None   | ✓                           |
| ReliefWeb   | Appname| Requires approval            |
| OpenWeatherMap | KEY | ✓ (with key)                |
| Cloudflare  | Token  | ✓ (with token)               |
| LBP Rate    | None   | ✓                           |
| OpenAQ      | API Key| ✓ v3 (with key)             |

## Scripts

- `npm run dev` — Development server
- `npm run build` — Production build
- `npm run test` — Run Vitest tests
- `npm run type-check` — TypeScript check
- `npm run lint` — ESLint

## Project Structure

```
src/
├── types/         # LebanonEvent, SourceName, etc.
├── config/        # Lebanon geography, bounding box
├── lib/           # fetcher, logger, classification
├── sources/       # 10 data source modules
│   ├── gdelt/
│   ├── usgs/
│   ├── firms/
│   └── ...
└── app/
    └── api/       # /api/events, /api/health
```
