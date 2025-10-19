# Convex-Python-Data-Collection

## Purpose
Show how to query Convex database from Python backend for time-windowed data aggregation.

## What This Teaches

- Installing and configuring ConvexClient in Python
- Time-based filtering (24-hour window with millisecond timestamps)
- Cross-table data fetching (reports → criminals by ID)
- Deduplication and normalization patterns
- Environment variable management for database URLs

## Key Dependencies

```toml
convex>=0.5.0
```

## Environment Variables

```bash
CONVEX_DEPLOYMENT_URL=https://your-deployment.convex.cloud
```

## Core Implementation Pattern

### 1. Install and Configure ConvexClient

```python
from convex import ConvexClient
from datetime import datetime, timedelta
from typing import Any, Dict, List

from core.logging import get_logger
from core.settings import get_settings

LOGGER = get_logger(__name__)

settings = get_settings()

if not settings.convex_deployment_url:
    raise ValueError("CONVEX_DEPLOYMENT_URL is not configured")

client = ConvexClient(settings.convex_deployment_url)
```

### 2. Calculate Time Window (24 Hours)

**IMPORTANT**: Convex stores timestamps in milliseconds, not seconds.

```python
# Get current time in milliseconds
now_ms = int(datetime.now().timestamp() * 1000)

# Calculate 24 hours ago in milliseconds
cutoff_ms = now_ms - (24 * 60 * 60 * 1000)

LOGGER.info(f"Collecting activity since {datetime.fromtimestamp(cutoff_ms / 1000).isoformat()}")
```

### 3. Query and Filter Crime Reports

```python
def _fetch_crime_reports(client: ConvexClient, cutoff_ms: int) -> List[Dict[str, Any]]:
    """Fetch crime reports created after cutoff timestamp."""
    try:
        # Query all reports (Convex doesn't support time filtering in query)
        reports = client.query("crimeReports:list", {})
        
        # Filter client-side by createdAt
        filtered = [r for r in reports if r.get("createdAt", 0) >= cutoff_ms]
        
        return filtered
    except Exception as e:
        LOGGER.error(f"Failed to fetch crime reports: {e}")
        return []
```

### 4. Cross-Table Data Fetching

```python
def _fetch_criminals(client: ConvexClient, criminal_ids: List[str]) -> List[Dict[str, Any]]:
    """Fetch criminal details by IDs."""
    criminals = []
    
    for cid in criminal_ids:
        try:
            # Query individual criminal by ID
            criminal = client.query("criminals:get", {"id": cid})
            if criminal:
                criminals.append(criminal)
        except Exception as e:
            LOGGER.warning(f"Failed to fetch criminal {cid}: {e}")
    
    return criminals
```

### 5. Complete Collection Pipeline

```python
def collect_24h_activity() -> Dict[str, Any]:
    """Collect crime reports, tips, and criminals from past 24 hours."""
    settings = get_settings()
    
    if not settings.convex_deployment_url:
        raise ValueError("CONVEX_DEPLOYMENT_URL is not configured")
    
    client = ConvexClient(settings.convex_deployment_url)
    
    # Calculate time window
    now_ms = int(datetime.now().timestamp() * 1000)
    cutoff_ms = now_ms - (24 * 60 * 60 * 1000)
    
    LOGGER.info(f"Collecting activity since {datetime.fromtimestamp(cutoff_ms / 1000).isoformat()}")
    
    try:
        # Step 1: Fetch incidents
        incidents = _fetch_crime_reports(client, cutoff_ms)
        
        # Step 2: Extract criminal IDs and fetch details
        criminal_ids = {inc.get("criminalId") for inc in incidents if inc.get("criminalId")}
        criminals = _fetch_criminals(client, list(criminal_ids)) if criminal_ids else []
        
        # Step 3: Fetch tips
        tips = _fetch_tips(client, cutoff_ms)
        
        LOGGER.info(f"Collected {len(incidents)} incidents, {len(criminals)} criminals, {len(tips)} tips")
        
        return {
            "incidents": incidents,
            "criminals": criminals,
            "tips": tips,
            "collected_at": datetime.now().isoformat(),
        }
    except Exception as e:
        LOGGER.error(f"Failed to collect activity data: {e}")
        raise
```

### 6. Tips Collection (Same Pattern)

```python
def _fetch_tips(client: ConvexClient, cutoff_ms: int) -> List[Dict[str, Any]]:
    """Fetch tips created after cutoff timestamp."""
    try:
        tips = client.query("tips:list", {})
        filtered = [t for t in tips if t.get("createdAt", 0) >= cutoff_ms]
        return filtered
    except Exception as e:
        LOGGER.error(f"Failed to fetch tips: {e}")
        return []
```

## Convex Schema Reference

From `frontend/convex/schema.ts`:

```typescript
crimeReports: defineTable({
    reportType: v.union(v.literal("existing_criminal"), v.literal("new_crime")),
    criminalId: v.optional(v.id("criminals")),
    description: v.string(),
    offenseType: v.string(),
    parish: v.optional(v.string()),
    cityState: v.string(),
    status: v.string(),
    createdAt: v.number(),  // Milliseconds timestamp
    // ... other fields
})
```

## Common Pitfalls

### 1. Timestamp Conversion
```python
# ❌ WRONG - Using seconds
cutoff_ms = now_ms - (24 * 60 * 60)  # Only 24 seconds!

# ✅ CORRECT - Using milliseconds
cutoff_ms = now_ms - (24 * 60 * 60 * 1000)
```

### 2. Missing Null Checks
```python
# ❌ WRONG - Assumes createdAt exists
filtered = [r for r in reports if r["createdAt"] >= cutoff_ms]  # KeyError!

# ✅ CORRECT - Use .get() with default
filtered = [r for r in reports if r.get("createdAt", 0) >= cutoff_ms]
```

### 3. Not Handling Empty Sets
```python
# ❌ WRONG - Queries with empty set
criminal_ids = {inc.get("criminalId") for inc in incidents}
criminals = _fetch_criminals(client, list(criminal_ids))  # Fails if empty

# ✅ CORRECT - Check before querying
criminal_ids = {inc.get("criminalId") for inc in incidents if inc.get("criminalId")}
criminals = _fetch_criminals(client, list(criminal_ids)) if criminal_ids else []
```

## Data Normalization Pattern

```python
def normalize_incident(raw_incident: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize incident data for report generation."""
    return {
        "id": raw_incident.get("_id"),
        "type": raw_incident.get("offenseType", "Unknown"),
        "description": raw_incident.get("description", ""),
        "location": {
            "parish": raw_incident.get("parish"),
            "city": raw_incident.get("cityState"),
            "coordinates": {
                "lat": raw_incident.get("locationLat"),
                "lng": raw_incident.get("locationLng"),
            }
        },
        "timestamp": raw_incident.get("createdAt"),
        "status": raw_incident.get("status", "active"),
    }
```

## Testing Strategy

1. **Test without deployment URL** - Should raise ValueError
2. **Test with empty database** - Should return empty lists
3. **Test time filtering** - Verify 24-hour window works
4. **Test cross-references** - Verify criminal fetching works
5. **Test error handling** - Handle network failures gracefully

## Performance Considerations

- **Client-side filtering**: Convex Python client doesn't support time-range queries, so we fetch all and filter
- **Batch criminal fetches**: Consider batching if you have many criminal IDs
- **Caching**: Consider caching deployment URL and client instance

## Complete Example

See: `backend/src/services/activity_collector.py`

## References

- [Convex Python SDK](https://docs.convex.dev/client/python)
- [Convex Schema Documentation](https://docs.convex.dev/database/schemas)

