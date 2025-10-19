"""Environment loading helpers for backend services."""

from __future__ import annotations

from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

_HAS_LOADED = False


def load_environment(dotenv_path: Optional[Path] = None) -> None:
    """Load environment variables from .env exactly once."""
    global _HAS_LOADED
    if _HAS_LOADED:
        return

    load_dotenv(dotenv_path=dotenv_path, override=False)
    _HAS_LOADED = True
