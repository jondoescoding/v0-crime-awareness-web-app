---
created: 2025-09-30T22:08:39Z
last_updated: 2025-09-30T22:56:08Z
version: 1.1
author: Claude Code PM System
---

# Freshh Gas Project Overview

## Key Capabilities
- FastAPI backend (backend/) scrapes calljaa.com for raw fuel price cards, standardizes the schema, and stores results inside timestamped backend/data/extracted_data/ folders.
- Modular enrichment pipeline (backend/src/services/calljaa/enrichment/) augments stations with serper.dev Google Maps metadata such as coordinates, contact info, hours, and optional thumbnail images via the batch script ackend/scripts/run_full_enrichment.py.
- Expo/React Native app (freshh_Gas/apps/mobile/) presents the cheapest fuel narrative with search, filtering, and dark-mode aware UI that pulls from enriched station data.
- Shared React component library (freshh_Gas/components/) and hooks (auth, safe area, query client) keep presentation consistent across future surfaces like web.

## Data Flow Summary
1. GET /api/v0/calljaa/fuel-prices triggers Firecrawl scraping and saves cleaned JSON to backend/data/<MM_DD_YY>/.
2. Batch jobs (documented under .codex/tasks/in-progress/data-enrichment/) invoke POST /api/v0/calljaa/enrich-gas-stations with chunked payloads—most recently un_full_enrichment.py --include-images (run ID nrichment_20251001T024838Z) enriched 221/224 stations with thumbnails.
3. Enriched artifacts and run metadata are written to backend/data/enriched_data/<run-name>/ for downstream consumers and audits.
4. The mobile app eventually consumes the enriched endpoint (or bundled payloads) to render station cards, alerts, and subscription experiences.

## Active Surfaces
- Mobile Tabs: Home (station list plus filters), Subscriptions (placeholder for upcoming premium access), Settings (alerts and preferences management).
- Backend API: /api/v0/calljaa/fuel-prices (async scrape) and /api/v0/calljaa/enrich-gas-stations (async Google Maps enrichment with optional flags).
- Scripts & Tasks: .codex/tasks/in-progress/data-enrichment/006-full-data-enrichment-run.md documents the full September 2025 batch run requirements.

## Known Limitations
- Enrichment endpoint currently selects the first Google Maps result; manual QA is still required for edge cases and mismatched stations.
- Three stations (FESCO, INDEPENDENT, TEXACO) still lack coordinates/thumbnails after the latest batch; requires query tuning or manual overrides.
- Voice call agent (backend/src/services/calljaa/voice_call_agent.py) exists as a placeholder without implementation.
- Mobile UI uses mock station data until API wiring is complete, so price updates are not yet live in the app build.

## Integrations
- Firecrawl (web scraping), serper.dev (Maps enrichment), Expo SecureStore for client auth tokens, Zustand for auth state, and TanStack Query for client-side caching.
