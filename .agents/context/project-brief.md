---
created: 2025-09-30T22:08:39Z
last_updated: 2025-09-30T22:08:39Z
version: 1.0
author: Claude Code PM System
---

# Freshh Gas Project Brief

## Purpose
- Deliver a unified system that monitors Jamaican fuel prices, enriches them with trustworthy business metadata, and presents the results through a consumer-grade mobile experience.
- Reduce the time Jamaican drivers and fleet operators spend searching for affordable fuel by consolidating market data in one reliable application.

## Scope
- Maintain an Expo-based mobile application that surfaces cheapest-station insights, discovery filters, and future subscription workflows.
- Operate a FastAPI backend that scrapes calljaa.com, cleans the data, and enriches stations through the serper.dev Maps API.
- Store curated datasets in versioned directories under backend/data/ for analytics, QA, and audit trails.

## Primary Goals
- Keep extraction and enrichment jobs reliable enough for daily updates of nationwide station data.
- Provide mobile users with accurate station pricing, location, and amenity details that can be cross-verified against external sources.
- Establish automation scripts and documentation so batch enrichment runs (e.g., September 2025 dataset) become repeatable and auditable.

## Success Criteria
- Backend API endpoints return complete station data (including enrichment fields) within service-level thresholds and are covered by automated tests.
- The mobile app remains performant on mid-range Android and iOS devices while presenting the current "cheapest fuel" story with intuitive interactions.
- Operational runbooks exist for executing enrichment batches, troubleshooting failures, and updating credentials without downtime.

## Out of Scope
- Real-time price negotiation or payments — current focus is data aggregation and presentation.
- Building desktop clients — web usage is limited to the Expo web target for parity testing.
- Integrations with third-party loyalty programs until pricing data is consistently accurate.
