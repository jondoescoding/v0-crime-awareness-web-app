# PRD-06: Natural Language Search for Crime Reports

## Overview
Users struggle to find relevant crime reports using basic dropdown filters. This feature enables conversational search queries like "show me armed robberies in Kingston last week" or "violent crimes near schools with weapons." The system uses GPT-4 to parse natural language into structured database queries, making crime data 10x more accessible to community members and law enforcement.

## Context
Currently, the feed and database pages offer limited filtering: parish dropdown, offense type selector, and text search on criminal names. Users cannot combine criteria or use temporal filters. This forces users to manually scan through hundreds of reports. Natural language search eliminates this friction by allowing users to express intent conversationally. The system translates queries into Convex database filters, enabling complex searches without UI complexity.

Target users include community advocates tracking specific crime patterns, journalists researching incidents, and officers investigating related cases.

## Requirements

### Functional Requirements

1. **Natural Language Query Processing**
   - User types query in search bar: "burglaries in Saint Andrew with vehicles"
   - System sends query to GPT-4 with schema context to extract filters
   - GPT-4 returns structured filter object: `{offenseTypes: ["Burglary"], parish: "Saint Andrew", vehicleInvolved: true}`
   - Results update in real-time as Convex query executes
   - Invalid queries show helpful suggestions: "Did you mean 'Kingston' instead of 'Kingstown'?"

2. **Supported Query Patterns**
   - **Location-based**: "crimes in Clarendon", "incidents near Kingston schools", "reports from downtown"
   - **Time-based**: "last week", "past 30 days", "since January 2025", "yesterday"
   - **Crime type**: "violent crimes", "drug offenses", "thefts and burglaries", "armed robbery"
   - **Characteristics**: "with weapons", "involving drugs", "gang-related", "school-related"
   - **Status**: "active cases", "resolved incidents", "under investigation"
   - **Severity**: "high priority", "critical incidents", "minor offenses"
   - **Combinations**: "armed robberies in Kingston last month with active status"

3. **Query History and Suggestions**
   - System stores last 10 user queries in local storage
   - Dropdown shows recent searches for quick re-execution
   - Popular queries displayed as suggested chips: "Recent violent crimes", "Drug incidents this week"
   - Officers can save frequent queries as bookmarks with custom names

4. **Query Refinement**
   - After displaying results, show applied filters as removable tags
   - User clicks tag to remove filter and re-search
   - "Refine search" button allows editing query without retyping
   - System suggests related queries: "Also try: 'armed robberies' or 'thefts in this area'"

5. **Fallback Handling**
   - If GPT-4 parsing fails, fall back to basic text search on description field
   - Show warning: "Showing text matches for '{query}'. Try being more specific."
   - If no results found, suggest broadening search: "No results found. Try removing '{filter}'"
   - Timeout after 5 seconds with partial results if available

### Technical Requirements

#### Backend / Services

**New Service: `backend/src/services/query_parser.py`**
```python
class QueryParser:
    def __init__(self, openai_client: OpenAI):
        self.client = openai_client
        
    def parse_natural_query(self, query: str) -> ParsedQuery:
        """
        Convert natural language to structured filters.
        
        Returns ParsedQuery with:
        - offense_types: List[str]
        - parishes: List[str] 
        - date_range: Optional[DateRange]
        - status: Optional[str]
        - flags: Dict[str, bool] (weapons, drugs, abuse)
        - severity: Optional[str]
        - confidence_score: float
        """
        
    def validate_entities(self, parsed: ParsedQuery) -> ParsedQuery:
        """Validate parishes exist, offense types are valid."""
        
    def suggest_corrections(self, invalid_entities: List[str]) -> List[str]:
        """Fuzzy match invalid values to valid schema values."""
```

**New Model: `backend/src/models/query_parser.py`**
```python
class ParsedQuery(BaseModel):
    offense_types: List[str] = []
    parishes: List[str] = []
    date_range: Optional[DateRange] = None
    status_filters: List[str] = []
    characteristic_flags: CharacteristicFlags
    severity_levels: List[str] = []
    text_search: Optional[str] = None
    confidence_score: float
    parsing_method: Literal["gpt4", "fallback", "cached"]

class DateRange(BaseModel):
    start_timestamp: int
    end_timestamp: int
    human_readable: str  # "last 7 days"

class CharacteristicFlags(BaseModel):
    weapons_involved: Optional[bool] = None
    drugs_involved: Optional[bool] = None
    abuse_involved: Optional[bool] = None
    school_related: Optional[bool] = None
    wanted_fugitive: Optional[bool] = None
```

**API Endpoint: `backend/src/api/search.py`**
```python
@router.post("/search/parse", response_model=ParsedQuery)
def parse_search_query(
    query: str = Body(..., min_length=3, max_length=500),
    api_key: str = Depends(verify_api_key)
) -> ParsedQuery:
    """
    Parse natural language search query into structured filters.
    
    Example:
    POST /search/parse
    {"query": "armed robberies in Kingston last week"}
    
    Returns:
    {
      "offense_types": ["Robbery", "Robbery with Aggravation"],
      "parishes": ["Kingston"],
      "date_range": {"start_timestamp": 1234567890, ...},
      "characteristic_flags": {"weapons_involved": true},
      "confidence_score": 0.92
    }
    """
```

**Performance Targets**
- Query parsing: 95th percentile < 2 seconds
- Cache hit rate: > 60% for common queries
- Parsing accuracy: > 90% correct filter extraction

#### Frontend / Client

**New Component: `frontend/components/natural-language-search.tsx`**
```typescript
export function NaturalLanguageSearch() {
  const [query, setQuery] = useState("");
  const [parsedFilters, setParsedFilters] = useState<ParsedQuery | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  const handleSearch = async (userQuery: string) => {
    setIsSearching(true);
    
    // Call backend to parse query
    const parsed = await parseQuery(userQuery);
    setParsedFilters(parsed);
    
    // Execute Convex query with parsed filters
    const results = await fetchReportsWithFilters(parsed);
    
    // Save to query history
    saveToHistory(userQuery, parsed);
    
    setIsSearching(false);
  };
  
  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          placeholder="Try: 'violent crimes in Kingston last month'"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
        />
        <Button 
          onClick={() => handleSearch(query)}
          disabled={isSearching}
        >
          {isSearching ? <Loader2 className="animate-spin" /> : <Search />}
        </Button>
      </div>
      
      {/* Query suggestions */}
      <QuerySuggestions onSelect={handleSearch} />
      
      {/* Applied filters as removable tags */}
      {parsedFilters && (
        <AppliedFilters 
          filters={parsedFilters} 
          onRemove={(key) => updateFilters(key)}
        />
      )}
      
      {/* Confidence indicator */}
      {parsedFilters && parsedFilters.confidence_score < 0.7 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            I might not have understood your query correctly. 
            Showing best guess results.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

**Convex Query Enhancement: `convex/crimeReports.ts`**
```typescript
export const searchNatural = query({
  args: {
    offenseTypes: v.optional(v.array(v.string())),
    parishes: v.optional(v.array(v.string())),
    dateRange: v.optional(v.object({
      startTimestamp: v.number(),
      endTimestamp: v.number()
    })),
    statusFilters: v.optional(v.array(v.string())),
    characteristicFlags: v.optional(v.object({
      weaponsInvolved: v.optional(v.boolean()),
      drugsInvolved: v.optional(v.boolean()),
      abuseInvolved: v.optional(v.boolean()),
      schoolRelated: v.optional(v.boolean())
    })),
    severityLevels: v.optional(v.array(v.string())),
    textSearch: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("crimeReports");
    
    // Apply filters based on parsed query
    if (args.dateRange) {
      query = query.filter(q => 
        q.and(
          q.gte(q.field("createdAt"), args.dateRange.startTimestamp),
          q.lte(q.field("createdAt"), args.dateRange.endTimestamp)
        )
      );
    }
    
    if (args.offenseTypes && args.offenseTypes.length > 0) {
      query = query.filter(q =>
        args.offenseTypes.some(type => 
          q.eq(q.field("offenseType"), type)
        )
      );
    }
    
    if (args.parishes && args.parishes.length > 0) {
      query = query.filter(q =>
        args.parishes.some(parish => 
          q.eq(q.field("parish"), parish)
        )
      );
    }
    
    if (args.characteristicFlags?.weaponsInvolved === true) {
      query = query.filter(q => q.eq(q.field("weaponsInvolved"), true));
    }
    
    // Apply remaining filters...
    
    return await query.collect();
  }
});
```

**Page Integration: `frontend/app/feed/page.tsx`**
- Replace existing filter UI with NaturalLanguageSearch component
- Keep advanced filter toggle for users who prefer structured inputs
- Show query parsing confidence score in dev mode for debugging

**State Management**
- Store parsed filters in URL query params for shareable links
- Cache parsed queries in localStorage (max 50 entries)
- Sync query history across tabs using localStorage events

#### Data / Infrastructure

**Query Cache Table: `convex/schema.ts`**
```typescript
queryCache: defineTable({
  queryText: v.string(),
  queryHash: v.string(),
  parsedFilters: v.object({
    offenseTypes: v.optional(v.array(v.string())),
    parishes: v.optional(v.array(v.string())),
    // ... all filter fields
  }),
  confidence: v.number(),
  hitCount: v.number(),
  lastUsed: v.number(),
  createdAt: v.number()
})
.index("by_hash", ["queryHash"])
.index("by_usage", ["hitCount", "lastUsed"])
```

**Query Analytics Table**
```typescript
queryAnalytics: defineTable({
  queryText: v.string(),
  userId: v.optional(v.string()),
  resultsCount: v.number(),
  parsingMethod: v.string(),
  parsingTimeMs: v.number(),
  executionTimeMs: v.number(),
  confidenceScore: v.number(),
  timestamp: v.number()
})
.index("by_timestamp", ["timestamp"])
```

**Environment Variables**
```env
OPENAI_API_KEY=sk-...
QUERY_CACHE_TTL_HOURS=24
QUERY_HISTORY_MAX_ENTRIES=50
```

### Implementation Details

**GPT-4 Prompt for Query Parsing**
```python
QUERY_PARSING_PROMPT = """
You are a search query parser for a crime awareness database in Jamaica.

Available offense types: {offense_types_list}
Available parishes: {parishes_list}
Available statuses: active, investigating, resolved

Parse this natural language query into structured filters:
Query: "{user_query}"

Extract:
1. Offense types (match to valid types, handle synonyms like "burglary" -> "Burglary")
2. Parishes (validate against list, suggest corrections for typos)
3. Date range (convert "last week", "past month" to timestamps)
4. Status filters
5. Characteristic flags (weapons, drugs, abuse, school, fugitive)
6. Severity levels (LOW, MEDIUM, HIGH, CRITICAL)
7. Free text for unstructured parts

Return JSON:
{{
  "offense_types": [...],
  "parishes": [...],
  "date_range": {{"start": timestamp, "end": timestamp, "description": "last 7 days"}},
  "status_filters": [...],
  "characteristic_flags": {{"weapons_involved": true, ...}},
  "severity_levels": [...],
  "text_search": "...",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation of parsing decisions"
}}
"""
```

**Fuzzy Matching for Entity Validation**
```python
from fuzzywuzzy import process

def validate_and_correct_parish(user_parish: str) -> Optional[str]:
    """Match user input to valid parish names."""
    valid_parishes = [
        "Clarendon", "Hanover", "Kingston", "Manchester", 
        "Portland", "Saint Andrew", "Saint Ann", ...
    ]
    
    match, score = process.extractOne(user_parish, valid_parishes)
    
    if score >= 85:  # High confidence match
        return match
    elif score >= 70:  # Medium confidence, suggest
        raise SuggestionError(f"Did you mean '{match}'?")
    else:
        return None  # No match, ignore this filter
```

**Caching Strategy**
1. Hash query text (lowercase, strip whitespace)
2. Check cache table for existing parse
3. If cache hit and < 24 hours old, return cached parse
4. If cache miss, call GPT-4 and store result
5. Increment hit_count on cache hits for popularity tracking

**Error Handling**
- GPT-4 timeout: Fall back to basic text search on description field
- Invalid JSON response: Retry with simplified prompt
- No results found: Suggest removing most restrictive filter
- Ambiguous query: Show multiple interpretation options

### UX / UI Guidance

**Visual Design**
- Search bar: Full-width, prominent placement at top of feed/database pages
- Placeholder text rotates through example queries every 3 seconds
- Microphone icon for future voice input support
- Confidence indicator: Green checkmark (>0.9), Yellow warning (0.7-0.9), Red alert (<0.7)

**Applied Filters Display**
```
[Kingston ×] [Armed Robbery ×] [Last 7 Days ×] [Weapons Involved ×]
                                              [Clear All]
```
- Removable tag chips with X button
- Color-coded by filter type: blue (location), red (offense), green (time)
- Clear all button removes all filters at once

**Query Suggestions**
- Show 3-5 suggested queries based on:
  - User's recent searches
  - Popular queries from all users
  - Related queries to current results
- Displayed as clickable chips below search bar

**Loading States**
- Parsing: "Understanding your query..." with animated dots
- Executing: "Searching {X} reports..." with progress bar
- Skeleton cards for results during loading

**Accessibility**
- Search input has aria-label="Natural language crime search"
- Applied filters announced by screen readers
- Keyboard shortcuts: Ctrl+K to focus search, Esc to clear

## File Structure
```
backend/src/
├── api/
│   └── search.py                      # New: Query parsing endpoint
├── services/
│   ├── query_parser.py                # New: GPT-4 query parsing
│   └── entity_validator.py           # New: Fuzzy matching validation
├── models/
│   └── query_parser.py                # New: ParsedQuery models
└── tests/
    ├── test_query_parser.py           # New: Parser unit tests
    └── test_entity_validator.py       # New: Validation tests

frontend/
├── components/
│   ├── natural-language-search.tsx    # New: Main search component
│   ├── query-suggestions.tsx          # New: Suggestion chips
│   ├── applied-filters.tsx            # New: Filter tags display
│   └── confidence-indicator.tsx       # New: Parse confidence UI
├── app/
│   ├── feed/page.tsx                  # Modified: Integrate NL search
│   └── database/page.tsx              # Modified: Integrate NL search
├── lib/
│   ├── query-parser-client.ts         # New: API client
│   └── query-history.ts               # New: LocalStorage manager
└── convex/
    ├── crimeReports.ts                # Modified: Add searchNatural query
    ├── schema.ts                      # Modified: Add cache tables
    └── queryAnalytics.ts              # New: Analytics mutations

.env.local
├── OPENAI_API_KEY                     # New
├── QUERY_CACHE_TTL_HOURS=24           # New
└── QUERY_HISTORY_MAX_ENTRIES=50       # New
```

## Dependencies

**Backend**
- `openai==1.12.0` - GPT-4 API client
- `fuzzywuzzy==0.18.0` - Entity fuzzy matching
- `python-Levenshtein==0.24.0` - Fast string distance (optional speedup)
- `dateparser==1.2.0` - Natural language date parsing

**Frontend**
- No new packages (uses existing Convex + UI components)

**Infrastructure**
- OpenAI API with GPT-4 access
- Estimated cost: $0.02 per query × 1000 queries/month = $20/month
- Query cache reduces costs by ~60% after warm-up period

## Success Criteria

1. **Adoption**: 60% of feed page users try natural language search within first session
2. **Accuracy**: 90% of queries parsed correctly (validated by user not refining search)
3. **Speed**: 95th percentile query-to-results time < 3 seconds
4. **Engagement**: Average queries per user increases from 2 to 8
5. **Cost**: Monthly OpenAI costs stay below $50 for 2000+ queries

**Monitoring Metrics**
- Query parsing accuracy (tracked via user refinements)
- Cache hit rate
- Average query complexity (number of filters extracted)
- Failed parse rate
- User query patterns (most common search intents)

**A/B Test Plan**
- Control: 50% of users see old filter UI
- Treatment: 50% see natural language search
- Measure: Queries per session, time to find report, user satisfaction
- Duration: 2 weeks
- Success threshold: 20% increase in queries per session

## Open Questions

1. **Privacy Concerns**: Should we anonymize query logs sent to OpenAI?
   - Owner: Security team
   - Due: Before implementation
   - Recommendation: Strip user IDs and IP addresses before logging

2. **Voice Input**: Should v1 include voice-to-text search?
   - Owner: Product team
   - Due: Week 1
   - Recommendation: No, add in v2 after text search proves valuable

3. **Multi-language Support**: Should we support Spanish/Patois queries?
   - Owner: Product team
   - Due: Week 2
   - Recommendation: GPT-4 handles this naturally, test with sample queries

4. **Search Scope**: Should search include criminal profiles in addition to reports?
   - Owner: Backend team
   - Due: Week 1
   - Recommendation: Yes, add criminal search in v1.1 after report search stabilizes

5. **Cost Control**: What's our monthly budget ceiling for OpenAI API?
   - Owner: Finance team
   - Due: Before launch
   - Recommendation: $100/month with alerts at 80% threshold

## Notes

**Implementation Tips**
- Start with query cache implementation to reduce API costs
- Log all queries and parsed results for continuous prompt improvement
- Build evaluation dataset of 100+ queries with expected parses for testing
- Use OpenAI's function calling feature for structured output

**Rollout Considerations**
- Phase 1 (Week 1-2): Backend parser service + API + validation logic
- Phase 2 (Week 3): Frontend component + feed integration
- Phase 3 (Week 4): Database page integration + query analytics
- Phase 4 (Week 5): A/B test launch with 20% of users
- Phase 5 (Week 6-7): Full rollout based on A/B results

**Follow-up Features**
- Saved searches with email/push notifications
- Voice input via Web Speech API
- Query recommendations based on user role (officer vs citizen)
- Multi-table search (reports + criminals + wanted persons)
- Export search results to CSV/PDF for investigations
- Advanced mode with SQL-like query syntax for power users

**Quality Improvement Loop**
1. Collect queries with low confidence scores
2. Manual review to identify parsing errors
3. Update prompt with error examples
4. Re-test with evaluation dataset
5. Deploy improved prompt
6. Repeat weekly for first 2 months

