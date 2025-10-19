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
    """Generate and email 24-hour crime intelligence report."""
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

