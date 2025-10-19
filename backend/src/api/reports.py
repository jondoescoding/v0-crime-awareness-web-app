"""Crime intelligence report generation endpoints."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from core.logging import get_logger
from services.activity_collector import collect_24h_activity
from services.email_sender import send_report_email
from services.report_generator import generate_report

LOGGER = get_logger(__name__)

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/daily", status_code=202)
async def generate_daily_report() -> dict[str, str]:
    """
    Generate and email 24-hour crime intelligence report.
    
    **Endpoint:** `POST /reports/daily`
    
    **Request Body:** None required
    
    **Response (202 Accepted):**
    ```json
    {
        "status": "success",
        "message": "Report generated and sent successfully"
    }
    ```
    
    **Description:**
    Triggers a background job that:
    1. Collects all crime activity from the last 24 hours
    2. Generates an AI-powered intelligence report in markdown format
    3. Sends the report via email to configured recipients
    
    **Errors:**
    - `500 Internal Server Error`: Missing environment configuration (RESEND_API_KEY, recipient email) or report generation failure
    
    **Environment Variables Required:**
    - `RESEND_API_KEY`: API key for email service
    - `REPORT_RECIPIENT_EMAIL`: Email address to receive reports
    """
    try:
        LOGGER.info("Starting daily report generation")
        
        activity_data = collect_24h_activity()
        
        report_markdown = generate_report(activity_data)
        
        send_report_email(report_markdown)
        
        return {
            "status": "success",
            "message": "Report generated and sent successfully"
        }
    except ValueError as e:
        LOGGER.error(f"Configuration error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        LOGGER.error(f"Failed to generate report: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate report")

