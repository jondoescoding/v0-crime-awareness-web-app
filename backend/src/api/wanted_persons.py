"""Wanted persons API routes."""

from __future__ import annotations

from typing import Callable, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from core import get_logger
from models import WantedPerson, WantedPersonsPayload
from services.wanted_persons_scraper import scrape_wanted_persons

LOGGER = get_logger(__name__)
router = APIRouter(prefix="/wanted-persons", tags=["wanted-persons"])


def get_scraper_dependency() -> Callable[[], WantedPersonsPayload]:
    return scrape_wanted_persons


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
    scraper: Callable[[], WantedPersonsPayload] = Depends(get_scraper_dependency),
    station: Optional[str] = Query(default=None, description="Filter by police station substring"),
    alias: Optional[str] = Query(default=None, description="Filter by alias substring"),
) -> WantedPersonsPayload:
    """
    Retrieve wanted persons dataset with optional filters.
    
    **Endpoint:** `GET /wanted-persons/`
    
    **Query Parameters:**
    - `station` (optional): Filter results by police station name (case-insensitive substring match)
    - `alias` (optional): Filter results by alias (case-insensitive substring match)
    
    **Examples:**
    - `GET /wanted-persons/` - Get all wanted persons
    - `GET /wanted-persons/?station=central` - Get persons wanted by stations containing "central"
    - `GET /wanted-persons/?alias=slim` - Get persons with alias containing "slim"
    - `GET /wanted-persons/?station=central&alias=slim` - Combined filters (AND logic)
    
    **Response (200 OK):**
    ```json
    {
        "scraped_at": "2025-10-19T12:30:00Z",
        "source_url": "https://www.saps.gov.za/wanted/wantedlist.php",
        "items": [
            {
                "full_name": "John Doe",
                "alias": "Slim",
                "crimes": ["Armed Robbery", "Murder"],
                "image_url": "https://example.com/image.jpg",
                "police_station": "Central Police Station",
                "source_url": "https://example.com/details"
            }
        ]
    }
    ```
    
    **Errors:**
    - `500 Internal Server Error`: Scraping service failed or FIRECRAWL_API_KEY missing
    
    **Note:** This endpoint performs live scraping on each request. Use POST /wanted-persons/scrape for explicit refresh.
    """
    try:
        payload = scraper()
    except RuntimeError as err:
        LOGGER.error("Failed to retrieve wanted persons: %s", err)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(err)) from err
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


@router.post(
    "/scrape",
    response_model=WantedPersonsPayload,
    status_code=status.HTTP_202_ACCEPTED,
)
def refresh_wanted_persons(
    scraper: Callable[[], WantedPersonsPayload] = Depends(get_scraper_dependency),
) -> WantedPersonsPayload:
    """
    Trigger explicit scrape to refresh wanted persons data.
    
    **Endpoint:** `POST /wanted-persons/scrape`
    
    **Request Body:** None required
    
    **Response (202 Accepted):**
    ```json
    {
        "scraped_at": "2025-10-19T12:30:00Z",
        "source_url": "https://www.saps.gov.za/wanted/wantedlist.php",
        "items": [
            {
                "full_name": "John Doe",
                "alias": "Slim",
                "crimes": ["Armed Robbery", "Murder"],
                "image_url": "https://example.com/image.jpg",
                "police_station": "Central Police Station",
                "source_url": "https://example.com/details"
            }
        ]
    }
    ```
    
    **Description:**
    Forces a fresh scrape of the SAPS wanted persons website using Firecrawl. 
    Returns the complete unfiltered dataset.
    
    **Errors:**
    - `500 Internal Server Error`: Firecrawl service failure or missing FIRECRAWL_API_KEY
    
    **Environment Variables Required:**
    - `FIRECRAWL_API_KEY`: API key for Firecrawl scraping service
    """
    try:
        payload = scraper()
    except RuntimeError as err:
        LOGGER.error("Failed to run scrape: %s", err)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(err)) from err
    return payload
