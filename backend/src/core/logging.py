"""Logging helpers configured for consistent formatting."""

from __future__ import annotations

import logging
from typing import Optional

from core.env import load_environment

_CONFIGURED = False


def configure_logging(level: int = logging.INFO) -> None:
    """Configure application logging once."""
    global _CONFIGURED
    if _CONFIGURED:
        return

    load_environment()
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    )
    _CONFIGURED = True


def get_logger(name: Optional[str] = None) -> logging.Logger:
    """Return module logger with shared configuration."""
    configure_logging()
    return logging.getLogger(name if name else "informa")
