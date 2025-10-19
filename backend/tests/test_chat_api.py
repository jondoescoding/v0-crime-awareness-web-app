"""Tests for chat API endpoint."""

from __future__ import annotations

from fastapi.testclient import TestClient

from api import create_app
from models.chat_session import ChatReply, ChatTurn


class _StubOrchestrator:
    def __init__(self, reply: ChatReply, should_raise: bool = False) -> None:
        self._reply = reply
        self._should_raise = should_raise
        self.received_history: list[ChatTurn] | None = None

    def respond(self, history: list[ChatTurn]) -> ChatReply:
        self.received_history = history
        if self._should_raise:
            raise ValueError("Chat history cannot be empty.")
        return self._reply


def test_chat_endpoint_returns_reply(monkeypatch) -> None:
    stub_reply = ChatReply(text="Hello investigator!", references=[{"type": "feed", "items": []}])
    orchestrator = _StubOrchestrator(stub_reply)

    monkeypatch.setattr("api.chat.ORCHESTRATOR", orchestrator)
    client = TestClient(create_app())

    payload = {
        "history": [
            {"role": "user", "content": "Give me a crime update."}
        ]
    }
    response = client.post("/chat/ask", json=payload)

    assert response.status_code == 200
    assert response.json()["text"] == "Hello investigator!"
    assert orchestrator.received_history is not None
    assert orchestrator.received_history[0].role == "user"


def test_chat_endpoint_handles_value_error(monkeypatch) -> None:
    orchestrator = _StubOrchestrator(
        ChatReply(text="", references=[]),
        should_raise=True,
    )
    monkeypatch.setattr("api.chat.ORCHESTRATOR", orchestrator)
    client = TestClient(create_app())

    response = client.post("/chat/ask", json={"history": []})

    assert response.status_code == 400
    assert response.json()["detail"] == "Chat history cannot be empty."
