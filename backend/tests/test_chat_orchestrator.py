"""Unit tests for chat orchestrator service."""

from __future__ import annotations

import json
from types import SimpleNamespace
from typing import Any, Dict, List

import pytest

from core import override_settings, reset_settings
from models.chat_session import ChatTurn
from services import chat_orchestrator
from services.chat_orchestrator import ChatOrchestrator


@pytest.fixture(autouse=True)
def _reset_settings() -> None:
    """Ensure settings overrides do not leak between tests."""
    yield
    reset_settings()


class _DummyContext:
    def __enter__(self) -> "_DummyContext":
        return self

    def __exit__(self, exc_type, exc, tb) -> bool:
        return False


class _FakeConvexClient:
    def __init__(self, _: str) -> None:
        self.calls: List[tuple[str, Dict[str, Any]]] = []

    def query(self, name: str, payload: Dict[str, Any]) -> list[dict[str, Any]]:
        self.calls.append((name, payload))
        if name == "crimeReports:list":
            return [
                {
                    "_id": "report1",
                    "createdAt": 200,
                    "description": "Attempted robbery near Half Way Tree.",
                    "offenseType": "Robbery",
                }
            ]
        if name == "criminals:list":
            return [
                {
                    "_id": "criminal1",
                    "name": "Devon Miller",
                    "primaryCrime": "Robbery",
                    "status": "wanted",
                }
            ]
        return []


def test_chat_orchestrator_requires_history() -> None:
    override_settings(openrouter_api_key="test-key", convex_deployment_url="https://convex.local")
    orchestrator = ChatOrchestrator()
    with pytest.raises(ValueError):
        orchestrator.respond([])


def test_chat_orchestrator_fetches_context_and_generates_reply(monkeypatch: pytest.MonkeyPatch) -> None:
    override_settings(openrouter_api_key="test-key", convex_deployment_url="https://convex.local")
    orchestrator = ChatOrchestrator()

    monkeypatch.setattr(chat_orchestrator, "ConvexClient", _FakeConvexClient)
    monkeypatch.setattr(chat_orchestrator, "dspy", SimpleNamespace(
        context=lambda **_: _DummyContext(),
        ChainOfThought=lambda signature: lambda **kwargs: SimpleNamespace(
            reply="Here is the latest activity summary."
        ),
        LM=chat_orchestrator.dspy.LM,  # preserve constructor for completeness
    ))
    monkeypatch.setattr(ChatOrchestrator, "_ensure_lm", lambda self: object())

    history = [ChatTurn(role="user", content="Can you update me on the crime feed and any wanted criminals?")]
    reply = orchestrator.respond(history)

    assert reply.text == "Here is the latest activity summary."
    assert any(ref["type"] == "feed" for ref in reply.references)
    assert any(ref["type"] == "criminals" for ref in reply.references)
    context_json = json.dumps(reply.references, default=str)
    assert "report1" in context_json
    assert "criminal1" in context_json
