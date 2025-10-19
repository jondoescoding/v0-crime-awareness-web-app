# Fuel Price Data Flow

This note captures how fuel price information moves from the upstream data store into the Expo mobile experience. It anchors future work on caching, pagination, and UI polish.

## 1. Source of truth
- MongoDB collection defined by `core.config` keys (`MONGODB_URI`, `MONGODB_DATABASE`, `MONGODB_COLLECTION`).
- Documents represent enriched gas stations; key fields: `station_name`, `location`, `fuel_types`, `last_synced_at`, optional metadata (coordinates, opening_hours, etc.).

## 2. Backend processing pipeline
1. **Configuration resolution** – `services.calljaa.catalog._resolve_configuration` validates environment settings and raises `FuelPriceCatalogError` on missing values.
2. **Query assembly** – `_build_filters` derives Mongo selectors from optional `parish`, `company`, and `limit` query parameters.
3. **Mongo fetch** – `_execute_catalog_fetch` delegates to `_query_collection`, applying alphabetical sort and optional limit.
4. **Normalization** – `_sanitize_station` cleans each document:
   - Removes `_id`, normalizes location strings, enforces presence of fuel type entries.
   - Converts price strings/zeros to `None` via `utils.calljaa.validate_fuel_price`.
   - Guarantees `opening_hours` defaults to an empty list.
5. **Metadata derivation** – `_derive_metadata` constructs `FuelPriceCatalogMetadata` (record count, dataset version, filters, last sync timestamp).
6. **Response model** – `FuelPriceCatalogResponse` (Pydantic) encapsulates `success`, `metadata`, and `stations` (`GasStationEnriched`). Validation errors raise `FuelPriceCatalogError` with `SchemaValidationError` type.

## 3. FastAPI endpoint
- Path: `GET /api/v0/calljaa/fuel-prices` (`backend/src/api/v0/calljaa/fuel_prices.py`).
- Delegates directly to `get_fuel_price_catalog`.
- Logs request parameters and success/failure via `core.logging.get_logger`.
- Maps domain errors to HTTP status codes:
  - `ConfigurationError` → 503 Service Unavailable.
  - `DatabaseError` / `SchemaValidationError` → 502 Bad Gateway.
  - `UnexpectedError` → 500 Internal Server Error.
- Unhandled exceptions fall back to a 500 with structured detail payload.

## 4. Mobile consumption
1. **Typed client** – `apps/mobile/src/features/fuel-prices/api.ts` builds the REST URL from `getApiBaseUrl()` and returns `FuelPriceCatalogResponse` types.
2. **React Query hook** – `useFuelPrices` (`apps/mobile/src/features/fuel-prices/hooks.ts`):
   - Query key: `['fuel-price-catalog']`.
   - `onSuccess` hydrates `useFuelPriceStore` with stations + metadata.
   - `onError` clears the store to avoid stale data.
   - `staleTime` defaults to 5 minutes.
3. **State store** – `apps/mobile/src/features/fuel-prices/store.ts` exposes selectors (`stations`, `metadata`) and mutators (`setCatalog`, `clear`).
4. **Screen integration** – `apps/mobile/src/app/(tabs)/fuel-prices.tsx` renders loading, error, empty, and populated states. Pull-to-refresh calls `refetch` and leverages `FuelPriceList`.
5. **Presentation** – `FuelPriceList` component formats prices, shows metadata header, and memoises list rows for scrolling performance.

## 5. Testing and verification
- **Backend**
  - `backend/src/tests/services/test_fuel_price_catalog_service.py` covers sorting, filter propagation, schema validation, and error handling for the service layer.
  - `backend/src/tests/api/test_fuel_prices_endpoint.py` verifies happy path and error response mappings.
- **Mobile**
  - `apps/mobile/__tests__/fuel-prices-screen.test.tsx` checks rendering across success, empty, and error states and ensures pull-to-refresh triggers `refetch`.

## 6. Extension hooks
- Pagination/filtering: endpoint already accepts `parish`, `company`, `limit` but service ignores absent values; future work can forward them to the client and UI.
- Caching: endpoint contains TODO for caching layer integration (Redis/Memory). React Query stale time can be tuned per environment.
- Observability: task 005 tracks additional logging context (correlation IDs); instrumentation should wrap both service and endpoint layers.

## 7. References
- Backend source: `backend/src/services/calljaa/catalog.py`, `backend/src/api/v0/calljaa/fuel_prices.py`.
- Models: `backend/src/models/calljaa/catalog.py`.
- Mobile features: `apps/mobile/src/features/fuel-prices/*`.
- Tasks: `.codex/tasks/todo/00_displaying_fuel_price_data/003_mobile_data_fetch_state.md`, `.codex/tasks/todo/00_displaying_fuel_price_data/005_quality_guardrails.md`.
