---
created: 2025-09-30T22:08:39Z
last_updated: 2025-09-30T22:08:39Z
version: 1.0
author: Claude Code PM System
---

# Project Style Guide

## General Practices
- Prefer descriptive filenames and keep directories focused (e.g., stageXX_* modules for enrichment pipeline steps).
- Document complex flows with module docstrings or top-of-file summaries; avoid redundant inline comments for obvious steps.
- Store generated data under backend/data/ with date-based folders; never overwrite prior runs unless explicitly archiving.
- Keep environment access centralized in core/config.py; do not sprinkle os.getenv calls across modules.

## Python (backend/)
- Use type hints and Pydantic models for all external interfaces.
- Enforce ruff defaults: line length 100, double quotes, ignore F401 in __init__.py only when exporting public APIs.
- Structure services with small composable functions; orchestrators should remain thin coordinators.
- Log meaningful context using core.logging.get_logger; include extra data dictionaries for downstream log processing.
- Tests should mock external services (Firecrawl, serper) and assert both happy-path and failure outputs.

## JavaScript / TypeScript (freshh_Gas/)
- Use functional components with hooks; avoid class components.
- Read shared values via Expo Router conventions (router.push, useSegments) and keep navigation options inside layout files.
- Manage global client state with Zustand stores; persist secrets (JWTs) through Expo SecureStore in setter functions.
- Style React Native views with StyleSheet objects or inline style dictionaries; ensure support for dark and light modes using useColorScheme.
- Keep TypeScript strict; leverage path alias @/* defined in tsconfig for imports.

## React Query Usage
- Instantiate QueryClient once at the app root; configure staleTime, cacheTime, and retry policy centrally.
- Wrap network calls in reusable hooks for clarity and to centralize error handling once API wiring is in place.

## Git and Documentation
- Follow semantic commit prefixes (feat, fix, chore, refactor) observed in recent history.
- Update .codex/progress context after significant backend or mobile changes; include next steps and outstanding risks.
- Capture new runbooks or pipelines under .codex/tasks/ or backend/scripts/ with clear CLI usage examples.
