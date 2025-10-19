"""Wanted persons API routes."""

from __future__ import annotations

from typing import Callable, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from core import get_logger
from models import WantedPerson, WantedPersonsPayload
from services.wanted_persons_scraper import scrape_wanted_persons
from services.wanted_persons_storage import load_wanted_persons

LOGGER = get_logger(__name__)
router = APIRouter(prefix="/wanted-persons", tags=["wanted-persons"])


def _filter_records(
    items: List[WantedPerson],
    station: Optional[str],
    alias: Optional[str],
) -> List[WantedPerson]:
    if not station and not alias:
        return items

    def matches(person: WantedPerson) -> bool:
        station_match = True
        alias_match = True

        if station:
            station_match = person.police_station is not None and station.lower() in person.police_station.lower()
        if alias:
            alias_match = person.alias is not None and alias.lower() in person.alias.lower()

        return station_match and alias_match

    return [person for person in items if matches(person)]


@router.get("/", response_model=WantedPersonsPayload)
def get_wanted_persons(
    station: Optional[str] = Query(default=None, description="Filter by police station substring"),
    alias: Optional[str] = Query(default=None, description="Filter by alias substring"),
) -> WantedPersonsPayload:
    """Return the stored wanted persons dataset with optional filters."""
    payload = load_wanted_persons()
    filtered = _filter_records(payload.items, station, alias)
    LOGGER.info(
        "Returning %s wanted persons after filtering (station=%s, alias=%s)",
        len(filtered),
        station,
        alias,
    )
    return WantedPersonsPayload(
        scraped_at=payload.scraped_at,
        source_url=payload.source_url,
        items=filtered,
    )


def get_scraper_dependency() -> Callable[[], WantedPersonsPayload]:
    return scrape_wanted_persons


@router.post(
    "/scrape",
    response_model=WantedPersonsPayload,
    status_code=status.HTTP_202_ACCEPTED,
    description="Trigger a Firecrawl scrape to refresh wanted persons data.",
)
def refresh_wanted_persons(
    scraper: Callable[[], WantedPersonsPayload] = Depends(get_scraper_dependency),
) -> WantedPersonsPayload:
    try:
        payload = scraper()
    except RuntimeError as err:
        LOGGER.error("Failed to run scrape: %s", err)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(err)) from err
    return payload
