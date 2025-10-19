"""DSPy powered chat orchestrator for crime awareness assistant."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional

import dspy
from convex import ConvexClient

from core import get_logger, get_settings
from models.chat_session import ChatReply, ChatTurn

LOGGER = get_logger(__name__)


CHAT_INSTRUCTIONS = (
    "You are the Crime Awareness assistant. Answer using the conversation history and "
    "context facts about recent crime reports and known criminals. "
    "If context is empty, rely on general safety knowledge while being clear that data "
    "was not available. Always acknowledge referenced reports or criminals explicitly."
)


class CrimeChatResponder(dspy.Signature):
    """Generate a conversational reply grounded in the supplied context."""

    system_prompt: str = dspy.InputField(desc="Assistant persona, tone, and safety rules.")
    chat_history: str = dspy.InputField(desc="Full conversation history with role markers.")
    context: str = dspy.InputField(desc="Structured facts about reports and criminals.")
    reply: str = dspy.OutputField(desc="Helpful assistant reply grounded in context.")


@dataclass(slots=True)
class _ConvexData:
    feed: list[Dict[str, Any]]
    criminals: list[Dict[str, Any]]


class ChatOrchestrator:
    """Coordinate data aggregation and DSPy response generation."""

    def __init__(self) -> None:
        self._settings = get_settings()
        self._lm: dspy.LM | None = None

    def respond(self, history: list[ChatTurn]) -> ChatReply:
        """Return assistant reply for provided chat history."""
        if not history:
            raise ValueError("Chat history cannot be empty.")

        lm = self._ensure_lm()
        context_bundle, references = self._gather_context(history)
        context_json = json.dumps(
            {
                "recentReports": context_bundle.feed,
                "criminalMatches": context_bundle.criminals,
            },
            ensure_ascii=False,
            indent=2,
        )
        history_text = self._format_history(history)

        LOGGER.debug("Generating chat response with %d context references", len(references))

        with dspy.context(lm=lm):
            responder = dspy.ChainOfThought(CrimeChatResponder)
            result = responder(
                system_prompt=CHAT_INSTRUCTIONS,
                chat_history=history_text,
                context=context_json,
            )

        reply_text = result.reply.strip()
        LOGGER.debug("Chat response generated (%d chars)", len(reply_text))
        return ChatReply(text=reply_text, references=references)

    def _ensure_lm(self) -> dspy.LM:
        """Instantiate and cache the DSPy language model."""
        if self._lm is None:
            if not self._settings.openrouter_api_key:
                raise ValueError("OPENROUTER_API_KEY is not configured")
            self._lm = dspy.LM(
                model="openrouter/google/gemini-2.0-flash-001",
                api_key=self._settings.openrouter_api_key,
                api_base="https://openrouter.ai/api/v1",
                headers={
                    "HTTP-Referer": "https://crime-awareness.local",
                    "X-Title": "Crime Awareness Chat",
                },
            )
        return self._lm

    def _format_history(self, history: Iterable[ChatTurn]) -> str:
        """Render chat history in role-tagged transcript format."""
        transcript: list[str] = []
        for turn in history:
            role = "User" if turn.role == "user" else "Assistant"
            transcript.append(f"{role}: {turn.content}")
        return "\n".join(transcript)

    def _gather_context(self, history: list[ChatTurn]) -> tuple[_ConvexData, list[dict[str, Any]]]:
        """Inspect the latest user turn and pull supporting data from Convex."""
        latest_user = next((turn for turn in reversed(history) if turn.role == "user"), None)
        if latest_user is None:
            LOGGER.warning("No user turn found in history; skipping context lookup.")
            return _ConvexData(feed=[], criminals=[]), []

        keywords = latest_user.content.lower()
        fetch_feed = any(token in keywords for token in ("feed", "report", "crime", "incident"))
        fetch_criminals = any(token in keywords for token in ("criminal", "suspect", "wanted", "gang"))

        convex_data = _ConvexData(feed=[], criminals=[])
        references: list[dict[str, Any]] = []

        if not self._settings.convex_deployment_url:
            LOGGER.debug("Convex deployment URL not configured; skipping data lookups.")
            return convex_data, references

        client = ConvexClient(self._settings.convex_deployment_url)

        if fetch_feed:
            convex_data.feed = self._fetch_recent_reports(client)
            if convex_data.feed:
                references.append({"type": "feed", "items": convex_data.feed})

        if fetch_criminals:
            search_term = self._extract_criminal_search_term(latest_user.content)
            convex_data.criminals = self._fetch_criminals(client, search_term)
            if convex_data.criminals:
                references.append({"type": "criminals", "items": convex_data.criminals})

        return convex_data, references

    def _fetch_recent_reports(self, client: ConvexClient, limit: int = 5) -> list[dict[str, Any]]:
        """Fetch recent crime reports from Convex backend."""
        try:
            reports: list[dict[str, Any]] = client.query("crimeReports:list", {})
        except Exception as exc:  # pragma: no cover - defensive logging
            LOGGER.error("Failed to retrieve crime reports: %s", exc)
            return []
        sorted_reports = sorted(reports, key=lambda r: r.get("createdAt", 0), reverse=True)
        trimmed = sorted_reports[:limit]
        for report in trimmed:
            report.pop("fileUploads", None)
            report.pop("fileDescriptions", None)
        return trimmed

    def _fetch_criminals(self, client: ConvexClient, search_term: str | None) -> list[dict[str, Any]]:
        """Fetch criminal records matching the supplied search term."""
        payload: Dict[str, Any] = {}
        if search_term and search_term.strip():
            payload["search"] = search_term.strip()
        try:
            records: list[dict[str, Any]] = client.query("criminals:list", payload)
        except Exception as exc:  # pragma: no cover - defensive logging
            LOGGER.error("Failed to retrieve criminals: %s", exc)
            return []
        return records[:5]

    def _extract_criminal_search_term(self, message: str) -> str | None:
        """Extract potential criminal name fragment from the user message."""
        pattern = re.compile(
            r"(?:criminal|suspect|wanted(?:\s+person)?|gang\s+member)\s+(?:named\s+)?(?P<name>[A-Za-z][A-Za-z\s'-]{1,60})",
            re.IGNORECASE,
        )
        match = pattern.search(message)
        if match:
            candidate = match.group("name").strip().strip(".,!?")
            return candidate
        return None
