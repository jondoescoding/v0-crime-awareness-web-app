"""Storage helpers for wanted persons data."""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Iterable

from core import get_logger, get_settings
from models import WantedPerson, WantedPersonsPayload

LOGGER = get_logger(__name__)


def _ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def load_wanted_persons() -> WantedPersonsPayload:
    """Load wanted persons dataset from configured storage.

    Returns an empty payload if the file does not exist yet.
    """
    settings = get_settings()
    path = settings.wanted_persons_data_path
    if not path.exists():
        LOGGER.info("Wanted persons dataset not found at %s; returning empty payload", path)
        return WantedPersonsPayload(
            scraped_at=datetime.fromisoformat(settings.default_scrape_timestamp),
            source_url=settings.wanted_persons_source_url,
            items=[],
        )

    with path.open("r", encoding="utf-8") as handle:
        raw = json.load(handle)

    try:
        payload = WantedPersonsPayload.model_validate(raw)
    except Exception as exc:  # noqa: BLE001 - capture validation issues for logging
        LOGGER.warning("Failed to validate stored wanted persons payload: %s", exc)
        raise

    return payload


def save_wanted_persons(payload: WantedPersonsPayload) -> Path:
    """Persist wanted persons payload to configured storage."""
    settings = get_settings()
    path = settings.wanted_persons_data_path
    _ensure_parent(path)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload.model_dump(mode="json"), handle, indent=2)
    LOGGER.info("Stored %s wanted persons records to %s", len(payload.items), path)
    return path


def upsert_wanted_persons(items: Iterable[WantedPerson], scraped_at: datetime) -> WantedPersonsPayload:
    """Create payload from provided items, deduplicating by (name, alias)."""
    settings = get_settings()
    deduped: dict[tuple[str, str | None], WantedPerson] = {}
    for person in items:
        key = (person.full_name.lower(), person.alias.lower() if person.alias else None)
        deduped[key] = person

    payload = WantedPersonsPayload(
        scraped_at=scraped_at,
        source_url=settings.wanted_persons_source_url,
        items=list(deduped.values()),
    )
    save_wanted_persons(payload)
    return payload
