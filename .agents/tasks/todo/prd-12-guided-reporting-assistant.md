---
name: Guided Reporting Assistant
status: backlog
created: October 19 2025 11:44 AM EST
updated: October 19 2025 11:44 AM EST
Total tasks: 0
Completed: "0 (0%)"
In progress: "0 (None)"
Pending: 0
tasks:
  prd: ".agents/tasks/todo/prd-12-guided-reporting-assistant.md"
  tasks_to_be_done: []
---
# PRD-12: Guided Reporting Assistant

## Introduction / Overview
Tipsters currently type free-form crime descriptions in the `ReportForm` without guidance, causing missing Who/What/When/Where/How details that moderators need for follow-up. The guided reporting assistant adds an optional chat-driven helper that coaches the public through the key questions, composes a polished narrative, and recommends structured field values so reports arrive complete the first time.

## Goals
- Increase completeness of crime reports by capturing 5W details in ≥80% of guided submissions.
- Reduce manual moderator edits by auto-suggesting offense type, parish, and additional info flags with confidence indicators.
- Maintain a calm, supportive experience for public tipsters while leaving manual entry untouched for those who prefer it.

## Dependencies
**external dependencies**:
- OpenRouter account configured for Gemini models.
- DSPy Python package (`dspy-ai>=2.5.0`) for chaining prompts per SOP.

**internal dependencies**:
- Convex mutations in `api.crimeReports.create`.
- Frontend components in `frontend/components/report-form.tsx`.
- Telemetry pipeline for logging assistant usage.

**prerequisite work**:
- Ensure OpenRouter and Gemini credentials are stored in backend settings management.
- Confirm privacy policy copy allows LLM-assisted tip submission (legal sign-off).

## User Stories
- As a public tipster, I want a friendly assistant to ask clarifying questions so I can give useful information even if I’m stressed.
- As a tipster, I want suggested offense types and checkboxes that match what I described so I don’t have to guess the right category.
- As a moderator, I want to know whether a report used the assistant so I can track quality improvements.

## Functional Requirements
1. **Assistant Drawer Activation**
   - Add a `Help me describe it` button beneath the description label that launches a right-side drawer (mobile: full-height sheet).
   - Drawer shows introductory copy explaining confidentiality and optional use; closing preserves the chat state locally.

2. **Sequential Questioning & Tone**
   - Assistant follows a Who → What → When → Where → How sequence, adapting follow-ups to previous answers with empathetic language suitable for the general public.
   - Each message is streamed to the UI with typing indicators; offline or timeout states show a retry CTA without clearing existing conversation.

3. **Summary & Apply Flow**
   - After the 5W checklist is satisfied, present a consolidated summary preview with edit capability.
   - Provide an `Apply to description` action that replaces or appends to the main textarea only after user confirmation.

4. **Structured Suggestions**
   - Assistant response payload returns offense type, parish/city, and additional info flags with confidence scores (High/Medium/Low).
   - Surfaced suggestions appear as banners or inline chips next to the respective form controls; accepting them auto-fills the existing `Select` and checkboxes.
   - Highlight any missing 5W elements in the main form with subtle warnings, without blocking submission.

5. **Usage Logging & Telemetry**
   - Store assistant transcript and suggestion metadata (e.g., `was_suggestion_applied`, `recommended_offense`, `confidence`) in Convex.
   - Emit analytics events (`assistant_opened`, `assistant_completed`, `assistant_suggestion_applied`) with timestamp and offensive type.

## Non-Goals (Out of Scope)
- Automated moderation or rejection of user-entered content.
- Multi-language conversation support beyond English at launch.
- Voice input or audio prompts.

## Design Considerations
- Use a soft accent color and calming copy; avoid law-enforcement jargon.
- Display progress chips (Who, What, When, Where, How) that light up as each element is captured.
- Ensure the drawer meets WCAG AA: keyboard accessible, focus trapped while open, `aria-live` announcements for new assistant messages.

## Technical Considerations
- Backend FastAPI endpoint `POST /assist/report` orchestrates DSPy + Gemini calls using `with dspy.context(lm=...)` per SOP.
- Responses should include both assistant text and a JSON payload for structured suggestions; ensure conversation history is sanitized before sending to the LLM.
- Add Convex functions (`api.assistant.logInteraction`) to store transcripts and metadata.
- Frontend should debounce network calls and handle streaming or chunked responses gracefully.

## Success Metrics
1. ≥70% of assistant sessions result in at least one structured suggestion being accepted.
2. Reports completed with the assistant contain all 5W fields in ≥80% of QA spot checks.
3. Assistant request latency < 6 seconds at the 95th percentile.

## Accomplishments
_None yet — feature not started._

## Open Questions
- Should moderators have read-only access to assistant transcripts for auditing? _(Owner: Legal, due Nov 1 2025)_
- Do we require opt-in consent copy specific to AI assistance on the form? _(Owner: Product, due Oct 25 2025)_

## Notes
- Rate-limit assistant sessions per IP to discourage abuse.
- Roll out behind a feature flag to compare completion metrics before full release.
