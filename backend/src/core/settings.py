"""Application settings helpers."""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any, Dict

from dotenv import load_dotenv

_SETTINGS_CACHE: "Settings | None" = None


@dataclass(frozen=True)
class Settings:
    firecrawl_api_key: str | None
    wanted_persons_source_url: str
    openrouter_api_key: str | None
    resend_api_key: str | None
    convex_deployment_url: str | None
    recipients: str | None


def _build_settings(overrides: Dict[str, Any] | None = None) -> Settings:
    load_dotenv()
    overrides = overrides or {}

    firecrawl_api_key = overrides.get("firecrawl_api_key") or os.getenv("FIRECRAWL_API_KEY")
    source_url = overrides.get("wanted_persons_source_url") or os.getenv(
        "WANTED_PERSONS_SOURCE_URL",
        "https://jcf.gov.jm/crime/wanted-persons/",
    )
    openrouter_api_key = overrides.get("openrouter_api_key") or os.getenv("OPENROUTER_API_KEY")
    resend_api_key = overrides.get("resend_api_key") or os.getenv("RESEND_API_KEY")
    convex_deployment_url = overrides.get("convex_deployment_url") or os.getenv("CONVEX_DEPLOYMENT_URL")
    recipients = overrides.get("recipients") or os.getenv("RECIPIENTS")
    
    return Settings(
        firecrawl_api_key=firecrawl_api_key,
        wanted_persons_source_url=source_url,
        openrouter_api_key=openrouter_api_key,
        resend_api_key=resend_api_key,
        convex_deployment_url=convex_deployment_url,
        recipients=recipients,
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
