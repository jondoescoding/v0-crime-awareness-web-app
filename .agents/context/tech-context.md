# Tech Context

## Core Stack
- Frontend: TypeScript + React deployed on Vercel.
- Backend: Python services leveraging Firecrawl for data scraping.
- Realtime/Sync: Convex (or similar) to propagate updates with minimal latency.
- Hosting & Ops: Railway for backend workloads.

## Integrations
- Firecrawl scrapes the Crime Stop page to seed offender data.
- Shared database stores tips, offenders, locations, and AI prediction metadata.

## Operational Considerations
- Maintain API keys and scrape schedules to keep the criminal list current.
- Ensure data pipelines preserve validation and normalization for map and feed usage.
- Optimize for quick responses so pages update automatically without reloads.
