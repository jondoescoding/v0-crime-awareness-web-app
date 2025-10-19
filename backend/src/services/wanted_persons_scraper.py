"""Firecrawl-powered scraping workflow for wanted persons."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List

from firecrawl import FirecrawlApp  # type: ignore[import-untyped]

from core import get_logger, get_settings
from models import WantedPerson, WantedPersonsPayload

LOGGER = get_logger(__name__)


def _build_extract_schema() -> Dict[str, Any]:
    """Return Firecrawl schema describing wanted persons records."""
    return {
        "type": "object",
        "properties": {
            "wanted_persons": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "full_name": {"type": "string"},
                        "alias": {"type": ["string", "null"]},
                        "crimes": {"type": ["string", "array"]},
                        "image_url": {"type": ["string", "null"]},
                        "police_station": {"type": ["string", "null"]},
                        "source_url": {"type": ["string", "null"]},
                    },
                },
            },
        },
        "required": ["wanted_persons"],
    }


def _create_client(api_key: str) -> FirecrawlApp:
    return FirecrawlApp(api_key=api_key)


def _normalize_crimes(value: Any) -> List[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if isinstance(value, str):
        parts = [part.strip() for part in value.replace(" and ", ",").split(",")]
        return [part for part in parts if part]
    return [str(value)]


def _normalize_record(data: Dict[str, Any]) -> WantedPerson | None:
    full_name = data.get("full_name") or data.get("name")
    if not full_name:
        return None

    alias = data.get("alias")
    crimes = _normalize_crimes(data.get("crimes"))
    image_url = data.get("image_url") or data.get("imageurl")
    police_station = data.get("police_station") or data.get("location")
    source_url = data.get("source_url")

    return WantedPerson(
        full_name=full_name,
        alias=alias if alias else None,
        crimes=crimes,
        image_url=image_url,
        police_station=police_station,
        source_url=source_url,
    )


def _extract_records(raw: Dict[str, Any]) -> Iterable[WantedPerson]:
    if "wanted_persons" in raw:
        source = raw["wanted_persons"]
    elif "data" in raw and "wanted_persons" in raw["data"]:
        source = raw["data"]["wanted_persons"]
    elif "data" in raw and "criminals" in raw["data"]:
        source = raw["data"]["criminals"]
    else:
        source = raw.get("criminals") or raw.get("items") or []

    for entry in source or []:
        normalized = _normalize_record(entry)
        if normalized:
            yield normalized


def scrape_wanted_persons() -> WantedPersonsPayload:
    """Scrape wanted persons data via Firecrawl and return normalized payload."""
    settings = get_settings()
    if not settings.firecrawl_api_key:
        raise RuntimeError("FIRECRAWL_API_KEY is not configured; cannot run scrape")

    LOGGER.info("Starting Firecrawl scrape for wanted persons from %s", settings.wanted_persons_source_url)
    client = _create_client(settings.firecrawl_api_key)

    response = client.extract(
        urls=[settings.wanted_persons_source_url],
        prompt=(
            "Extract the full name, alias, crime(s), image URL, and police station "
            "location for each wanted person. Ensure that the full name is included."
        ),
        schema=_build_extract_schema(),
        enable_web_search=True,
        agent={"model": "FIRE-1"},
    )

    # Convert Pydantic model to dict for simpler handling
    response_dict = response.model_dump() if hasattr(response, "model_dump") else response.dict()

    if not response_dict.get("success"):
        error_msg = response_dict.get("error", "Unknown error")
        raise RuntimeError(f"Firecrawl extraction failed: {error_msg}")

    response_data = response_dict.get("data") or {}
    records = list(_extract_records(response_data))
    LOGGER.info("Firecrawl returned %s wanted person records", len(records))

    deduped: dict[tuple[str, str | None], WantedPerson] = {}
    for person in records:
        key = (person.full_name.lower(), person.alias.lower() if person.alias else None)
        deduped[key] = person

    scraped_at = datetime.now(timezone.utc)
    payload = WantedPersonsPayload(
        scraped_at=scraped_at,
        source_url=settings.wanted_persons_source_url,
        items=list(deduped.values()),
    )
    LOGGER.info("Wanted persons dataset updated at %s", scraped_at.isoformat())
    return payload
