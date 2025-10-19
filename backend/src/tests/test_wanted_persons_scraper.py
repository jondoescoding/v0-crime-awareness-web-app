"""Tests for wanted persons scraper service."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict
from unittest.mock import Mock

import pytest

from services.wanted_persons_scraper import (
    _extract_records,
    _normalize_crimes,
    _normalize_record,
)


def test_normalize_crimes_with_string():
    result = _normalize_crimes("Murder")
    assert result == ["Murder"]


def test_normalize_crimes_with_comma_separated():
    result = _normalize_crimes("Murder, Robbery")
    assert result == ["Murder", "Robbery"]


def test_normalize_crimes_with_and():
    result = _normalize_crimes("Murder and Robbery")
    assert result == ["Murder", "Robbery"]


def test_normalize_crimes_with_list():
    result = _normalize_crimes(["Murder", "Robbery"])
    assert result == ["Murder", "Robbery"]


def test_normalize_crimes_with_none():
    result = _normalize_crimes(None)
    assert result == []


def test_normalize_record_with_full_data():
    data = {
        "full_name": "John Doe",
        "alias": "Johnny",
        "crimes": "Murder",
        "image_url": "https://example.com/image.jpg",
        "police_station": "Kingston Central Police",
        "source_url": "https://example.com/source",
    }
    result = _normalize_record(data)
    assert result is not None
    assert result.full_name == "John Doe"
    assert result.alias == "Johnny"
    assert result.crimes == ["Murder"]
    assert str(result.image_url) == "https://example.com/image.jpg"
    assert result.police_station == "Kingston Central Police"
    assert str(result.source_url) == "https://example.com/source"


def test_normalize_record_with_alternative_field_names():
    data = {
        "name": "John Doe",
        "alias": "Johnny",
        "crimes": "Murder",
        "imageurl": "https://example.com/image.jpg",
        "location": "Kingston Central Police",
    }
    result = _normalize_record(data)
    assert result is not None
    assert result.full_name == "John Doe"
    assert str(result.image_url) == "https://example.com/image.jpg"
    assert result.police_station == "Kingston Central Police"


def test_normalize_record_without_full_name_returns_none():
    data = {"alias": "Johnny", "crimes": "Murder"}
    result = _normalize_record(data)
    assert result is None


def test_extract_records_from_wanted_persons_key():
    raw_data = {
        "wanted_persons": [
            {
                "full_name": "John Doe",
                "alias": "Johnny",
                "crimes": "Murder",
                "image_url": "https://example.com/image.jpg",
                "police_station": "Kingston Central Police",
            }
        ]
    }
    records = list(_extract_records(raw_data))
    assert len(records) == 1
    assert records[0].full_name == "John Doe"


def test_extract_records_from_nested_data_wanted_persons():
    raw_data = {
        "data": {
            "wanted_persons": [
                {
                    "full_name": "Jane Smith",
                    "alias": "Janey",
                    "crimes": "Robbery",
                    "image_url": "https://example.com/image2.jpg",
                    "police_station": "Clarendon Police",
                }
            ]
        }
    }
    records = list(_extract_records(raw_data))
    assert len(records) == 1
    assert records[0].full_name == "Jane Smith"


def test_extract_records_from_nested_data_criminals():
    raw_data = {
        "data": {
            "criminals": [
                {
                    "name": "Bob Johnson",
                    "alias": "Bobby",
                    "crimes": "Fraud",
                    "imageurl": "https://example.com/image3.jpg",
                    "location": "St. James Police",
                }
            ]
        }
    }
    records = list(_extract_records(raw_data))
    assert len(records) == 1
    assert records[0].full_name == "Bob Johnson"


def test_extract_records_skips_invalid_entries():
    raw_data = {
        "wanted_persons": [
            {"full_name": "Valid Person", "crimes": "Murder"},
            {"alias": "No Name", "crimes": "Robbery"},
            {"full_name": "Another Valid", "crimes": "Fraud"},
        ]
    }
    records = list(_extract_records(raw_data))
    assert len(records) == 2
    assert records[0].full_name == "Valid Person"
    assert records[1].full_name == "Another Valid"


def test_extract_records_with_empty_data():
    raw_data = {}
    records = list(_extract_records(raw_data))
    assert len(records) == 0


def test_extract_records_with_empty_list():
    raw_data = {"wanted_persons": []}
    records = list(_extract_records(raw_data))
    assert len(records) == 0

