# System Patterns

## Data Ingestion Loop
- Tip Submission form writes structured reports directly to the shared database.
- Firecrawl scraper periodically extracts offender records from the Crime Stop source.
- Both streams normalize on offender identity, location, conviction, and timestamps.

## Distribution Loop
- Backend services expose APIs for tips, offenders, feed updates, and map markers.
- Frontend pages subscribe/poll so new data appears without manual refresh.
- Map, list, and feed pull from the same dataset to maintain consistent context.

## Intelligence Layer
- Proximity calculations rank offenders and tips by distance to the viewer.
- AI predictions generate yellow markers to forecast possible crime spots.
- “New” badges and recency metadata flag fresh items across surfaces.

## Feedback Loop
- Users submit more detail or corrections through the tip flow.
- Emergency contact interactions provide downstream accountability.
