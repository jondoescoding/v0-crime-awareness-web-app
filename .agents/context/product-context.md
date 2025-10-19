---
created: 2025-09-30T22:08:39Z
last_updated: 2025-09-30T22:08:39Z
version: 1.0
author: Claude Code PM System
---

# Product Context

## Target Users
- Everyday drivers in Jamaica who want the cheapest fuel options without visiting multiple stations.
- Fleet operators and delivery services that need bulk pricing visibility to manage operating costs.
- Future premium subscribers seeking alerts and historical insights once enrichment data is production-ready.

## User Problems
- Fuel prices vary significantly across districts; users rely on scattered information sources (calljaa.com, word of mouth).
- Current web experience is not optimized for mobile or filtering by price thresholds, amenities, or geography.
- Lack of trustworthy metadata (hours, contact, ratings) makes trip planning inefficient.

## Core Experiences
- **Discovery**: Browse island-wide stations with filtering by price, brand, parish, and fuel type, surfacing the cheapest options first.
- **Verification**: Present enrichment data (coordinates, phone, hours, images) so users can validate station details before traveling.
- **Alerts**: Planned subscription flow for push or in-app notifications when preferred stations change prices or add amenities.
- **Batch Reporting**: Backend scripts produce enriched JSON datasets and run metadata for analytics teams to review trends.

## Data Sources
- Primary extraction from calljaa.com via Firecrawl to capture current listings and prices.
- Enrichment from serper.dev Maps API to append standardized addresses, geocoordinates, ratings, images, and operating hours.
- Potential voice-based data collection is sketched in backend/services/calljaa/voice_call_agent.py for future amenity verification.

## Quality and Compliance Considerations
- Must respect serper.dev rate limits (0.5s delay baseline) and handle retries on HTTP 429/503 gracefully.
- Station records require deduplication and validation to avoid surfacing repeated or outdated entries.
- Data pipelines should log run metadata (start/end time, error counts) to support audits and manual QA.

## Open Questions
- How will the mobile app consume enriched datasets (direct API call vs. periodic bundling)?
    - Periodic bundling
- What thresholds define “cheapest fuel” for highlighting or notification triggers?
    - Based on the aggregated data of ALL of the current gas station prices and the current user's location
- Will the app support offline caching or downloads for low-connectivity users?
    - offline cachine
- How often should full enrichment runs execute (daily, weekly) given API cost constraints?
    - Weekly
