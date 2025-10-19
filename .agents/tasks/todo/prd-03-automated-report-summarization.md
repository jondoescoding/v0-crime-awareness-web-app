# PRD-03: Automated Report Summarization with AI

## Overview
Law enforcement officers receive dozens of crime reports daily but lack time to read lengthy descriptions. This feature will automatically generate concise, actionable summaries of crime reports using GPT-4, highlighting critical information like severity, suspect descriptions, and required response actions. The system will process reports on submission and display summaries in the feed and database views, reducing report triage time by 60%.

## Context
Currently, all crime reports display full user-submitted descriptions ranging from 50-500 words. Officers must read entire descriptions to determine priority and extract key facts. This creates bottlenecks during high-volume periods. By generating AI summaries (2-3 sentences) with severity scores and extracted entities (weapons, drugs, vehicles), we enable rapid scanning and prioritization. This aligns with the product vision of "real-time crime awareness" by making information immediately actionable.

## Requirements

### Functional Requirements
1. **Automatic Summarization on Report Creation**
   - When a user submits a crime report, the system immediately calls OpenAI GPT-4 API to generate a summary.
   - Summary must be 2-3 sentences, extracting: incident type, location specifics, suspect details, and urgency indicators.
   - If API call fails, system falls back to showing first 100 characters of description with "..." indicator.
   - Processing happens asynchronously so user submission is not blocked.

2. **Severity Classification**
   - AI assigns severity score: LOW (property damage, minor theft), MEDIUM (burglary, assault without weapons), HIGH (armed robbery, violent assault), CRITICAL (active shooter, kidnapping, murder).
   - Severity displayed as color-coded badge alongside summary in feed and detail views.
   - Severity influences sort order in activity feed (CRITICAL reports appear first).

3. **Key Entity Extraction**
   - System extracts structured entities from description: suspect count, weapon types, vehicle descriptions, drug involvement, victim count.
   - Entities displayed as tags below summary for quick filtering.
   - Extracted entities stored in separate database fields for advanced search.

4. **Summary Display in Multiple Views**
   - Feed page: Show summary instead of truncated description.
   - Report detail dialog: Show both AI summary at top and full description below.
   - Database criminal page: Show summaries of associated reports.
   - Admin dashboard: Summary-only view for rapid triage.

5. **Regeneration on Demand**
   - Admin users can click "Regenerate Summary" button if initial summary is poor quality.
   - System logs regeneration attempts for quality monitoring.

### Technical Requirements

#### Backend / Services

**New Service: `backend/src/services/report_summarizer.py`**
- `summarize_report(description: str, offense_type: str, additional_context: dict) -> ReportSummary`
  - Calls OpenAI GPT-4 API with structured prompt
  - Returns: summary text, severity level, extracted entities
  - Timeout: 10 seconds max
  - Implements exponential backoff retry (3 attempts)
  - Caches results to avoid redundant API calls

**New Model: `backend/src/models/report_summary.py`**
```python
class ReportSummary(BaseModel):
    summary_text: str
    severity_level: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    extracted_entities: ExtractedEntities
    confidence_score: float
    processing_time_ms: int
    model_version: str

class ExtractedEntities(BaseModel):
    suspect_count: Optional[int]
    weapon_types: List[str]
    vehicle_descriptions: List[str]
    drug_involvement: bool
    victim_count: Optional[int]
```

**API Endpoint Changes**
- No new endpoints required
- Existing `/wanted-persons/scrape` endpoint remains unchanged
- Report creation mutation in Convex handles summarization

**Performance Targets**
- Summary generation: 95th percentile < 3 seconds
- API failure rate: < 2%
- Summary quality score (human review): > 85% accuracy

#### Frontend / Client

**Convex Mutation Update: `convex/crimeReports.ts`**
```typescript
export const create = mutation({
  handler: async (ctx, args) => {
    // Existing validation...
    
    // Call OpenAI API for summarization
    const summaryResult = await summarizeReport({
      description: args.description,
      offenseType: args.offenseType,
      contextFlags: {
        drugsInvolved: args.drugsInvolved,
        weaponsInvolved: args.weaponsInvolved,
        abuseInvolved: args.abuseInvolved
      }
    });
    
    // Store report with summary fields
    await ctx.db.insert("crimeReports", {
      ...args,
      aiSummary: summaryResult.summary_text,
      severityLevel: summaryResult.severity_level,
      extractedEntities: summaryResult.extracted_entities,
      createdAt: Date.now(),
      status: "active"
    });
  }
});
```

**UI Component: `frontend/components/report-summary.tsx`**
```typescript
interface ReportSummaryProps {
  summary: string;
  severityLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  extractedEntities: ExtractedEntities;
  fullDescription?: string;
  showToggle?: boolean;
}

export function ReportSummary({ 
  summary, 
  severityLevel, 
  extractedEntities, 
  fullDescription,
  showToggle = false 
}: ReportSummaryProps) {
  const [showFull, setShowFull] = useState(false);
  
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <SeverityBadge level={severityLevel} />
        <p className="text-sm font-medium">{summary}</p>
      </div>
      
      {extractedEntities && (
        <EntityTags entities={extractedEntities} />
      )}
      
      {showToggle && fullDescription && (
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setShowFull(!showFull)}
        >
          {showFull ? "Show Summary" : "Show Full Description"}
        </Button>
      )}
      
      {showFull && <p className="text-xs text-muted-foreground">{fullDescription}</p>}
    </div>
  );
}
```

**Feed Page Updates: `frontend/app/feed/page.tsx`**
- Replace line 211 (`{report.description.substring(0, 150)}`) with:
  ```tsx
  {report.aiSummary || report.description.substring(0, 150)}
  ```
- Add severity-based sorting before map render
- Display extracted entity tags below summary

**State Management**
- No global state changes required
- Summary data flows through existing Convex queries
- Optimistic updates handled by Convex automatically

#### Data / Infrastructure

**Schema Migration: `convex/schema.ts`**
```typescript
crimeReports: defineTable({
  // ... existing fields ...
  aiSummary: v.optional(v.string()),
  severityLevel: v.optional(v.union(
    v.literal("LOW"),
    v.literal("MEDIUM"),
    v.literal("HIGH"),
    v.literal("CRITICAL")
  )),
  extractedEntities: v.optional(v.object({
    suspectCount: v.optional(v.number()),
    weaponTypes: v.array(v.string()),
    vehicleDescriptions: v.array(v.string()),
    drugInvolvement: v.boolean(),
    victimCount: v.optional(v.number())
  })),
  summaryGeneratedAt: v.optional(v.number()),
  summaryModelVersion: v.optional(v.string()),
  createdAt: v.number(),
})
.index("by_severity", ["severityLevel", "createdAt"])
```

**Migration Script: `convex/migrations.ts`**
```typescript
// Backfill existing reports with AI summaries
export const backfillSummaries = internalMutation({
  handler: async (ctx) => {
    const reports = await ctx.db.query("crimeReports")
      .filter(q => q.eq(q.field("aiSummary"), undefined))
      .take(100);
    
    for (const report of reports) {
      const summary = await generateSummary(report.description, report.offenseType);
      await ctx.db.patch(report._id, {
        aiSummary: summary.summary_text,
        severityLevel: summary.severity_level,
        extractedEntities: summary.extracted_entities
      });
    }
  }
});
```

**Environment Variables**
```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=300
OPENAI_TEMPERATURE=0.3
```

### Implementation Details

**OpenAI Prompt Engineering**
```python
SUMMARIZATION_PROMPT = """
You are analyzing a crime report for law enforcement. Generate a concise 2-3 sentence summary that includes:
1. The primary incident type and severity
2. Key suspect/victim details if mentioned
3. Critical urgency indicators (weapons, injuries, ongoing threat)

Additionally, extract structured data:
- Severity: LOW/MEDIUM/HIGH/CRITICAL
- Suspect count (number)
- Weapon types (list)
- Vehicle descriptions (list)
- Drug involvement (boolean)
- Victim count (number)

Crime Report:
Offense Type: {offense_type}
Description: {description}
Flags: Weapons={weapons_involved}, Drugs={drugs_involved}, Abuse={abuse_involved}

Respond in JSON format:
{{
  "summary": "...",
  "severity": "...",
  "entities": {{...}}
}}
"""
```

**Error Handling Strategy**
1. OpenAI API timeout: Fallback to rule-based summary (first sentence + offense type)
2. Invalid JSON response: Retry with simpler prompt
3. Rate limit hit: Queue request for async processing
4. Cost threshold exceeded: Switch to cheaper GPT-3.5-turbo model

**Caching Strategy**
- Cache summaries by hash of (description + offense_type) for 30 days
- Reduces API costs for duplicate/similar reports
- Implement in Redis or Convex storage

### UX / UI Guidance

**Visual Hierarchy**
- Severity badge: 16px height, positioned left of summary text
- Summary text: 14px font, medium weight, 1.5 line height
- Entity tags: 12px font, muted secondary badges below summary
- Full description toggle: Ghost button, 12px font, right-aligned

**Color System**
- LOW: Green (#22c55e)
- MEDIUM: Yellow (#f59e0b)
- HIGH: Orange (#f97316)
- CRITICAL: Red (#dc2626)

**Accessibility**
- Severity levels announced by screen readers
- Entity tags have aria-labels describing content
- Toggle button uses aria-expanded state

**Loading States**
- Show skeleton placeholder during summary generation
- Display "Generating summary..." with spinner
- Fallback to description preview if generation exceeds 5 seconds

## File Structure
```
backend/src/
├── services/
│   ├── report_summarizer.py          # New: OpenAI integration
│   └── __init__.py                    # Export summarize_report
├── models/
│   ├── report_summary.py              # New: Pydantic models
│   └── __init__.py                    # Export ReportSummary
└── tests/
    └── test_report_summarizer.py      # New: Unit tests

frontend/
├── components/
│   ├── report-summary.tsx             # New: Summary display component
│   ├── severity-badge.tsx             # New: Color-coded badge
│   └── entity-tags.tsx                # New: Extracted entity display
├── app/feed/page.tsx                  # Modified: Use summaries
└── convex/
    ├── schema.ts                      # Modified: Add summary fields
    ├── crimeReports.ts                # Modified: Call summarization
    └── migrations.ts                  # New: Backfill script

.env.local
├── OPENAI_API_KEY                     # New: API key
└── OPENAI_MODEL                       # New: Model config
```

## Dependencies

**Backend**
- `openai==1.12.0` - Official OpenAI Python SDK
- `tiktoken==0.6.0` - Token counting for cost estimation
- `redis==5.0.1` (optional) - Response caching

**Frontend**
- No new packages required (uses existing Convex + UI libraries)

**Infrastructure**
- OpenAI API account with GPT-4 access
- Budget: ~$0.03 per summary (estimated 500 tokens @ $0.06/1K)
- Expected monthly cost: 1000 reports × $0.03 = $30/month

## Success Criteria

1. **Performance**: 95% of summaries generated within 3 seconds
2. **Quality**: 85% of summaries rated "accurate" by human reviewers in blind test
3. **Adoption**: 80% of officers use summary view instead of full descriptions within 2 weeks
4. **Accuracy**: Severity classification matches manual review 90% of the time
5. **Cost**: Monthly OpenAI API costs stay below $50 for 1000 reports

**Monitoring Metrics**
- Average summary generation time
- API failure rate
- Summary regeneration frequency
- User engagement with "Show Full Description" toggle
- Cost per summary

## Open Questions

1. **Model Selection**: Should we start with GPT-4 or GPT-3.5-turbo for cost optimization?
   - Owner: Backend team
   - Due: Before implementation starts
   - Recommendation: Start with GPT-4, A/B test against GPT-3.5

2. **Backfill Strategy**: Should we backfill summaries for existing 500+ reports or only apply to new reports?
   - Owner: Product team
   - Due: Week 1 of implementation
   - Recommendation: Backfill high-priority reports (last 30 days, status=active)

3. **Human Review Process**: How do we collect quality feedback from officers?
   - Owner: UX team
   - Due: Before launch
   - Recommendation: Add thumbs up/down on summaries, route to Slack for review

4. **Language Support**: Should summaries support Spanish or Patois for Jamaica context?
   - Owner: Product team
   - Due: Week 2 of implementation
   - Recommendation: English only for v1, add language detection in v2

## Notes

**Implementation Tips**
- Start with simple prompt, iterate based on real report samples
- Log all OpenAI requests/responses for quality review
- Implement circuit breaker pattern to prevent cascade failures
- Use OpenAI's function calling for structured entity extraction

**Rollout Considerations**
- Phase 1 (Week 1-2): Backend service + API integration + testing
- Phase 2 (Week 3): Frontend components + feed integration
- Phase 3 (Week 4): Backfill existing reports + monitoring dashboard
- Phase 4 (Week 5): Launch to officers with training documentation

**Follow-up Tasks**
- Create admin dashboard showing summary quality metrics
- Build prompt refinement workflow for iterating on summary quality
- Add support for multi-language summaries (Spanish, Patois)
- Implement officer feedback loop to improve accuracy over time


