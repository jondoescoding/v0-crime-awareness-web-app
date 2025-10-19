# Implementation Plan – Firecrawl Missing Persons Backend

## 1. Planning & Setup
- Audit existing backend stack (FastAPI/Fly io/etc.) and decide on service placement.
- Acquire Firecrawl API key via secret management and document injection method.
- Confirm legal/ethical guidelines for scraping the JCF site and any rate limits.
- Decide on storage layer (SQLite/Postgres/JSON) and provisioning steps.

## 2. Scraper Service
- Create Firecrawl client wrapper with configurable API key and retries.
- Define Pydantic models mirroring the extraction schema; add normalization helpers.
- Implement scrape workflow: call Firecrawl, validate response, transform to internal model.
- Add logging, error handling, and structured metrics for each run.
- Implement rate limiting/backoff to respect remote site.

## 3. Persistence Layer
- Implement repository pattern for chosen storage layer.
- Support upsert of missing person records based on `(first_name, last_name, alias)`.
- Store metadata such as `scraped_at`, `source_url`, and raw payload snapshot.
- Add migration/initialization script if using relational DB.

## 4. API Surface
- Create `GET /missing-persons` endpoint with optional filters (`station`, `alias`, `updated_since`).
- Return paginated responses compliant with frontend expectations.
- Add `POST /scrape` or CLI command for manual refresh (protected behind auth or feature flag).
- Document endpoints in OpenAPI and README.

## 5. Scheduling & Ops
- Integrate APScheduler/Celery cron job for daily scrape; parameterize cadence.
- Provide config for enabling/disabling scheduler per environment.
- Wire alerting path (temporary: logs + README instructions; future: email/slack integration).

## 6. Security & Configuration
- Load secrets via environment variables; update `.env.example`.
- Enforce API authentication (API key header or JWT) for mutating endpoints.
- Add validation to reject malformed URLs or unsupported content.

## 7. Documentation
- Update backend README with setup steps, environment variables, and run instructions.
- Add troubleshooting section for common scraping failures.
- Provide data dictionary describing each returned field.

## 8. Testing Strategy
- **Unit Tests**
  - Firecrawl client wrapper (retry logic, schema validation using mocked responses).
  - Data normalization utilities (name parsing, alias handling, deduplication).
  - Repository operations (insert, update, retrieve filtering).
- **Integration Tests**
  - End-to-end scrape flow using recorded Firecrawl fixture (VCR/cassettes).
  - API responses against seeded data verifying pagination and filters.
- **Contract Tests**
  - Validate JSON schema served by `GET /missing-persons`.
  - Ensure extraction schema aligns with Firecrawl expectations via mock contract test.
- **Observability Tests**
  - Verify logging fields on success/failure paths.
  - Simulate Firecrawl failure to confirm alerts/metrics are emitted.

## 9. Deployment Checklist
- Secrets configured in deployment environment.
- Scheduler enabled with safe cadence.
- Monitoring dashboards/log sinks verified.
- Rollback plan documented (disable scheduler, revert to last good dataset).

