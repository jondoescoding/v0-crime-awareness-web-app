"""Pydantic models describing chat session payloads."""

from __future__ import annotations

from typing import Any, Dict, Literal

from pydantic import BaseModel, ConfigDict, Field


class ChatTurn(BaseModel):
    """Single conversational turn exchanged with the assistant."""

    model_config = ConfigDict(str_strip_whitespace=True)

    role: Literal["user", "assistant"] = Field(
        ...,
        description="Originator of the message in the chat session.",
    )
    content: str = Field(
        ...,
        min_length=1,
        description="Natural language content associated with the turn.",
    )


class ChatReply(BaseModel):
    """Assistant response payload returned to the frontend chat widget."""

    model_config = ConfigDict(str_strip_whitespace=True)

    text: str = Field(..., description="Assistant response text.")
    references: list[Dict[str, Any]] = Field(
        default_factory=list,
        description="Optional structured references supporting the reply.",
    )
