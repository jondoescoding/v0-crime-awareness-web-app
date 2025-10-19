# DSPy-OpenRouter-Integration

## Purpose
Guide developers through integrating DSPy with OpenRouter for LLM-powered report generation in FastAPI async environments.

## What This Teaches

- Setting up DSPy with custom LM providers (OpenRouter, not just OpenAI)
- Using `dspy.context()` for async environments (FastAPI compatibility)
- Creating DSPy signatures with chain-of-thought reasoning
- Two-stage processing pattern (condenser → writer)
- Proper error handling and logging for LLM calls

## Key Dependencies

```toml
dspy-ai>=2.5.0
```

## Environment Variables

```bash
OPENROUTER_API_KEY=sk-or-your-key-here
```

## Core Implementation Pattern

### 1. Configure OpenRouter with DSPy

```python
import dspy
from core.settings import get_settings

settings = get_settings()

# Create LM instance with OpenRouter
lm = dspy.LM(
    model="openrouter/google/gemini-2.0-flash-001",  # Any OpenRouter model
    api_key=settings.openrouter_api_key,
    api_base="https://openrouter.ai/api/v1"  # Critical: OpenRouter endpoint
)
```

### 2. Use Context for Async Operations

**IMPORTANT**: FastAPI endpoints are async. DSPy's `configure()` doesn't work across async contexts.

```python
# ❌ WRONG - This fails in FastAPI
dspy.configure(lm=lm)
condenser = dspy.ChainOfThought(ActivityCondenser)
result = condenser(raw_data="...")

# ✅ CORRECT - Use context manager
with dspy.context(lm=lm):
    condenser = dspy.ChainOfThought(ActivityCondenser)
    result = condenser(raw_data="...")
```

### 3. Define DSPy Signatures

```python
class ActivityCondenser(dspy.Signature):
    """Condense 24-hour crime activity into structured facts."""
    
    raw_data: str = dspy.InputField(desc="JSON data of incidents, criminals, and tips")
    condensed_facts: str = dspy.OutputField(desc="Bullet point summary of key facts")


class SectionWriter(dspy.Signature):
    """Generate one report section from condensed facts."""
    
    facts: str = dspy.InputField(desc="Condensed facts about criminal activity")
    section_name: str = dspy.InputField(desc="Section name to generate")
    markdown_output: str = dspy.OutputField(desc="Formatted markdown section content")
```

### 4. Two-Stage Processing Pattern

```python
import json
from datetime import datetime

def generate_report(activity_data: dict) -> str:
    """Generate structured crime intelligence report using DSPy."""
    settings = get_settings()
    
    if not settings.openrouter_api_key:
        raise ValueError("OPENROUTER_API_KEY is not configured")
    
    lm = dspy.LM(
        model="openrouter/google/gemini-2.0-flash-001",
        api_key=settings.openrouter_api_key,
        api_base="https://openrouter.ai/api/v1"
    )
    
    with dspy.context(lm=lm):
        # Stage 1: Condense raw data
        raw_data_str = json.dumps(activity_data, indent=2)
        condenser = dspy.ChainOfThought(ActivityCondenser)
        condensed = condenser(raw_data=raw_data_str)
        
        # Stage 2: Generate sections
        sections = [
            "Overview",
            "Incident Breakdown",
            "Hotspot Analysis",
            "Tips and Leads",
            "Action Items"
        ]
        
        writer = dspy.ChainOfThought(SectionWriter)
        report_parts = [
            f"# Crime Intelligence Brief - {datetime.now().strftime('%Y-%m-%d')}",
            f"\n*Generated at {datetime.now().strftime('%I:%M %p')}*\n",
        ]
        
        for section in sections:
            result = writer(facts=condensed.condensed_facts, section_name=section)
            report_parts.append(f"\n## {section}\n")
            report_parts.append(result.markdown_output)
        
        return "\n".join(report_parts)
```

## Common Pitfalls

### 1. Async Context Error
```
Error: dspy.settings.configure(...) can only be called from the same async task
```
**Solution**: Use `with dspy.context(lm=lm):` instead of `dspy.configure(lm=lm)`

### 2. Model Name Format
```python
# ❌ WRONG
model="google/gemini-2.0-flash-001"  # Missing openrouter/ prefix

# ✅ CORRECT
model="openrouter/google/gemini-2.0-flash-001"
```

### 3. Missing API Base
```python
# ❌ WRONG - Uses OpenAI endpoint
lm = dspy.LM(model="openrouter/...", api_key=key)

# ✅ CORRECT - Uses OpenRouter endpoint
lm = dspy.LM(
    model="openrouter/...", 
    api_key=key,
    api_base="https://openrouter.ai/api/v1"
)
```

## Logging Best Practices

```python
from core.logging import get_logger

LOGGER = get_logger(__name__)

with dspy.context(lm=lm):
    LOGGER.info("Condensing activity data with DSPy")
    condensed = condenser(raw_data=raw_data_str)
    
    LOGGER.info("Generating report sections")
    for section in sections:
        LOGGER.info(f"Generating section: {section}")
        result = writer(facts=condensed.condensed_facts, section_name=section)
    
    LOGGER.info(f"Report generated successfully ({len(full_report)} characters)")
```

## Testing Strategy

1. **Test without API key** - Should raise ValueError
2. **Test with invalid model** - Should fail gracefully
3. **Test in async endpoint** - Should use context properly
4. **Test output format** - Should return valid markdown

## Complete Example

See: `backend/src/services/report_generator.py`

## References

- [DSPy Documentation](https://dspy-docs.vercel.app/)
- [OpenRouter API](https://openrouter.ai/docs)
- [DSPy Context for Async](https://github.com/stanfordnlp/dspy/issues/context-async)

