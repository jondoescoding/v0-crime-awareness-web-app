"""Models describing wanted persons data."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class WantedPerson(BaseModel):
    """Normalized record describing a wanted person."""

    model_config = ConfigDict(str_strip_whitespace=True, populate_by_name=True)

    full_name: str = Field(..., description="Full name of the wanted person")
    alias: Optional[str] = Field(default=None, description="Known alias or nickname")
    crimes: list[str] = Field(default_factory=list, description="List of related crimes")
    image_url: Optional[HttpUrl] = Field(default=None, description="Image illustrating the wanted person")
    police_station: Optional[str] = Field(default=None, description="Police station seeking the individual")
    source_url: Optional[HttpUrl] = Field(default=None, description="Source page for the record")


class WantedPersonsPayload(BaseModel):
    """Collection payload returned by API and storage layers."""

    model_config = ConfigDict(str_strip_whitespace=True)

    scraped_at: datetime = Field(..., description="Timestamp when the dataset was captured")
    source_url: HttpUrl = Field(..., description="URL scraped for the wanted persons dataset")
    items: list[WantedPerson] = Field(default_factory=list, description="Normalized wanted persons records")
