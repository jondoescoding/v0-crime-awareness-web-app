---
name: displaying-fuel-price-data
status: in_progress
created: 2025-10-02T18:25:12Z
updated: 2025-10-05T17:25:00Z
finished: 10-06-25
progress: 80%
tasks:
  prd: .codex/tasks/todo/00_displaying_fuel_price_data/000_displaying_fuel_price_data_prd.md
  tasks_to_be_done:
    - .codex/tasks/todo/00_displaying_fuel_price_data/001_backend_endpoint_scope.md
    - .codex/tasks/todo/00_displaying_fuel_price_data/002_backend_data_validation.md
    - .codex/tasks/todo/00_displaying_fuel_price_data/003_mobile_data_fetch_state.md
    - .codex/tasks/todo/00_displaying_fuel_price_data/004_mobile_ui_display.md
    - .codex/tasks/todo/00_displaying_fuel_price_data/005_quality_guardrails.md
---

# PRD: Displaying Fuel Price Data

## Overview
Deliver a fast, reliable experience for viewing the latest Jamaican fuel price catalogue inside the Expo/React Native mobile app. The flow pulls the full MongoDB dataset through a versioned FastAPI endpoint, normalises it through validated services, and keeps the data instantly accessible for navigation and client-side exploration. The current implementation ships the end-to-end read path, and the remaining work focuses on refining the home experience and rounding out usability polish.

## Current Status
- Backend route `GET /api/v0/calljaa/fuel-prices` is live with FastAPI, delegating to `services/calljaa/catalog.get_fuel_price_catalog` and returning Pydantic-backed `FuelPriceCatalogResponse` objects.
- Mongo read path sanitises addresses via `normalize_location_string`, coerces prices with `validate_fuel_price`, enforces schema through `GasStationEnriched`, and derives metadata (record count, dataset version, last sync) server-side.
- Mobile `useFuelPrices` hook wraps the endpoint with React Query, writes into the `useFuelPriceStore` Zustand slice, and exposes `stations`/`metadata` that are consumed by `apps/mobile/src/app/(tabs)/home.tsx`.
- Home tab renders a bespoke card list with search, sort toggles, price range sliders, and modal-based sort selection. UI scaffolding is present, but the filter sheet and sort interactions do not yet mutate the rendered dataset.
- Dedicated `FuelPriceList` component exists for a simpler list presentation, but the home screen currently uses a custom scroll layout instead of the shared list abstraction.
- Error and loading states display (skeleton cards, retry button, pull-to-refresh). Notification icon, subscriptions/settings tabs, and actionable reminders are placeholders awaiting future scope.

## Architecture Decisions
- **FastAPI v0 routing layer**: Keep the HTTP handler minimal and rely on the catalog service for validation, logging, and Mongo access. All exceptions are mapped to descriptive HTTP errors with `error_type` context for observability.
- **Mongo-backed catalog service**: `_execute_catalog_fetch` encapsulates configuration resolution, optional filter construction, and typed sanitisation so future routes can reuse the same logic. Metadata derivation standardises dataset versioning for the client.
- **Typed contracts**: Shared `models/calljaa/catalog.py` definitions and mirrored TypeScript types guarantee parity between API responses and mobile consumption.
- **Client data plumbing**: React Query handles request lifecycle with a 5-minute stale window, while Zustand keeps the latest payload globally accessible to other tabs without refetching.
- **Environment configuration**: `core.config.Config` loads `.env` files from multiple fallbacks, enforcing Mongo credentials at import time; mobile `getApiBaseUrl` honours `EXPO_PUBLIC_API_BASE_URL` with a dev fallback IP.
- **Logging and telemetry**: All backend layers log start/end, document counts, and failure modes via `core.logging`. The mobile client adds console tracing (guarded by `__DEV__`) around station card derivation and request timing for debugging.

## Data Flow Snapshot
1. Mobile home screen mounts `useFuelPrices`, triggering `fetchFuelPriceCatalog` with optional query params for future parish/company scoping.
2. Hook fetches from `${baseUrl}/api/v0/calljaa/fuel-prices`, where FastAPI validates query args and hands control to the catalog service.
3. Service reads from MongoDB, normalises station documents, builds metadata, and returns a `FuelPriceCatalogResponse`.
4. React Query caches the payload and the hook writes stations/metadata into Zustand. `home.tsx` memoises station cards, applies client-side search/sort scaffolding, and renders a scrollable layout with loading/error fallbacks.
5. Pull-to-refresh calls `refetch`, keeping cache warm without discarding local state. Planned enhancements will wire the filter sheet and sort modal into the memoised selector logic.

## Technical Approach

- **Backend**
  - Maintain the catalog service as the single source for Mongo reads, adding safeguards for configuration, schema drift, and future pagination. Consider integrating caching (Redis or in-process cache) once access patterns stabilise.
  - Expand unit coverage around `_derive_metadata` edge cases (missing timestamps, mixed dataset versions) and price/location sanitisation utilities.
  - Document required environment variables (`MONGODB_URI`, `MONGODB_DATABASE`, `MONGODB_COLLECTION`) alongside deployment runbooks so mobile can rely on consistent availability.

- **Mobile App**
  - Finalise the home tab interactions by wiring search, sort, fuel-type filters, and price range sliders into the derived station selector. Ensure performance by memoising selectors and deferring heavy transforms.
  - Decide whether to reuse `FuelPriceList` or continue with the bespoke layout; if both views are retained, move shared formatting helpers (e.g., price display, metadata header) into the fuel price feature module.
  - Audit loading and error UI against design requirements (skeleton count, typography, dark-mode treatments) and extend toast/error reporting via `sonner-native` once integrated.

- **Quality & Enablement**
  - Add FastAPI integration tests asserting success/error paths for the catalog endpoint, including filter parameters and schema validation failures.
  - Introduce React Native tests (or component stories) that render the home screen with mocked store data to verify search, sort, and empty states once wired.
  - Update `.codex/docs/development_practices/FUEL_PRICE_DATA_FLOW.md` with the refined client flow and troubleshooting tips (e.g., local base URL expectations, Mongo connection errors).

### Infrastructure
No new infrastructure is needed. Ensure deployment environments set Mongo credentials and that mobile release builds receive the correct `EXPO_PUBLIC_API_BASE_URL`. Consider adding a staging base URL to avoid pointing development builds at production data.

## Implementation Strategy
1. Confirm backend catalog service coverage and add regression tests/documentation for configuration and metadata derivation.
2. Harden the mobile station selector logic so all UI controls mutate the rendered dataset without blocking scrolling performance.
3. Consolidate reusable presentation pieces (price formatting, metadata header) and remove unused components or clearly document their intended usage.
4. Round out tests across API and mobile layers, then refresh documentation and changelog entries before closing the epic.

## Task Breakdown Preview

**5 core tasks**:
- [x] 001_backend_endpoint_scope.md — Audit and align the FastAPI route and service composition.
- [x] 002_backend_data_validation.md — Finalise Mongo service queries and Pydantic response schemas.
- [x] 003_mobile_data_fetch_state.md — Implement React Query hook and Zustand integration for fuel prices.
- [ ] 004_mobile_ui_display.md — Complete the home screen interactions (search/sort/filter) and align styling with design.
- [x] 005_quality_guardrails.md — Add tests, logging coverage, and documentation updates.

## Dependencies

**external dependencies**:
- MongoDB Atlas access with the 224-record fuel price dataset.
- Stable deployment URL for the API reachable by the Expo app (Dev/QA/Prod).

**internal dependencies**:
- `services/calljaa` module for data extraction and upload.
- Project-wide logging utility `core.logging.get_logger`.
- Mobile React Query provider and Zustand store bootstrap (already configured in app root).

**prerequisite work**:
- Ensure `.env` files (backend and mobile) contain the correct API base URLs and Mongo credentials.
- FastAPI app must remain wired into the ASGI server with dependency injection for Mongo clients; local dev requires `uvicorn` running alongside Expo.

## Success Criteria (Technical)

**functional requirements**:
- Fuel price API returns the complete dataset with consistent sorting, metadata, and schema guarantees even when optional filters are used.
- Mobile home screen displays all stations with fuel types, prices, and last-sync metadata, supporting pull-to-refresh and interactive search/sort/filter once completed.
- Client gracefully handles offline/error states and persists data for navigation sessions via React Query + Zustand.

**performance benchmarks**:
- Backend endpoint responds within 300ms p95 for 224 records; add monitoring hooks to alert on regressions.
- Mobile list renders under 100ms on target devices and maintains 60fps scrolling; memoised selectors prevent O(n) recompute per keystroke.
- React Query cache revalidates in background without blocking UI interactions or deleting the stored dataset.

## Tasks Created
- [x] .codex/tasks/todo/00_displaying_fuel_price_data/001_backend_endpoint_scope.md
- [x] .codex/tasks/todo/00_displaying_fuel_price_data/002_backend_data_validation.md
- [x] .codex/tasks/todo/00_displaying_fuel_price_data/003_mobile_data_fetch_state.md
- [ ] .codex/tasks/todo/00_displaying_fuel_price_data/004_mobile_ui_display.md
- [x] .codex/tasks/todo/00_displaying_fuel_price_data/005_quality_guardrails.md

Total tasks: 5
Completed: 4 (80%)
In progress: 1
Pending: 0
