---
created: 2025-09-30T22:08:39Z
last_updated: 2025-09-30T22:08:39Z
version: 1.0
author: Claude Code PM System
---

# Project Structure

## Repository Root
- README.md documents backend and Expo workflows plus environment variables.
- .codex/ holds context commands, PRDs, and in-progress task briefs for the new documentation workflow.
- backend/ contains the FastAPI service, data artifacts, and tests.
- freshh_Gas/ contains the Expo monorepo with mobile, web, shared components, and scripts.
- .env provides Firecrawl and Serper API keys (not committed).

## Backend Directory (backend/)
- src/api/v0/ – FastAPI routers for health, calljaa extraction, and enrichment.
- src/services/calljaa/ – Extraction logic, enrichment pipeline stages (stage01 through stage05), data upload helpers, and voice call agent placeholder.
- src/models/ – Pydantic models for fuel types, gas stations, extraction responses, and API wrappers.
- src/core/ – Config loader and logging utilities.
- src/tests/ – Pytest suites covering utilities, services, and API endpoints with sample data under src/tests/data/.
- data/ – Extracted and enriched JSON datasets organized by date (e.g., extracted_data/09_19_25/, enriched_data/...).
- pyproject.toml and uv.lock manage Python dependencies via uv.

## Expo Monorepo (freshh_Gas/)
- apps/mobile/ – Expo Router v6 app with source files in src/app/, Zustand auth utilities in src/utils/auth/, and mobile-specific package.json.
- apps/web/ – Web packaging with Bun lockfile and web-specific scaffolding.
- components/, constants/, hooks/ – Shared UI primitives and helpers reused across surfaces.
- assets/ – Images and fonts bundled with the app.
- scripts/reset-project.js – Utility for clearing Expo state.
- app.json, tsconfig.json, eslint.config.js – Platform, TypeScript, and lint configuration for the Expo workspace.

## Supporting Infrastructure
- .github/ for CI configuration (added but contents not yet inspected in this session).
- logs/ for backend logging output.
- .history/ records editor history from prior work.
- kanpilot.toml and COMMANDS.md capture agent orchestration metadata from previous automation setups.

## Data and Documentation
- .codex/prds/ contains product requirement documents (e.g., data_enrichment.md) that explain enrichment goals and architecture.
- .codex/tasks/in-progress/ lists breakdowns for current efforts like the full September 2025 data enrichment run.
- backend/data/test_enrichment/ (untracked) and related directories capture experiment outputs pending version control decisions.
