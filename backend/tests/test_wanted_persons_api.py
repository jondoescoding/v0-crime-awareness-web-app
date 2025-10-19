"""Tests for wanted persons API endpoints."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from api import create_app
from api.wanted_persons import get_scraper_dependency
from core import override_settings, reset_settings
from models import WantedPersonsPayload
from services.wanted_persons_storage import save_wanted_persons


def _sample_payload(scraped_at: datetime | None = None) -> WantedPersonsPayload:
    if scraped_at is None:
        scraped_at = datetime(2025, 10, 19, 0, 28, 31, 787000, tzinfo=timezone.utc)
    return WantedPersonsPayload(
        scraped_at=scraped_at,
        source_url="https://jcf.gov.jm/crime/wanted-persons/",
        items=[
            {
                "full_name": "Courtney Sands",
                "alias": "Joshua",
                "crimes": ["Murder"],
                "image_url": "https://jcf.gov.jm/wp-content/uploads/2025/05/WhatsApp-Image-2025-05-21-at-11.15.20-AM-495x400.jpeg",
                "police_station": "Kingston Central Police",
                "source_url": "https://jcf.gov.jm/crime/wanted-persons/",
            },
            {
                "full_name": "Kafore Barley",
                "alias": "Hunter/Sparta/CJ",
                "crimes": ["Shooting with Intent"],
                "image_url": "https://jcf.gov.jm/wp-content/uploads/2025/05/WhatsApp-Image-2025-05-21-at-11.15.21-AM-1-495x400.jpeg",
                "police_station": "Clarendon Police",
                "source_url": "https://jcf.gov.jm/crime/wanted-persons/",
            },
            {
                "full_name": "Gaveen Hurd",
                "alias": "Bones",
                "crimes": ["Murder"],
                "image_url": "https://jcf.gov.jm/wp-content/uploads/2025/05/WhatsApp-Image-2025-05-21-at-11.15.21-AM-495x400.jpeg",
                "police_station": "St. James Police",
                "source_url": "https://jcf.gov.jm/crime/wanted-persons/",
            },
        ],
    )


@pytest.fixture()
def client(tmp_path: Path) -> TestClient:
    payload = _sample_payload()
    data_path = tmp_path / "wanted_persons.json"
    override_settings(
        wanted_persons_data_path=str(data_path),
        wanted_persons_source_url=str(payload.source_url),
        default_scrape_timestamp=payload.scraped_at.isoformat(),
        firecrawl_api_key=None,
    )
    save_wanted_persons(payload)
    app = create_app()
    test_client = TestClient(app)
    yield test_client
    test_client.app.dependency_overrides = {}
    reset_settings()


def test_get_wanted_persons_returns_all_records(client: TestClient) -> None:
    response = client.get("/wanted-persons")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 3
    assert data["items"][0]["full_name"] == "Courtney Sands"


def test_get_wanted_persons_filters_by_station(client: TestClient) -> None:
    response = client.get("/wanted-persons", params={"station": "Clarendon"})
    assert response.status_code == 200
    records = response.json()["items"]
    assert len(records) == 1
    assert records[0]["full_name"] == "Kafore Barley"


def test_get_wanted_persons_filters_by_alias(client: TestClient) -> None:
    response = client.get("/wanted-persons", params={"alias": "bones"})
    assert response.status_code == 200
    records = response.json()["items"]
    assert len(records) == 1
    assert records[0]["full_name"] == "Gaveen Hurd"


def test_post_scrape_uses_dependency_override(client: TestClient, tmp_path: Path) -> None:
    new_payload = _sample_payload(scraped_at=datetime.now(timezone.utc))

    def scraper() -> WantedPersonsPayload:
        save_wanted_persons(new_payload)
        return new_payload

    client.app.dependency_overrides[get_scraper_dependency] = lambda: scraper
    response = client.post("/wanted-persons/scrape")
    assert response.status_code == 202
    data = response.json()
    assert datetime.fromisoformat(data["scraped_at"].replace("Z", "+00:00")) == new_payload.scraped_at
