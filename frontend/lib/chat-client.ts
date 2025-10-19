import type { ChatReference, ChatRole } from "@/lib/chat-history"

export interface ChatTurnPayload {
  role: ChatRole
  content: string
}

export interface ChatReplyPayload {
  text: string
  references: ChatReference[]
}

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"

export async function sendChatMessage(history: ChatTurnPayload[]): Promise<ChatReplyPayload> {
  const response = await fetch(`${API_BASE}/chat/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ history }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Chat request failed (${response.status}): ${errorText || response.statusText}`,
    )
  }

  return (await response.json()) as ChatReplyPayload
}
