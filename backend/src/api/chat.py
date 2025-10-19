"""Chat assistant API route."""

from __future__ import annotations

from typing import Annotated, List

from fastapi import APIRouter, Body, HTTPException, status

from core import get_logger
from models.chat_session import ChatReply, ChatTurn
from services.chat_orchestrator import ChatOrchestrator

LOGGER = get_logger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])
ORCHESTRATOR = ChatOrchestrator()


@router.post("/ask", response_model=ChatReply, status_code=status.HTTP_200_OK)
async def ask_chat(
    history: Annotated[List[ChatTurn], Body(embed=True, alias="history")],
) -> ChatReply:
    """
    Generate assistant reply for the submitted chat history.
    
    **Endpoint:** `POST /chat/ask`
    
    **Request Body:**
    ```json
    {
        "history": [
            {
                "role": "user",
                "content": "What crimes are reported in my area?"
            },
            {
                "role": "assistant",
                "content": "Based on recent data..."
            },
            {
                "role": "user",
                "content": "Tell me more about theft incidents"
            }
        ]
    }
    ```
    
    **Response (200 OK):**
    ```json
    {
        "text": "Here are the theft incidents in your area...",
        "references": [
            {
                "type": "crime_report",
                "id": "12345",
                "location": "Downtown"
            }
        ]
    }
    ```
    
    **Errors:**
    - `400 Bad Request`: Invalid chat history format or empty content
    - `502 Bad Gateway`: AI service unavailable
    """
    try:
        return ORCHESTRATOR.respond(history)
    except ValueError as exc:
        LOGGER.warning("Invalid chat request: %s", exc)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        LOGGER.error("Chat orchestrator failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to generate response at this time.",
        ) from exc
