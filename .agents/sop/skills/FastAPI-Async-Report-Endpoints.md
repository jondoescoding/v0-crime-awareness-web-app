# FastAPI-Async-Report-Endpoints

## Purpose
Build FastAPI endpoints that orchestrate async data collection, LLM processing, and email delivery with proper error handling.

## What This Teaches

- Async endpoint patterns with proper error handling
- CORS configuration for cross-origin requests
- Service layer orchestration (collector → generator → sender)
- Environment-based configuration validation
- Proper HTTP status codes (202 for accepted async operations)
- Router registration and API organization

## Key Dependencies

```toml
fastapi>=0.112.0
uvicorn[standard]>=0.30.0
```

## Core Implementation Pattern

### 1. Create API Router

```python
from fastapi import APIRouter, HTTPException
from core.logging import get_logger

LOGGER = get_logger(__name__)

router = APIRouter(prefix="/reports", tags=["reports"])
```

### 2. Async Endpoint with Orchestration

```python
@router.post("/daily", status_code=202)
async def generate_daily_report() -> dict[str, str]:
    """Generate and email 24-hour crime intelligence report."""
    try:
        LOGGER.info("Starting daily report generation")
        
        # Step 1: Collect data
        activity_data = collect_24h_activity()
        
        # Step 2: Generate report
        report_markdown = generate_report(activity_data)
        
        # Step 3: Send email
        send_report_email(report_markdown)
        
        return {
            "status": "success",
            "message": "Report generated and sent successfully"
        }
    except ValueError as e:
        # Configuration errors (missing env vars)
        LOGGER.error(f"Configuration error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        # Unexpected errors
        LOGGER.error(f"Failed to generate report: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate report")
```

### 3. Register Router in Main App

```python
# In api/__init__.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.wanted_persons import router as wanted_persons_router
from api.reports import router as reports_router

def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    app = FastAPI(title="Wanted Persons API", version="0.1.0")
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Configure for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Register routers
    app.include_router(wanted_persons_router)
    app.include_router(reports_router)
    
    return app

app = create_app()
```

## Service Layer Pattern

### Directory Structure
```
backend/src/
├── api/
│   ├── __init__.py          # App factory, router registration
│   ├── reports.py           # Report endpoints
│   └── wanted_persons.py    # Other endpoints
├── services/
│   ├── activity_collector.py  # Data collection logic
│   ├── report_generator.py    # Report generation logic
│   └── email_sender.py         # Email sending logic
└── core/
    ├── settings.py          # Configuration
    └── logging.py           # Logging setup
```

### Service Imports
```python
from services.activity_collector import collect_24h_activity
from services.email_sender import send_report_email
from services.report_generator import generate_report
```

## Error Handling Strategy

### 1. Configuration Errors (ValueError)
```python
try:
    activity_data = collect_24h_activity()
except ValueError as e:
    # Missing CONVEX_DEPLOYMENT_URL, OPENROUTER_API_KEY, etc.
    LOGGER.error(f"Configuration error: {e}")
    raise HTTPException(status_code=500, detail=str(e))
```

### 2. Service Errors (Exception)
```python
try:
    send_report_email(report_markdown)
except Exception as e:
    # Network errors, Resend API errors, etc.
    LOGGER.error(f"Failed to send emails: {e}")
    raise HTTPException(status_code=500, detail="Failed to generate report")
```

## HTTP Status Codes

### 202 Accepted (Success)
```python
@router.post("/daily", status_code=202)
async def generate_daily_report() -> dict[str, str]:
    # ... processing ...
    return {"status": "success", "message": "Report generated and sent successfully"}
```

**Why 202?** Report generation is async and takes time (data collection → LLM generation → email). The request is accepted but processing happens in background.

### 500 Internal Server Error (Failure)
```python
raise HTTPException(status_code=500, detail="CONVEX_DEPLOYMENT_URL is not configured")
```

**Why 500?** Configuration errors are server-side issues that prevent processing.

## CORS Configuration

### Development (Permissive)
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # All origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Production (Restrictive)
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://yourapp.com",
        "https://www.yourapp.com"
    ],
    allow_credentials=True,
    allow_methods=["POST"],
    allow_headers=["Content-Type", "Authorization"],
)
```

## Logging Best Practices

```python
from core.logging import get_logger

LOGGER = get_logger(__name__)

@router.post("/daily", status_code=202)
async def generate_daily_report() -> dict[str, str]:
    # Log start
    LOGGER.info("Starting daily report generation")
    
    try:
        # Log each step
        activity_data = collect_24h_activity()
        LOGGER.info(f"Collected {len(activity_data.get('incidents', []))} incidents")
        
        report_markdown = generate_report(activity_data)
        LOGGER.info(f"Generated report: {len(report_markdown)} characters")
        
        send_report_email(report_markdown)
        LOGGER.info("Report sent successfully")
        
        return {"status": "success", "message": "Report generated and sent successfully"}
    
    except ValueError as e:
        # Log configuration errors
        LOGGER.error(f"Configuration error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
    except Exception as e:
        # Log unexpected errors with full context
        LOGGER.error(f"Failed to generate report: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate report")
```

## Testing the Endpoint

### Using curl
```bash
# Success case
curl -X POST http://localhost:8000/reports/daily \
  -H "Content-Type: application/json" \
  -v

# Expected response:
# HTTP/1.1 202 Accepted
# {"status":"success","message":"Report generated and sent successfully"}

# Error case (missing config)
# HTTP/1.1 500 Internal Server Error
# {"detail":"CONVEX_DEPLOYMENT_URL is not configured"}
```

### Using Python requests
```python
import requests

response = requests.post("http://localhost:8000/reports/daily")

if response.status_code == 202:
    print("Success:", response.json())
else:
    print("Error:", response.json())
```

## Common Pitfalls

### 1. Blocking Operations in Async
```python
# ❌ WRONG - Blocking sync operations
@router.post("/daily")
async def generate_daily_report():
    time.sleep(30)  # Blocks event loop!
    
# ✅ CORRECT - Use async/await
@router.post("/daily")
async def generate_daily_report():
    await asyncio.sleep(30)
```

**Note**: In this PR, service functions are sync (not `async def`). FastAPI handles this by running them in a thread pool automatically.

### 2. Not Logging Errors
```python
# ❌ WRONG - Silent failures
try:
    send_report_email(report)
except Exception:
    pass  # No visibility!

# ✅ CORRECT - Log everything
try:
    send_report_email(report)
except Exception as e:
    LOGGER.error(f"Failed to send email: {e}", exc_info=True)
    raise
```

### 3. Wrong Status Codes
```python
# ❌ WRONG - 200 implies immediate completion
@router.post("/daily", status_code=200)

# ✅ CORRECT - 202 for accepted/processing
@router.post("/daily", status_code=202)
```

## OpenAPI Documentation

FastAPI automatically generates OpenAPI docs at `/docs`:

```python
@router.post("/daily", status_code=202)
async def generate_daily_report() -> dict[str, str]:
    """
    Generate and email 24-hour crime intelligence report.
    
    - Collects crime reports, criminals, and tips from past 24 hours
    - Uses DSPy with OpenRouter to generate structured analysis
    - Emails report to configured recipients via Resend
    
    Returns:
        202: Report generation accepted and processing
        500: Configuration error or processing failure
    """
```

## Complete Example

See: `backend/src/api/reports.py`

## References

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [CORS Middleware](https://fastapi.tiangolo.com/tutorial/cors/)
- [HTTPException](https://fastapi.tiangolo.com/tutorial/handling-errors/)

