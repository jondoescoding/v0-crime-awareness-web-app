"""Collects 24-hour activity data from Convex database."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Dict, List

from convex import ConvexClient

from core.logging import get_logger
from core.settings import get_settings

LOGGER = get_logger(__name__)


def collect_24h_activity() -> Dict[str, Any]:
    """Collect crime reports, tips, and criminals from past 24 hours."""
    settings = get_settings()
    
    if not settings.convex_deployment_url:
        raise ValueError("CONVEX_DEPLOYMENT_URL is not configured")
    
    client = ConvexClient(settings.convex_deployment_url)
    
    now_ms = int(datetime.now().timestamp() * 1000)
    cutoff_ms = now_ms - (24 * 60 * 60 * 1000)
    
    LOGGER.info(f"Collecting activity since {datetime.fromtimestamp(cutoff_ms / 1000).isoformat()}")
    
    try:
        incidents = _fetch_crime_reports(client, cutoff_ms)
        criminal_ids = {inc.get("criminalId") for inc in incidents if inc.get("criminalId")}
        criminals = _fetch_criminals(client, list(criminal_ids)) if criminal_ids else []
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


def _fetch_crime_reports(client: ConvexClient, cutoff_ms: int) -> List[Dict[str, Any]]:
    """Fetch crime reports created after cutoff timestamp."""
    try:
        reports = client.query("crimeReports:list", {})
        filtered = [r for r in reports if r.get("createdAt", 0) >= cutoff_ms]
        return filtered
    except Exception as e:
        LOGGER.error(f"Failed to fetch crime reports: {e}")
        return []


def _fetch_criminals(client: ConvexClient, criminal_ids: List[str]) -> List[Dict[str, Any]]:
    """Fetch criminal details by IDs."""
    criminals = []
    for cid in criminal_ids:
        try:
            criminal = client.query("criminals:get", {"id": cid})
            if criminal:
                criminals.append(criminal)
        except Exception as e:
            LOGGER.warning(f"Failed to fetch criminal {cid}: {e}")
    return criminals


def _fetch_tips(client: ConvexClient, cutoff_ms: int) -> List[Dict[str, Any]]:
    """Fetch tips created after cutoff timestamp."""
    try:
        tips = client.query("tips:list", {})
        filtered = [t for t in tips if t.get("createdAt", 0) >= cutoff_ms]
        return filtered
    except Exception as e:
        LOGGER.error(f"Failed to fetch tips: {e}")
        return []

