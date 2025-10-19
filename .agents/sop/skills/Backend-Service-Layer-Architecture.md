# Backend-Service-Layer-Architecture

## Purpose
Structure backend services with proper separation of concerns, following service layer architecture principles.

## What This Teaches

- Service layer pattern (collector, generator, sender)
- Dependency injection via settings
- Logging best practices with structured context
- Error propagation vs error handling
- Type hints and return type documentation
- File organization and naming conventions

## Directory Structure

```
backend/src/
├── api/                    # FastAPI routes and endpoints
│   ├── __init__.py        # App factory, router registration
│   ├── reports.py         # Report generation endpoints
│   └── wanted_persons.py  # Wanted persons endpoints
│
├── core/                   # Shared utilities and configuration
│   ├── __init__.py        # Core module exports
│   ├── env.py             # Environment variable helpers
│   ├── logging.py         # Logging configuration
│   └── settings.py        # Application settings
│
├── models/                 # Pydantic data models
│   ├── __init__.py        # Model exports
│   └── wanted_person.py   # Domain models
│
└── services/               # Business logic layer
    ├── __init__.py        # Service exports
    ├── activity_collector.py   # Data collection service
    ├── report_generator.py     # Report generation service
    ├── email_sender.py         # Email delivery service
    └── wanted_persons_scraper.py  # Web scraping service
```

## Service Layer Principles

### 1. Single Responsibility

Each service has ONE clear purpose:

```python
# ✅ GOOD - Single responsibility
# activity_collector.py
def collect_24h_activity() -> Dict[str, Any]:
    """Collect crime data from past 24 hours."""
    pass

# report_generator.py
def generate_report(activity_data: Dict[str, Any]) -> str:
    """Generate markdown report from activity data."""
    pass

# email_sender.py
def send_report_email(report_markdown: str) -> None:
    """Send report via email to recipients."""
    pass
```

```python
# ❌ BAD - Multiple responsibilities
def generate_and_send_report() -> None:
    """Collect data, generate report, and send email."""
    data = collect_data()
    report = generate(data)
    send_email(report)
```

### 2. Dependency Injection

Services receive dependencies, don't create them:

```python
# ✅ GOOD - Dependencies injected
def generate_report(activity_data: Dict[str, Any]) -> str:
    settings = get_settings()  # Injected via function
    
    if not settings.openrouter_api_key:
        raise ValueError("OPENROUTER_API_KEY is not configured")
    
    lm = dspy.LM(
        model="openrouter/google/gemini-2.0-flash-001",
        api_key=settings.openrouter_api_key,
        api_base="https://openrouter.ai/api/v1"
    )
    # ... rest of implementation
```

```python
# ❌ BAD - Hard-coded dependencies
def generate_report(activity_data: Dict[str, Any]) -> str:
    api_key = "sk-or-hardcoded"  # No flexibility!
    lm = dspy.LM(model="...", api_key=api_key)
```

### 3. Type Hints Everywhere

```python
from typing import Any, Dict, List

def collect_24h_activity() -> Dict[str, Any]:
    """Collect crime reports, tips, and criminals from past 24 hours."""
    # Clear return type
    return {
        "incidents": incidents,
        "criminals": criminals,
        "tips": tips,
        "collected_at": datetime.now().isoformat(),
    }

def _fetch_crime_reports(client: ConvexClient, cutoff_ms: int) -> List[Dict[str, Any]]:
    """Fetch crime reports created after cutoff timestamp."""
    # Clear parameter types and return type
    pass
```

### 4. Logging Best Practices

```python
from core.logging import get_logger

LOGGER = get_logger(__name__)  # Module-level logger

def collect_24h_activity() -> Dict[str, Any]:
    """Collect crime data from past 24 hours."""
    settings = get_settings()
    
    # Log start with context
    LOGGER.info(f"Collecting activity since {datetime.fromtimestamp(cutoff_ms / 1000).isoformat()}")
    
    try:
        incidents = _fetch_crime_reports(client, cutoff_ms)
        
        # Log progress
        LOGGER.info(f"Collected {len(incidents)} incidents")
        
        # Log completion with summary
        LOGGER.info(f"Collected {len(incidents)} incidents, {len(criminals)} criminals, {len(tips)} tips")
        
        return result
    except Exception as e:
        # Log errors with context
        LOGGER.error(f"Failed to collect activity data: {e}")
        raise
```

## Error Handling Strategy

### 1. Fail Fast at Service Boundary

```python
def generate_report(activity_data: Dict[str, Any]) -> str:
    """Generate report - fail fast if misconfigured."""
    settings = get_settings()
    
    # Validate immediately
    if not settings.openrouter_api_key:
        raise ValueError("OPENROUTER_API_KEY is not configured")
    
    # Proceed with generation
    # ...
```

### 2. Let Errors Propagate

```python
# Services raise errors, API layer catches them
def collect_24h_activity() -> Dict[str, Any]:
    """Collect activity - let errors propagate."""
    try:
        incidents = _fetch_crime_reports(client, cutoff_ms)
        return {"incidents": incidents}
    except Exception as e:
        LOGGER.error(f"Failed to collect: {e}")
        raise  # Let API layer handle HTTP response
```

### 3. Handle Errors at API Layer

```python
@router.post("/daily", status_code=202)
async def generate_daily_report() -> dict[str, str]:
    """API layer handles errors and returns HTTP responses."""
    try:
        activity_data = collect_24h_activity()
        report = generate_report(activity_data)
        send_report_email(report)
        return {"status": "success"}
    except ValueError as e:
        # Configuration errors
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        # Unexpected errors
        raise HTTPException(status_code=500, detail="Failed to generate report")
```

## Module Exports

### Service Module

```python
# services/__init__.py
"""Service layer exports."""

from services.activity_collector import collect_24h_activity
from services.email_sender import send_report_email
from services.report_generator import generate_report

__all__ = [
    "collect_24h_activity",
    "generate_report",
    "send_report_email",
]
```

### API Module

```python
# api/__init__.py
"""API layer exports."""

from fastapi import FastAPI
from api.reports import router as reports_router
from api.wanted_persons import router as wanted_persons_router

def create_app() -> FastAPI:
    app = FastAPI()
    app.include_router(reports_router)
    app.include_router(wanted_persons_router)
    return app

app = create_app()
```

## Naming Conventions

### Files and Functions
- **Files**: `snake_case.py`
- **Functions**: `snake_case()`
- **Classes**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`

```python
# Good examples
activity_collector.py
def collect_24h_activity() -> dict:
class ActivityCondenser(dspy.Signature):
TOAST_REMOVE_DELAY = 1000000
```

### Function Naming Patterns

```python
# Collection: collect_*
def collect_24h_activity():
    """Collect data from multiple sources."""

# Fetching: fetch_*, _fetch_*
def _fetch_crime_reports(client, cutoff_ms):
    """Fetch specific data from one source."""

# Generation: generate_*
def generate_report(data):
    """Generate output from input."""

# Sending: send_*
def send_report_email(report):
    """Send data somewhere."""

# Conversion: *_to_*
def _markdown_to_html(markdown):
    """Convert from one format to another."""

# Validation: validate_*
def validate_settings():
    """Check if something is valid."""
```

## Service Communication Pattern

```python
# API Layer (orchestration)
@router.post("/reports/daily")
async def generate_daily_report():
    # Step 1: Collect
    activity_data = collect_24h_activity()
    
    # Step 2: Process
    report_markdown = generate_report(activity_data)
    
    # Step 3: Deliver
    send_report_email(report_markdown)
    
    return {"status": "success"}

# Service Layer (implementation)
def collect_24h_activity() -> Dict[str, Any]:
    # Implementation details
    pass

def generate_report(activity_data: Dict[str, Any]) -> str:
    # Implementation details
    pass

def send_report_email(report_markdown: str) -> None:
    # Implementation details
    pass
```

## Private vs Public Functions

```python
# Public API (exported, used by other modules)
def collect_24h_activity() -> Dict[str, Any]:
    """Public function - part of service contract."""
    client = _create_client()
    return _fetch_all_data(client)

# Private helpers (internal use only)
def _create_client() -> ConvexClient:
    """Private helper - internal implementation detail."""
    settings = get_settings()
    return ConvexClient(settings.convex_deployment_url)

def _fetch_all_data(client: ConvexClient) -> Dict[str, Any]:
    """Private helper - internal implementation detail."""
    pass
```

**Convention**: Functions starting with `_` are private/internal.

## Documentation Standards

### Module Docstring
```python
"""Crime intelligence report generation service.

This module provides DSPy-powered report generation using OpenRouter
for LLM access. Reports are generated from 24-hour activity windows.
"""
```

### Function Docstring
```python
def generate_report(activity_data: Dict[str, Any]) -> str:
    """Generate structured crime intelligence report using DSPy.
    
    Args:
        activity_data: Dictionary containing incidents, criminals, and tips
        
    Returns:
        Markdown-formatted crime intelligence report
        
    Raises:
        ValueError: If OPENROUTER_API_KEY is not configured
    """
```

## Testing Organization

```python
# tests/test_activity_collector.py
def test_collect_24h_activity():
    """Test data collection over 24-hour window."""
    pass

def test_fetch_crime_reports():
    """Test crime report fetching with time filter."""
    pass

# tests/test_report_generator.py
def test_generate_report():
    """Test report generation with mock data."""
    pass

def test_generate_report_missing_api_key():
    """Test error handling when API key is missing."""
    pass
```

## Complete Examples

- `backend/src/services/activity_collector.py` - Data collection service
- `backend/src/services/report_generator.py` - Report generation service  
- `backend/src/services/email_sender.py` - Email delivery service
- `backend/src/api/reports.py` - API endpoint orchestration

## References

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Service Layer Pattern](https://martinfowler.com/eaaCatalog/serviceLayer.html)
- [Python Type Hints](https://docs.python.org/3/library/typing.html)

