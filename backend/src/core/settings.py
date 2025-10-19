"""Application settings helpers."""

from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict

from core.env import load_environment

_SETTINGS_CACHE: "Settings | None" = None


@dataclass(frozen=True)
class Settings:
    firecrawl_api_key: str | None
    wanted_persons_source_url: str
    wanted_persons_data_path: Path
    default_scrape_timestamp: str


def _default_data_path() -> Path:
    project_root = Path(__file__).resolve().parents[2]
    return project_root / "data" / "wanted_persons.json"


def _build_settings(overrides: Dict[str, Any] | None = None) -> Settings:
    load_environment()
    overrides = overrides or {}

    firecrawl_api_key = overrides.get("firecrawl_api_key") or os.getenv("FIRECRAWL_API_KEY")
    source_url = overrides.get("wanted_persons_source_url") or os.getenv(
        "WANTED_PERSONS_SOURCE_URL",
        "https://jcf.gov.jm/crime/wanted-persons/",
    )
    data_path_raw = overrides.get("wanted_persons_data_path") or os.getenv("WANTED_PERSONS_DATA_PATH")
    data_path = Path(data_path_raw) if data_path_raw else _default_data_path()

    default_scrape_timestamp = overrides.get("default_scrape_timestamp") or datetime.now(timezone.utc).isoformat()

    return Settings(
        firecrawl_api_key=firecrawl_api_key,
        wanted_persons_source_url=source_url,
        wanted_persons_data_path=data_path,
        default_scrape_timestamp=default_scrape_timestamp,
    )


def get_settings() -> Settings:
    """Return cached settings instance."""
    global _SETTINGS_CACHE
    if _SETTINGS_CACHE is None:
        _SETTINGS_CACHE = _build_settings()
    return _SETTINGS_CACHE


def override_settings(**overrides: Any) -> Settings:
    """Override settings cache with provided values."""
    global _SETTINGS_CACHE
    _SETTINGS_CACHE = _build_settings(overrides)
    return _SETTINGS_CACHE


def reset_settings() -> Settings:
    """Clear cache and rebuild settings from environment."""
    global _SETTINGS_CACHE
    _SETTINGS_CACHE = None
    return get_settings()
