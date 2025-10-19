# Informa Backend – Wanted Persons Service

A FastAPI-powered backend that scrapes wanted persons data from the Jamaica Constabulary Force (JCF) using Firecrawl and exposes it through REST endpoints.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [API Documentation](#api-documentation)
- [Configuration](#configuration)
- [Development](#development)
- [Testing](#testing)

## Overview

The Informa backend automatically retrieves structured missing/wanted person records from the JCF website and serves them via REST API. The service uses Firecrawl's extraction API to parse unstructured web content into normalized records.

### Key Features

- Firecrawl-powered web scraping with LLM extraction
- Automatic data normalization and deduplication
- RESTful API with filtering capabilities
- Structured logging and error handling
- Type-safe Pydantic models for data validation
- On-demand and manual scrape triggering

## Quick Start

### Prerequisites

- Python 3.12+
- `pip` or `poetry`
- Firecrawl API key (sign up at https://www.firecrawl.dev)

### Installation

```bash
cd backend
pip install -e .
```

### Environment Setup

Create a `.env` file in the `backend/` directory:

```env
FIRECRAWL_API_KEY=fc-your-api-key-here
WANTED_PERSONS_SOURCE_URL=https://jcf.gov.jm/crime/wanted-persons/
```

### Run the Server

```bash
python main.py
```

The API will be available at `http://localhost:8000`. OpenAPI docs at `http://localhost:8000/docs`.

## Architecture

### Directory Structure

```
backend/
├── main.py                     # FastAPI application entrypoint
├── pyproject.toml             # Project dependencies and metadata
├── .env                       # Environment variables (not in repo)
├── data/                      # Scraped data storage
└── src/
    ├── api/
    │   ├── __init__.py        # FastAPI app factory and router setup
    │   └── wanted_persons.py  # Wanted persons endpoints
    ├── core/
    │   ├── env.py            # Environment variable loading
    │   ├── logging.py        # Structured logging configuration
    │   ├── settings.py       # Application settings and config
    │   └── __init__.py       # Core module exports
    ├── models/
    │   ├── wanted_person.py  # Pydantic data models
    │   └── __init__.py       # Model exports
    ├── services/
    │   ├── wanted_persons_scraper.py  # Firecrawl scraping logic
    │   └── __init__.py
    └── tests/
        └── test_wanted_persons_scraper.py
tests/
└── test_wanted_persons_api.py
```

### Data Flow

```
FastAPI Endpoint (/wanted-persons)
    ↓
API Route Handler (wanted_persons.py)
    ↓
Scraper Dependency (wanted_persons_scraper.py)
    ↓
Firecrawl Extract API
    ↓
Raw HTML Extraction
    ↓
Record Normalization & Deduplication
    ↓
WantedPersonsPayload (Pydantic Model)
    ↓
JSON Response to Client
```

### Core Components

#### 1. **Scraper Service** (`src/services/wanted_persons_scraper.py`)

Handles all Firecrawl interaction and data normalization:

- `scrape_wanted_persons()`: Main entry point
- `_build_extract_schema()`: Defines Firecrawl extraction schema
- `_normalize_record()`: Converts raw data to WantedPerson model
- `_extract_records()`: Handles flexible response parsing
- `_normalize_crimes()`: Parses crime fields (handles strings, lists, variations)

**Key Behavior:**
- Deduplicates records by `(full_name, alias)` tuple
- Normalizes whitespace and field names
- Handles multiple response formats from Firecrawl

#### 2. **API Routes** (`src/api/wanted_persons.py`)

Two endpoints:

- `GET /wanted-persons/`: Retrieve wanted persons with optional filters
- `POST /wanted-persons/scrape`: Trigger manual scrape

Filters support:
- `station`: Filter by police station (substring match, case-insensitive)
- `alias`: Filter by alias (substring match, case-insensitive)

#### 3. **Data Models** (`src/models/wanted_person.py`)

Two Pydantic models ensure type safety and validation:

- `WantedPerson`: Individual record with fields: full_name, alias, crimes, image_url, police_station, source_url
- `WantedPersonsPayload`: Collection wrapper with scraped_at timestamp and source_url

#### 4. **Settings** (`src/core/settings.py`)

Centralized configuration via environment variables:

- `FIRECRAWL_API_KEY`: Required for Firecrawl API calls
- `WANTED_PERSONS_SOURCE_URL`: Target URL to scrape (default: JCF site)

Settings are cached globally and can be overridden for testing.

## API Documentation

### GET /wanted-persons/

Retrieve wanted persons dataset with optional filtering.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `station` | string (optional) | Filter by police station substring |
| `alias` | string (optional) | Filter by alias substring |

**Response:**

```json
{
  "scraped_at": "2025-10-19T12:30:45.123Z",
  "source_url": "https://jcf.gov.jm/crime/wanted-persons/",
  "items": [
    {
      "full_name": "John Doe",
      "alias": "Johnny D",
      "crimes": ["Theft", "Assault"],
      "image_url": "https://example.com/image.jpg",
      "police_station": "Downtown Station",
      "source_url": "https://jcf.gov.jm/crime/wanted-persons/"
    }
  ]
}
```

**Status Codes:**

- `200 OK`: Success
- `500 Internal Server Error`: Scraping failed (check logs for details)

**Examples:**

```bash
# Get all wanted persons
curl http://localhost:8000/wanted-persons/

# Filter by station
curl "http://localhost:8000/wanted-persons/?station=downtown"

# Filter by alias
curl "http://localhost:8000/wanted-persons/?alias=Johnny"

# Combine filters
curl "http://localhost:8000/wanted-persons/?station=downtown&alias=Johnny"
```

### POST /wanted-persons/scrape

Manually trigger a scrape to refresh data.

**Request Body:** None required

**Response:** Same as GET /wanted-persons/

**Status Codes:**

- `202 Accepted`: Scrape triggered successfully
- `500 Internal Server Error`: Scrape failed

**Example:**

```bash
curl -X POST http://localhost:8000/wanted-persons/scrape
```

### POST /reports/daily

Generate and email a 24-hour crime intelligence report using DSPy and OpenRouter.

**Request Body:** None required

**Response:**

```json
{
  "status": "success",
  "message": "Report generated and sent successfully"
}
```

**Status Codes:**

- `202 Accepted`: Report generation triggered successfully
- `500 Internal Server Error`: Report generation failed

**Example:**

```bash
curl -X POST http://localhost:8000/reports/daily
```

**Report Features:**

- Collects all crime reports, tips, and criminal updates from past 24 hours
- Uses DSPy with chain-of-thought reasoning via OpenRouter
- Generates structured sections: Overview, Incident Breakdown, Hotspot Analysis, Tips and Leads, Action Items
- Emails report to all configured recipients via Resend

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `FIRECRAWL_API_KEY` | Yes | None | API key for Firecrawl (get from https://www.firecrawl.dev) |
| `WANTED_PERSONS_SOURCE_URL` | No | `https://jcf.gov.jm/crime/wanted-persons/` | URL to scrape for wanted persons |
| `OPENROUTER_API_KEY` | Yes | None | API key for OpenRouter LLM access (get from https://openrouter.ai) |
| `RESEND_API_KEY` | Yes | None | API key for Resend email service (get from https://resend.com) |
| `CONVEX_DEPLOYMENT_URL` | Yes | None | Convex deployment URL for database access |
| `RECIPIENTS` | Yes | None | Comma-separated email addresses to receive crime intelligence reports |

### Firecrawl Extraction Schema

The service uses a structured extraction schema to normalize Firecrawl responses:

```json
{
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
          "source_url": {"type": ["string", "null"]}
        }
      }
    }
  },
  "required": ["wanted_persons"]
}
```

## Development

### Install Development Dependencies

```bash
cd backend
pip install -e ".[dev]"
```

### Project Structure Standards

Follow these conventions:

- **Files**: Use snake_case (e.g., `wanted_persons.py`)
- **Functions**: Use snake_case
- **Classes**: Use PascalCase
- **Type Hints**: Always include them (no `Any` type)
- **Line Length**: Keep under 120 characters
- **Max Script Size**: 250 lines per file

### Code Organization

1. **Models** (`src/models/`): Pydantic data classes
2. **Services** (`src/services/`): Business logic (scraping, processing)
3. **API** (`src/api/`): FastAPI routes and handlers
4. **Core** (`src/core/`): Shared utilities (logging, settings, env)

### Common Development Tasks

**Check logs:**

```bash
tail -f backend.log
```

**Debug Firecrawl response:**

Edit `src/services/wanted_persons_scraper.py` temporarily to log raw response:

```python
LOGGER.info("Raw Firecrawl response: %s", response_dict)
```

**Test record parsing:**

Run the scraper in isolation:

```python
from src.services.wanted_persons_scraper import scrape_wanted_persons
payload = scrape_wanted_persons()
print(f"Scraped {len(payload.items)} records")
```

## Testing

### Run All Tests

```bash
cd backend
pytest
```

### Run Specific Test File

```bash
pytest src/tests/test_wanted_persons_scraper.py -v
```

### Run API Tests Only

```bash
pytest tests/test_wanted_persons_api.py -v
```

### Test Coverage

```bash
pytest --cov=src --cov-report=html
```

### Testing Guidelines

- Use fixtures for setup (settings, mock Firecrawl clients)
- Mock Firecrawl API calls to avoid rate limits
- Test normalization edge cases (missing fields, varied formats)
- Verify deduplication logic with duplicate inputs
- Test filter functions with edge cases (empty lists, None values)

**Example Test Pattern:**

```python
def test_normalize_crimes_with_string_input():
    result = _normalize_crimes("Theft and Assault")
    assert result == ["Theft", "Assault"]

def test_normalize_crimes_with_list_input():
    result = _normalize_crimes(["Theft", "Assault"])
    assert result == ["Theft", "Assault"]

def test_normalize_record_with_missing_name():
    result = _normalize_record({"alias": "Johnny"})
    assert result is None
```

## Troubleshooting

### Issue: `FIRECRAWL_API_KEY is not configured`

**Solution:** Ensure `.env` file exists in `backend/` directory with valid Firecrawl API key:

```env
FIRECRAWL_API_KEY=fc-your-key-here
```

### Issue: Firecrawl extraction returns empty or malformed data

**Possible Causes:**
- Website HTML structure changed
- Rate limiting by the target site
- Firecrawl schema mismatch

**Solution:**
- Check Firecrawl dashboard for failed requests
- Verify target URL is accessible and contains expected data
- Review raw response in logs (temporarily add logging in scraper)

### Issue: Deduplication removes wanted entries

**Solution:** Verify deduplication key logic in `scrape_wanted_persons()`:

```python
key = (person.full_name.lower(), person.alias.lower() if person.alias else None)
```

If records have slight variations (typos, whitespace), the scraper may treat them as unique. Use manual data cleaning if needed.

### Issue: Slow API response on first call

**Expected Behavior:** First call triggers Firecrawl scrape, which takes 5-30 seconds depending on page size. Subsequent calls use cached results until manually refreshed.

**Solution:** Consider implementing background job scheduling (APScheduler) for periodic updates.

## Next Steps

- Implement persistent storage (database) to cache results
- Add background job scheduling for hourly/daily updates
- Create admin dashboard for monitoring scrape health
- Add historical tracking to detect data changes
- Implement API authentication (API keys, JWT tokens)
