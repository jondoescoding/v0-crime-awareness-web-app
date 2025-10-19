# Pydantic v2 Best Practices for Gas Station Enrichment System

## Implementation Overview

this document provides comprehensive best practices for pydantic v2 models in the gas station enrichment system. the implementation includes:

- **GasStationEnriched**: extends existing GasStationExtract with validation
- **OpeningHoursDay**: handles daily opening hours with time format validation
- **Request/Response models**: for api integration

## Key Files

- `/backend/src/models/calljaa/gas_stations_enriched.py` - main model definitions
- `/backend/src/tests/test_gas_stations_enriched.py` - comprehensive test suite
- `/backend/src/examples/enriched_models_usage.py` - usage examples

## Pydantic v2 Best Practices Applied

### 1. Field Validation with @field_validator

```python
@field_validator('latitude')
@classmethod
def validate_jamaica_latitude(cls, v: Optional[float]) -> Optional[float]:
    """Validate latitude is within Jamaica bounds."""
    if v is None:
        return v

    if not (17.7 <= v <= 18.6):
        raise ValueError(
            f"Latitude must be within Jamaica bounds (17.7 to 18.6), got: {v}"
        )
    return v
```

**key points:**
- use `@classmethod` decorator
- explicit return type annotations
- clear error messages with context
- handle none values explicitly

### 2. Model Configuration with ConfigDict

```python
model_config = ConfigDict(
    str_strip_whitespace=True,     # auto-strip whitespace
    validate_assignment=True,      # validate on field assignment
    extra='forbid'                 # reject unknown fields
)
```

**recommended settings:**
- `str_strip_whitespace=True` for automatic whitespace handling
- `validate_assignment=True` for runtime validation
- `extra='forbid'` for strict api contracts

### 3. Optional vs Required Fields

**required fields:**
```python
day: DayOfWeek = Field(description="Day of the week")
```

**optional fields:**
```python
latitude: Optional[float] = Field(
    default=None,
    description="Latitude coordinate within Jamaica bounds"
)
```

**best practices:**
- use explicit `Optional[T]` type hints
- provide `default=None` for optional fields
- always include descriptive field descriptions

### 4. Geographic Coordinate Validation (Jamaica-specific)

```python
# Jamaica coordinate bounds
latitude: 17.7 to 18.6
longitude: -78.4 to -76.2

@field_validator('latitude')
@classmethod
def validate_jamaica_latitude(cls, v: Optional[float]) -> Optional[float]:
    if v is None:
        return v
    if not (17.7 <= v <= 18.6):
        raise ValueError(f"Latitude must be within Jamaica bounds")
    return v
```

### 5. Time Format Validation (12-hour with AM/PM)

```python
@field_validator('opening_hour', 'closing_hour')
@classmethod
def validate_time_format(cls, v: Optional[str]) -> Optional[str]:
    if v is None:
        return v

    # Pattern for 12-hour format: H:MM AM/PM or HH:MM AM/PM
    pattern = r'^(1[0-2]|0?[1-9]):([0-5][0-9])\s*(AM|PM)$'
    if not re.match(pattern, v.upper()):
        raise ValueError(
            f"Time must be in 12-hour format (e.g., '8:00 AM'), got: {v}"
        )

    return v.upper()
```

**accepted formats:**
- "8:00 AM", "12:00 PM", "11:59 PM"
- "1:30 AM", "9:45 PM"
- automatically converts to uppercase

### 6. Phone Number Validation (Jamaican format)

```python
@field_validator('phone_number')
@classmethod
def validate_jamaican_phone(cls, v: Optional[str]) -> Optional[str]:
    if v is None:
        return v

    patterns = [
        r'^\+1\s?876[-\s]?\d{3}[-\s]?\d{4}$',  # +1 876-xxx-xxxx
        r'^876[-\s]?\d{3}[-\s]?\d{4}$',        # 876-xxx-xxxx
        r'^\d{3}[-\s]?\d{4}$',                 # xxx-xxxx (local)
    ]

    for pattern in patterns:
        if re.match(pattern, v):
            # Normalize to +1 876-xxx-xxxx format
            digits_only = re.sub(r'\D', '', v)
            # ... normalization logic
            return normalized_phone

    raise ValueError(f"Phone number must be in Jamaican format")
```

**accepted formats:**
- "+1 876-123-4567" (full international)
- "876-123-4567" (national)
- "123-4567" (local)
- automatically normalizes to "+1 876-xxx-xxxx"

### 7. URL Validation

```python
thumbnail_url: Optional[HttpUrl] = Field(
    default=None,
    description="URL to gas station thumbnail image"
)
```

**uses pydantic's built-in HttpUrl type for:**
- scheme validation (http/https)
- url structure validation
- automatic url parsing

### 8. Enum Handling

```python
class DayOfWeek(str, Enum):
    """Enumeration for days of the week."""
    MONDAY = "monday"
    TUESDAY = "tuesday"
    # ... rest of days
```

**best practices:**
- inherit from `str, Enum` for json serialization
- use lowercase values for consistency
- explicit enum values prevent refactoring issues

### 9. Model Inheritance

```python
class GasStationEnriched(GasStationExtract):
    """Extended gas station model with enriched data."""

    # Additional fields here
    latitude: Optional[float] = Field(...)
    longitude: Optional[float] = Field(...)
```

**inheritance patterns:**
- extend existing models rather than duplicate
- maintain backward compatibility
- add enrichment fields as optional

### 10. Cross-field Validation with model_post_init

```python
def model_post_init(self, __context) -> None:
    """Post-initialization validation for coordinate consistency."""
    lat_provided = self.latitude is not None
    lon_provided = self.longitude is not None

    if lat_provided != lon_provided:
        raise ValueError(
            "Both latitude and longitude must be provided together"
        )
```

**use model_post_init for:**
- cross-field validation
- business logic constraints
- complex validation rules

### 11. Comprehensive Testing Strategy

```python
class TestGasStationEnriched:
    def test_jamaica_latitude_bounds(self):
        """Test latitude validation within Jamaica bounds."""
        # Valid latitudes
        valid_lats = [17.7, 18.0, 18.6]
        for lat in valid_lats:
            enriched = GasStationEnriched(...)
            assert enriched.latitude == lat

        # Invalid latitudes
        invalid_lats = [17.6, 18.7]
        for lat in invalid_lats:
            with pytest.raises(ValidationError):
                GasStationEnriched(...)
```

**testing approach:**
- test valid values at boundaries
- test invalid values just outside boundaries
- test none/optional scenarios
- test normalization behavior
- test cross-field validation

## Advanced Features

### 1. Field Constraints

```python
rating: Optional[float] = Field(
    default=None,
    ge=0.0,           # greater than or equal to 0
    le=5.0,           # less than or equal to 5
    description="Customer rating from 0.0 to 5.0"
)

review_count: Optional[int] = Field(
    default=None,
    ge=0,             # non-negative integers only
    description="Number of customer reviews"
)
```

### 2. List Validation

```python
opening_hours: Optional[list[OpeningHoursDay]] = Field(
    default=None,
    description="Weekly opening hours for each day"
)

@field_validator('opening_hours')
@classmethod
def validate_opening_hours_completeness(
    cls, v: Optional[list[OpeningHoursDay]]
) -> Optional[list[OpeningHoursDay]]:
    if v is None:
        return v

    if len(v) != 7:
        raise ValueError(f"Opening hours must contain all 7 days")

    # Check all days are present and unique
    days_present = {day.day for day in v}
    expected_days = {day for day in DayOfWeek}

    if days_present != expected_days:
        raise ValueError("Missing or duplicate days in opening hours")

    return v
```

### 3. Request/Response Models

```python
class GasStationEnrichmentRequest(BaseModel):
    """Request model for gas station enrichment."""
    gas_station: GasStationExtract = Field(...)
    include_coordinates: bool = Field(default=True)
    include_contact_info: bool = Field(default=True)
    include_hours: bool = Field(default=True)
    include_images: bool = Field(default=False)

class GasStationEnrichmentResponse(BaseModel):
    """Response model for gas station enrichment."""
    enriched_station: GasStationEnriched = Field(...)
    enrichment_status: dict[str, bool] = Field(...)
    errors: Optional[list[str]] = Field(default=None)
```

## Error Handling Best Practices

### 1. Clear Error Messages

```python
raise ValueError(
    f"Latitude must be within Jamaica bounds (17.7 to 18.6), got: {v}"
)
```

### 2. Context in Validation Errors

```python
if lat_provided != lon_provided:
    raise ValueError(
        f"Both latitude and longitude must be provided together, "
        f"got latitude: {self.latitude}, longitude: {self.longitude}"
    )
```

### 3. Business Rule Validation

```python
if self.is_closed:
    if self.opening_hour is not None or self.closing_hour is not None:
        raise ValueError(
            "Cannot have opening/closing hours when marked as closed"
        )
```

## Performance Considerations

1. **use field constraints** instead of validators when possible (ge, le, min_length, etc.)
2. **validate_assignment=True** adds overhead - use selectively
3. **compiled regex patterns** for repeated validations
4. **optional fields** reduce validation overhead for unused features

## Security Considerations

1. **extra='forbid'** prevents injection of unexpected fields
2. **explicit type annotations** prevent type confusion
3. **input sanitization** through validators (phone normalization, url validation)
4. **geographic bounds checking** prevents invalid coordinate injection

this implementation provides robust validation while maintaining performance and usability for the gas station enrichment system.