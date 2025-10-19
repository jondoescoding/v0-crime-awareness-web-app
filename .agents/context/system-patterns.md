---
created: 2025-09-30T22:08:39Z
last_updated: 2025-09-30T22:56:08Z
version: 1.1
author: Claude Code PM System
---

# System Patterns

## Backend Architecture
- Layered services: FastAPI routers under src/api/v0/ delegate to services/calljaa modules for business logic.
- Stage-based enrichment: Orchestrator composes stage01_query_builder -> stage02_api_client -> stage03_data_parser -> stage04_data_merger for targeted testing and reuse.
- Async I/O: httpx.AsyncClient, asyncio sleeps, and explicit rate limiting handle serper.dev calls without blocking the event loop.
- Resilient fallbacks: When enrichment fails, the orchestrator builds a GasStationEnriched fallback so downstream consumers still receive baseline data.
- Configuration abstraction: Config class loads environment variables once and exposes typed properties (firecrawl_api_key, serper_timeout, serper_request_delay).
- Structured logging: core/logging.py centralizes logger creation with JSON-friendly context, enabling consistent audit trails across stages and endpoints.

## Data Handling
- Immutable artifacts: Extraction and enrichment runs produce dated JSON files under backend/data/ for deterministic reprocessing and audit trails.
- Pydantic validation: Models enforce schema consistency for extraction payloads, enrichment requests, and API responses, preventing shape drift.
- Automated batching: ackend/scripts/run_full_enrichment.py orchestrates <=25 item batches with exponential backoff, duplicate detection, and optional --include-images thumbnail capture (latest run yielded 207/224 stations with thumbnails, 3 fallbacks).
- Metadata-first reporting: Each batch persists un_metadata.json containing run_id, per-batch telemetry, duplicates, and failure lists to inform retries and QA.

## Mobile Application Patterns
- File-based routing: Expo Router organizes screens via directory structure with root layout files managing stacks and a (tabs) folder defining the bottom tab navigator.
- State isolation: Zustand stores encapsulate auth session (tokens persisted in SecureStore) and modal visibility, promoting testable hooks such as useAuth and useRequireAuth.
- Query caching: Shared QueryClient instance in apps/mobile/src/app/_layout.jsx applies default stale times and retry logic for server data once API wiring is complete.
- Design system: Screens rely on consistent typography with Expo Google Fonts (Inter family), lucide icons, and color palette toggled by useColorScheme.
- User feedback: RefreshControl on station lists, modals for sort and filters, and planned notifications via expo-notifications and sonner-native for toasts.

## Cross-cutting Concerns
- Environment bootstrapping: Splash screen stays visible until auth state is restored, ensuring the UI does not flash unauthenticated state.
- Error handling: Global FastAPI exception handler returns JSON with error_type, message, and timestamp; mobile screens rely on safe area padding and status bar control to avoid layout glitches.
- Testing strategy: Pytest uses mocks for Firecrawl and serper responses, with verbose print statements for diagnostic clarity during async tests.
- Operational memory: .codex task system and metadata artifacts capture run history, outstanding issues (e.g., stations missing coordinates), and guidance for future automation.
