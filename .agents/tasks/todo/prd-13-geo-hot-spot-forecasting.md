---
name: Geo Hot-Spot Forecasting
status: backlog
created: October 19 2025 11:44 AM EST
updated: October 19 2025 11:44 AM EST
Total tasks: 0
Completed: "0 (0%)"
In progress: "0 (None)"
Pending: 0
tasks:
  prd: ".agents/tasks/todo/prd-13-geo-hot-spot-forecasting.md"
  tasks_to_be_done: []
---
# PRD-13: Geo Hot-Spot Forecasting

## Introduction / Overview
Moderators have latitude/longitude fields in Convex crime reports, but they are often empty and the platform lacks a way to surface emerging crime clusters. Geo Hot-Spot Forecasting fills in reliable coordinates, aggregates reports into H3 grids, detects anomalies, and visualizes a Risk Meter overlay on the analyst map so teams can focus on areas with unusual spikes.

## Goals
- Capture usable coordinates for ≥70% of new reports through automated geocoding.
- Detect significant parish-level spikes within 24 hours using rolling anomaly scores.
- Provide analysts with an interactive map overlay that clearly communicates current risk levels and contributing incident details.

## Dependencies
**external dependencies**:
- Geocoding provider (Mapbox, Google Maps, or approved alternative) with API quotas.
- `h3` or `h3-py` for spatial indexing, plus any time-series smoothing library (e.g., Prophet-lite or SciPy).

**internal dependencies**:
- Convex `crimeReports` collection storing `locationLat` and `locationLng`.
- Analyst dashboard map components and data fetch utilities.
- Backend job scheduler framework (APScheduer or existing cron runner).

**prerequisite work**:
- Select and provision the geocoding provider with billing guardrails.
- Confirm backend access to Convex data for aggregation jobs.

## User Stories
- As an analyst, I want high-confidence coordinates added automatically so I can trust map visualizations.
- As a crime intelligence officer, I want the dashboard to show which parishes are experiencing unusual spikes so I can allocate patrols.
- As an operations lead, I want alerts when a parish crosses a risk threshold so the team can respond quickly.

## Functional Requirements
1. **Coordinate Capture Pipeline**
   - When a report includes address, city, parish, or directions, send the combined text to the backend geocoding endpoint before final persistence.
   - Populate `locationLat`, `locationLng`, accuracy metadata, and `geocodeStatus` in Convex; gracefully handle failures with stored error reason.
   - Provide a tipster-facing notice about approximate location usage and an option to opt out of geocoding.

2. **H3 Aggregation & Forecasting**
   - Nightly and on-demand jobs aggregate crime reports into H3 resolution 7 cells, computing counts for rolling 7-day and 30-day windows.
   - Calculate anomaly scores per cell (e.g., z-score against baseline) and roll them up to parish/city summaries.
   - Persist snapshots in a new `riskSnapshots` collection with timestamps, score, top contributing report IDs, and supporting metrics.

3. **Risk Meter Visualization**
   - Analyst dashboard displays a Risk Meter card summarizing each parish with color-coded levels (green/amber/red) and timestamp of last refresh.
   - Clicking a parish zooms the map, overlays semi-transparent H3 hexes colored by anomaly score, and lists top contributing reports with quick links.
   - Provide a legend and accessibility-compliant color contrast; allow analysts to toggle between 7-day and 30-day views.

4. **Alerting & Audit Trail**
   - When a parish risk score crosses configurable thresholds, send email/push notifications to subscribed analysts and create a changelog entry in Convex.
   - Allow analysts to acknowledge alerts and record follow-up actions.
   - Maintain retention policy for risk snapshots (e.g., 6 months) with automated cleanup.

## Non-Goals (Out of Scope)
- Predictive modeling beyond anomaly detection (e.g., long-term forecasting).
- Public-facing display of risk levels; scope is analyst dashboards only.
- Integration with external dispatch systems in this iteration.

## Design Considerations
- Map overlays should be optional layers with smooth transitions to avoid overwhelming the base map.
- Provide tooltips for each H3 cell showing score, count, and recent incidents.
- Ensure alerts use concise, actionable language with direct links back into the dashboard.

## Technical Considerations
- Implement FastAPI endpoints: `POST /geocode` for address lookup (with caching) and `POST /hotspots/run` to trigger manual jobs.
- Scheduler (`backend/src/jobs/hotspot_scheduler.py`) runs nightly, respecting rate limits of geocoding provider and Convex read quotas.
- Use bulk reads from Convex via streaming or pagination to process large report sets efficiently.
- Store risk snapshots with versioning so algorithm changes can coexist with legacy data.

## Success Metrics
1. ≥70% of new reports gain lat/lng data within 5 seconds of submission.
2. Hot-spot job finishes within 5 minutes for a dataset of 10k reports (p95).
3. ≥80% of historical surge events (backtest) trigger alerts with <10% false positives in low-activity parishes.

## Accomplishments
_None yet — feature not started._

## Open Questions
- Which anomaly scoring approach (z-score, STL decomposition, Prophet) balances accuracy and maintainability? _(Owner: Data Science, due Oct 30 2025)_
- What alert channels (email, SMS, in-app) are mandatory at launch? _(Owner: Product Ops, due Oct 27 2025)_

## Notes
- Coordinate the release with the guided assistant since better descriptions improve geocoding accuracy.
- Implement monitoring dashboards for geocoding success rate and job runtime before launch.
