# Environment-Configuration-Management

## Purpose
Properly manage environment variables across backend services with validation, caching, and type safety using Python patterns.

## What This Teaches

- Pydantic settings pattern with frozen dataclasses
- Environment variable loading with python-dotenv
- Settings caching for performance
- Override patterns for testing
- Documentation of required vs optional vars
- Type hints for configuration safety

## Key Dependencies

```toml
python-dotenv>=1.0.1
pydantic>=2.7.0
```

## Core Implementation Pattern

### 1. Settings Dataclass

Create `backend/src/core/settings.py`:

```python
"""Application settings helpers."""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any, Dict

from dotenv import load_dotenv

_SETTINGS_CACHE: "Settings | None" = None


@dataclass(frozen=True)
class Settings:
    """Application settings loaded from environment variables."""
    
    # Existing settings
    firecrawl_api_key: str | None
    wanted_persons_source_url: str
    
    # New report generation settings
    openrouter_api_key: str | None
    resend_api_key: str | None
    convex_deployment_url: str | None
    recipients: str | None
```

**Why `frozen=True`?** Settings should be immutable after creation to prevent accidental modifications.

**Why `str | None`?** Allows optional configuration with proper type hints.

### 2. Settings Builder with Defaults

```python
def _build_settings(overrides: Dict[str, Any] | None = None) -> Settings:
    """Build settings from environment variables with optional overrides."""
    load_dotenv()  # Load .env file
    overrides = overrides or {}

    # Existing settings
    firecrawl_api_key = overrides.get("firecrawl_api_key") or os.getenv("FIRECRAWL_API_KEY")
    source_url = overrides.get("wanted_persons_source_url") or os.getenv(
        "WANTED_PERSONS_SOURCE_URL",
        "https://jcf.gov.jm/crime/wanted-persons/",  # Default value
    )
    
    # New settings (no defaults - must be configured)
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
```

### 3. Global Settings Cache

```python
def get_settings() -> Settings:
    """Return cached settings instance."""
    global _SETTINGS_CACHE
    if _SETTINGS_CACHE is None:
        _SETTINGS_CACHE = _build_settings()
    return _SETTINGS_CACHE
```

**Why cache?** Avoids repeatedly reading environment variables and `.env` file.

### 4. Override Pattern for Testing

```python
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
```

### 5. Usage in Services

```python
from core.settings import get_settings

def my_service_function():
    settings = get_settings()
    
    # Validate required settings
    if not settings.openrouter_api_key:
        raise ValueError("OPENROUTER_API_KEY is not configured")
    
    # Use settings
    lm = dspy.LM(
        model="openrouter/google/gemini-2.0-flash-001",
        api_key=settings.openrouter_api_key,
        api_base="https://openrouter.ai/api/v1"
    )
```

## Environment Variable Documentation

### .env File Template

Create `backend/.env.example`:

```bash
# Required for web scraping
FIRECRAWL_API_KEY=fc-your-api-key-here

# Optional - defaults to JCF wanted persons page
WANTED_PERSONS_SOURCE_URL=https://jcf.gov.jm/crime/wanted-persons/

# Required for report generation
OPENROUTER_API_KEY=sk-or-your-key-here
RESEND_API_KEY=re-your-key-here
CONVEX_DEPLOYMENT_URL=https://your-deployment.convex.cloud
RECIPIENTS=email1@example.com,email2@example.com
```

### README Documentation

```markdown
## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `FIRECRAWL_API_KEY` | Yes | None | API key for Firecrawl |
| `WANTED_PERSONS_SOURCE_URL` | No | JCF URL | URL to scrape |
| `OPENROUTER_API_KEY` | Yes* | None | OpenRouter API access |
| `RESEND_API_KEY` | Yes* | None | Resend email service |
| `CONVEX_DEPLOYMENT_URL` | Yes* | None | Convex database URL |
| `RECIPIENTS` | Yes* | None | Email recipients |

*Required for report generation feature
```

## Validation Patterns

### 1. Early Validation (Service Level)

```python
def generate_report(activity_data: dict) -> str:
    settings = get_settings()
    
    # Fail fast if required config missing
    if not settings.openrouter_api_key:
        raise ValueError("OPENROUTER_API_KEY is not configured")
    
    # Proceed with generation
    lm = dspy.LM(model="...", api_key=settings.openrouter_api_key)
```

### 2. Multiple Dependencies

```python
def send_report_email(report: str) -> None:
    settings = get_settings()
    
    # Check all required settings at once
    if not settings.resend_api_key:
        raise ValueError("RESEND_API_KEY is not configured")
    
    if not settings.recipients:
        raise ValueError("RECIPIENTS is not configured")
    
    # Proceed with sending
    resend.api_key = settings.resend_api_key
    recipients = [email.strip() for email in settings.recipients.split(",")]
```

### 3. Optional Features

```python
def collect_data() -> dict:
    settings = get_settings()
    
    # Required for this feature
    if not settings.convex_deployment_url:
        raise ValueError("CONVEX_DEPLOYMENT_URL is not configured")
    
    client = ConvexClient(settings.convex_deployment_url)
```

## Testing Patterns

### 1. Test with Mock Settings

```python
def test_report_generation():
    from core.settings import override_settings
    
    # Override for test
    override_settings(
        openrouter_api_key="test-key",
        resend_api_key="test-key",
        convex_deployment_url="http://test.local",
        recipients="test@example.com"
    )
    
    # Run test
    result = generate_report({})
    
    assert result is not None
```

### 2. Test Missing Configuration

```python
def test_missing_api_key():
    from core.settings import override_settings
    import pytest
    
    # Clear API key
    override_settings(openrouter_api_key=None)
    
    # Should raise ValueError
    with pytest.raises(ValueError, match="OPENROUTER_API_KEY"):
        generate_report({})
```

### 3. Cleanup After Tests

```python
def test_cleanup():
    from core.settings import reset_settings
    
    # Override for test
    override_settings(openrouter_api_key="test")
    
    # ... run test ...
    
    # Reset to environment values
    reset_settings()
```

## Common Pitfalls

### 1. Not Loading .env File
```python
# ❌ WRONG - .env file not loaded
def _build_settings():
    api_key = os.getenv("API_KEY")  # Returns None!

# ✅ CORRECT - Load .env first
def _build_settings():
    load_dotenv()
    api_key = os.getenv("API_KEY")  # Reads from .env
```

### 2. Mutable Settings
```python
# ❌ WRONG - Can be modified
@dataclass
class Settings:
    api_key: str

settings = get_settings()
settings.api_key = "hacked"  # Allowed!

# ✅ CORRECT - Immutable
@dataclass(frozen=True)
class Settings:
    api_key: str

settings = get_settings()
settings.api_key = "hacked"  # FrozenInstanceError!
```

### 3. Missing Type Hints
```python
# ❌ WRONG - No type safety
api_key = os.getenv("API_KEY")
if api_key:
    do_something(api_key)  # api_key could be None!

# ✅ CORRECT - Type hints and validation
api_key: str | None = os.getenv("API_KEY")
if not api_key:
    raise ValueError("API_KEY is not configured")
do_something(api_key)  # Type checker knows api_key is str
```

### 4. No Defaults vs Empty Defaults
```python
# Required setting (no default)
api_key = os.getenv("API_KEY")  # Returns None if not set

# Optional setting (with default)
url = os.getenv("URL", "https://default.com")  # Returns default if not set

# Empty string is NOT the same as None!
url = os.getenv("URL") or "https://default.com"  # Handles empty strings too
```

## Best Practices

1. **Frozen dataclasses** - Prevent accidental modifications
2. **Type hints** - Catch errors at development time
3. **Early validation** - Fail fast with clear error messages
4. **Caching** - Read environment once, reuse everywhere
5. **Override pattern** - Easy testing without changing environment
6. **Documentation** - Clear README with all required variables

## Complete Example

See: `backend/src/core/settings.py`

## References

- [python-dotenv Documentation](https://pypi.org/project/python-dotenv/)
- [Python Dataclasses](https://docs.python.org/3/library/dataclasses.html)
- [Type Hints](https://docs.python.org/3/library/typing.html)

