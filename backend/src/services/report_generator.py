"""DSPy-powered crime intelligence report generator."""

from __future__ import annotations

import json
from datetime import datetime
from typing import Any, Dict

import dspy

from core.logging import get_logger
from core.settings import get_settings

LOGGER = get_logger(__name__)


class ActivityCondenser(dspy.Signature):
    """Condense 24-hour crime activity into structured facts."""
    
    raw_data: str = dspy.InputField(desc="JSON data of incidents, criminals, and tips")
    condensed_facts: str = dspy.OutputField(desc="Bullet point summary of key facts")


class SectionWriter(dspy.Signature):
    """Generate one report section from condensed facts."""
    
    facts: str = dspy.InputField(desc="Condensed facts about criminal activity")
    section_name: str = dspy.InputField(desc="Section name to generate")
    markdown_output: str = dspy.OutputField(desc="Formatted markdown section content")


def generate_report(activity_data: Dict[str, Any]) -> str:
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
        LOGGER.info("Condensing activity data with DSPy")
        
        raw_data_str = json.dumps(activity_data, indent=2)
        condenser = dspy.ChainOfThought(ActivityCondenser)
        condensed = condenser(raw_data=raw_data_str)
        
        LOGGER.info("Generating report sections")
        
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
            LOGGER.info(f"Generating section: {section}")
            result = writer(facts=condensed.condensed_facts, section_name=section)
            report_parts.append(f"\n## {section}\n")
            report_parts.append(result.markdown_output)
        
        full_report = "\n".join(report_parts)
        
        LOGGER.info(f"Report generated successfully ({len(full_report)} characters)")
        
        return full_report

