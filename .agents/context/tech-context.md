---
created: 2025-09-30T22:08:39Z
last_updated: 2025-09-30T22:56:08Z
version: 1.1
author: Claude Code PM System
---

# Technical Context

## Languages and Runtimes
- Python 3.13 target (ruff configuration) with minimum runtime 3.8 defined in backend/pyproject.toml.
- JavaScript and TypeScript across the Expo monorepo; strict TypeScript enabled via freshh_Gas/tsconfig.json.
- React Native 0.79 for the shared Expo project plus React Native 0.79.3 in the mobile-specific package; Expo SDK 53 in apps/mobile and Expo SDK 54 in the project root.

## Backend Stack (backend/)
- FastAPI for the HTTP API surface with uvicorn (development server) and httpx for async HTTP calls.
- firecrawl-py for scraping calljaa.com, requests for synchronous tasks, and python-dotenv for configuration loading.
- Pydantic models under backend/src/models/calljaa/ define schemas for extraction, enrichment, and API responses.
- Custom logging via backend/src/core/logging.py providing structured JSON-friendly logging with console and file outputs.
- Testing uses pytest, pytest-asyncio, and pytest-cov. Ruff enforces linting and formatting (line length 100, double quotes).
- Data stored as JSON artifacts under backend/data/ with directories for raw extraction and enriched datasets; uv.lock tracks dependency resolution managed by uv.

## Enrichment Pipeline
- Structured into stage modules (query builder, API client, data parser, merger, orchestrator) inside backend/src/services/calljaa/enrichment/.
- Async orchestration uses httpx.AsyncClient and per-request awaitable delays pulled from Config.serper_request_delay.
- Config class (backend/src/core/config.py) loads .env variables, validates Firecrawl key on startup, and exposes serper base URL, timeout, and delay.
- Batch automation script ackend/scripts/run_full_enrichment.py drives end-to-end runs via httpx.ASGITransport, chunking (<=25), exponential backoff, and optional --include-images flag for thumbnail capture; latest run ID nrichment_20251001T024838Z produced 221 enriched/3 fallback stations.

## Mobile Stack (freshh_Gas/)
- Expo Router for navigation with file-based routes located in apps/mobile/src/app/ and tabs layout splitting Home, Subscriptions, and Settings.
- Zustand stores manage auth state (apps/mobile/src/utils/auth/store.js). Expo SecureStore persists tokens, while React Query wraps network state inside QueryClientProvider.
- UI built with React Native components, lucide-react-native icons, Expo Google Fonts, and numerous Expo modules (camera, maps, notifications, contacts, sensors, blur, GL, etc.).
- Expo build properties and patch-package handle native overrides such as @shopify/react-native-skia v2.0.0-next.4 and react-native-graph overrides.
- Web support uses react-native-web and dedicated apps/web package with Bun lockfile.

## Tooling and Infrastructure
- Git repository on branch feature/data-enrichment-epic with extensive .claude deletions pending commit; .codex introduces new context tooling.
- .env at repo root provides FIRECRAWL_API_KEY and SERPER_API_KEY plus optional LOG_LEVEL.
- Linting: eslint-config-expo for the JS workspace; ruff for Python with per-file ignores for __init__.py and tests.
- Testing: backend uses pytest; mobile relies on Expo tooling (no dedicated test scripts defined yet).
- Project automation tasks and documentation stored under .codex/ including PRDs and session tasks.
