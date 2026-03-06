# Agent Launch Prompt — Phase 1: Data Foundation

Paste this prompt into Cursor's Agent (Composer) to start the project.

---

## PROMPT TO PASTE:

```
Read the following files carefully before doing anything:
- SKILL.md (project domain knowledge, API endpoints, classification rules)
- .cursor/plans/phase-1-data-foundation.md (step-by-step implementation plan)
- docs/API_REFERENCE.md (detailed API specs for all 10 sources)
- .cursor/rules/project.mdc (code style and architecture rules)
- .cursor/rules/data-ingestion.mdc (source module structure)
- .cursor/rules/testing.mdc (test conventions)

You are building the data foundation for Lebanon Monitor, a real-time intelligence dashboard for Lebanon.

Execute the Phase 1 plan step by step:

1. **Scaffold** the Next.js project with TypeScript, Tailwind, App Router. Install all required dependencies.

2. **Build core types** — LebanonEvent interface, SourceName enum, EventCategory enum, Result type, shared fetcher with timeout/retry, structured logger, Lebanon config (bounding box, cities), classification keywords dictionaries (French, English, Arabic) and shared classifier.

3. **Implement each data source** in order (GDELT → USGS → FIRMS → RSS → GDACS → ReliefWeb → Weather → Cloudflare → LBP Rate → OpenAQ). For each:
   - Create the module structure (config, types, fetcher, normalizer, classifier, index)
   - Make a live API call to test connectivity
   - Save the real response as a JSON/CSV fixture in __tests__/fixtures/
   - Write tests using the fixture
   - Run the tests and fix any failures
   - Register in the source registry

4. **Build the source registry** with fetchAll() and the API routes (/api/events, /api/health).

5. **Validate everything**:
   - Run `npx vitest run` — all tests must pass
   - Run `npx tsc --noEmit` — no type errors
   - Run lint/format
   - Delete any unused files or stale code
   - Verify .gitignore is correct

6. **Report** a final health check table showing each source's status, event count, and classification distribution.

Use the @data-collector subagent for implementing individual sources.
Use the @api-tester subagent after all sources are built to run the full validation.
Use the @cleanup subagent at the end to organize the project.

Important constraints:
- Never hardcode API keys. Use process.env with .env.local
- For FIRMS: if no MAP_KEY is available, create the module but skip live test
- For Cloudflare: if no token, create the module but skip live test  
- All other sources should work without auth
- Save real API responses as fixtures for offline testing
- Follow the LebanonEvent interface exactly — no deviations
- TypeScript strict mode, no `any` types
- Each source module must be independently testable

Start with Step 0 (scaffold) and work through each step sequentially. After each source, confirm it works before moving to the next.
```
