# Firecrawl-Powered Missing Persons Scraper – Product Requirements

## 1. Problem & Goal
- **Problem**: The crime awareness web app lacks up-to-date missing person data from the Jamaica Constabulary Force (JCF) site; manual updates are slow and error-prone.
- **Goal**: Automatically retrieve structured missing person records (first name, last name, alias, crimes, image URL, wanted police station location) from `https://jcf.gov.jm/missing-person-3/missing-person-2/` and expose them through a reliable backend API for downstream use.

## 2. Product Context
- **Primary Consumers**: Crime awareness web frontend, internal analytics, potential third-party safety apps.
- **Personas**:
  - **Content Manager**: Needs trustworthy and current missing-person details.
  - **Frontend Engineer**: Requires stable, well-documented endpoints for UI rendering.
  - **Public User**: Indirect beneficiary; expects accurate, recent data.
- **Value Proposition**: Reduces manual data entry, ensures timely updates, improves public safety awareness.

## 3. Success Metrics
- **Accuracy**: ≥ 95% of records match the current JCF listing (spot checks per sprint).
- **Freshness**: Data refresh at least once every 24 hours; manual trigger available.
- **Reliability**: Extraction job failure rate < 5% per month with alerting in place.
- **Latency**: API response within 400 ms (p95) for cached data retrieval.

## 4. Key Use Cases
1. Schedule a periodic scrape to update the missing persons dataset.
2. Manually trigger a scrape for urgent updates.
3. Retrieve the latest dataset via REST endpoint.
4. Audit historical records to track changes over time (optional stretch).

## 5. Scope
- **In Scope**
  - Integrate Firecrawl extract API using provided SDK and schema.
  - Normalize and validate extracted records.
  - Persist data to backend storage (JSON file or database depending on MVP decision).
  - Expose REST endpoint(s) to fetch data.
  - Basic authentication/authorization strategy (API key or token) if public exposure is expected.
  - Logging, error handling, and retry for scraping pipeline.
- **Out of Scope (MVP)**
  - Complex diffing or change history UI.
  - Editing records manually through the backend.
  - Non-JCF data sources.

## 6. Functional Requirements
1. **Scraper Service**
   - Use Firecrawl `extract` with schema ensuring `first_name`, `last_name`, `alias`, `charges` (crimes), `image_url`, `police_station`.
   - Handle pagination or multiple sections on the target page.
   - Support on-demand invocation via CLI/endpoint.
2. **Data Processing**
   - Normalize strings (trim, proper casing).
   - Validate required fields; flag incomplete entries.
   - Deduplicate by unique combination (`first_name`, `last_name`, `alias`).
3. **Storage**
   - Persist latest snapshot; optionally keep historical snapshots with timestamp.
   - Provide quick read access to frontend.
4. **API**
   - `GET /missing-persons`: returns collection with filtering by station and alias.
   - `POST /scrape`: protected endpoint to trigger manual scrape (optional for MVP).
5. **Observability & Ops**
   - Structured logs for each scrape run.
   - Metrics: run duration, record count, failure reason.
   - Alerting hook (log-based or simple email/slack integration) for successive failures.

## 7. Non-Functional Requirements
- Python backend built with current project standards (likely FastAPI).
- Code style passes repo linters and unit tests.
- Configurations (Firecrawl API key, scrape schedule) stored via environment variables or secrets manager.
- Scrape job resilient to network errors; implement retries with backoff.
- Respect robots.txt and site usage policies; throttle requests accordingly.

## 8. Data Model (Draft)
```
MissingPerson:
  id: UUID
  first_name: str
  last_name: str
  alias: Optional[str]
  crimes: List[str]
  image_url: HttpUrl
  police_station: str
  source_url: HttpUrl
  scraped_at: datetime
```
- Additional metadata: `raw_record` blob for debugging, `checksum` for change detection (optional).

## 9. External Dependencies
- **Firecrawl SDK**: Requires API key `fc-...`; usage billed per request.
- **Scheduler**: APScheduler or Celery/Beat, depending on backend stack.
- **Storage**: Start with SQLite/PostgreSQL or JSON file; align with project infrastructure.

## 10. Risks & Mitigations
- **HTML Structure Changes**: Mitigate with schema validation, alerting, and fallback manual review.
- **Rate Limiting / Access Denied**: Implement polite scraping cadence (max once per hour).
- **Data Quality Issues**: Include validation and QA scripts; allow manual overrides.
- **API Key Leakage**: Keep secrets in `.env` or secret manager; do not hardcode.

## 11. Open Questions
- Preferred persistence layer (database vs. flat file) for MVP?
- Authentication requirements for manual scrape endpoint?
- Should we store historical snapshots or only the latest state?
- Expected deployment schedule and hosting environment?

## 12. Milestones
1. **Discovery (1-2 days)**: Confirm schema, legal compliance, storage choice.
2. **MVP Implementation (4-6 days)**: Build scraper, storage integration, GET endpoint.
3. **Hardening (2 days)**: Add manual trigger, observability, error handling.
4. **Testing & Launch (1 day)**: End-to-end verification, documentation, deployment readiness.

