# PRD-{{ID}}: {{Feature Name}}

## Overview
Summarize the user problem and the expected outcome in 2–3 sentences.

## Context
Capture the business context, target platforms, dependencies, and any relevant background research.

## Requirements

### Functional Requirements
1. **{{Capability 1}}**
   - Detail the user interactions and edge cases.
   - Note refresh intervals, permission handling, or cross-platform nuances.
2. **{{Capability 2}}**
   - Continue enumerating primary behaviors in priority order.

### Technical Requirements
Break down expectations per surface. Include file paths, architectural patterns, and integration constraints.

#### Backend / Services
- Describe new services, modules, or endpoints (e.g., `backend/src/services/{{feature}}.py`).
- Specify performance targets, data access constraints, and external service usage.

#### Frontend / Client
- Identify global state needs, hooks/stores, and caching strategies.
- List UI states, accessibility needs, and analytics events.

#### Data / Infrastructure
- Document schema impacts, migrations, queue or cron jobs, and monitoring changes.

### Implementation Details
Highlight algorithms, pseudo code, or component breakdowns that would help accelerate implementation.

```python
# Include illustrative snippets to clarify tricky portions.
```

### UX / UI Guidance
- Note visual hierarchy, color usage, motion, and copy guidelines.
- Link to Figma frames or design specs if available.

## File Structure
```
Describe the directories, new files, and tests that should be created or updated.
```

## Dependencies
- List new packages (server/client) and any build or runtime tooling changes.

## Success Criteria
1. Define measurable performance or quality targets.
2. Capture user acceptance tests or monitoring alerts that confirm behavior.

## Open Questions
- Track decisions awaiting clarification and assign an owner/date.

## Notes
- Include implementation tips, rollout considerations, or follow-up tasks.
