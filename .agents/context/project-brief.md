# Informa App Project Brief

## Mission
- Equip communities with a real-time window into crime activity and emergency resources.
- Blend user-submitted tips with scraped offender data to create a unified source of truth.
- Maintain a seamless experience where new information appears without manual refreshes.

## Feature Outline
### Page 1 · Tip Submission
- Guided form based on the existing Crime Stop pattern.
- Two paths: select a known offender or report a new incident (e.g., drugs, trafficking).
- Enforce validation across all required inputs and support an offline camera flow.
- Store all submissions in the shared database for reuse across experiences.

### Page 2 · Criminal List
- Scrape offender data from a single Crime Stop source into the database.
- Capture name, aliases, conviction details, and last known whereabouts.
- Display as cards or list; users can sort by proximity and jump to map context.
- Surface new entries automatically with a `New` indicator—no refresh button.

### Page 3 · Activity Feed
- Stream tips collected from Page 1 into an Instagram-style feed.
- Present updates instantly so users see emerging crimes in near real time.

### Page 4 · Activity Map
- Plot tip locations within a ~30 km radius, prioritizing nearby offenders.
- Use red markers for confirmed reports and yellow markers for AI-driven predictions.
- Show recent crime timelines to highlight recency.

### Page 5 · Emergency Contacts
- Provide a curated list of emergency service information for rapid follow-up.

## Delivery Expectations
- Keep all pages synchronized through the shared data store.
- Maintain a responsive, low-latency experience across devices.
