export type ChatRole = "user" | "assistant"

export interface ChatReference {
  type: string
  items: unknown[]
}

export interface StoredChatMessage {
  role: ChatRole
  content: string
  timestamp: number
  references?: ChatReference[]
}

const STORAGE_KEY = "crime-awareness-chat-history-v1"
const HISTORY_LIMIT = 20

export function loadChatHistory(): StoredChatMessage[] {
  if (typeof window === "undefined") {
    return []
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isStoredChatMessage)
  } catch {
    return []
  }
}

export function persistChatHistory(messages: StoredChatMessage[]): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    const trimmed = messages.slice(-HISTORY_LIMIT)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch {
    // Ignore storage errors (e.g., quota exceeded)
  }
}

export function clearChatHistory(): void {
  if (typeof window === "undefined") {
    return
  }
  window.localStorage.removeItem(STORAGE_KEY)
}

function isStoredChatMessage(value: unknown): value is StoredChatMessage {
  if (!value || typeof value !== "object") return false
  const candidate = value as Partial<StoredChatMessage>
  return (
    (candidate.role === "user" || candidate.role === "assistant") &&
    typeof candidate.content === "string" &&
    typeof candidate.timestamp === "number"
  )
}
