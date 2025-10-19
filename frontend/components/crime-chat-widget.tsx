"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Loader2, MessageCircle, Send, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { type ChatReference, type StoredChatMessage, clearChatHistory, loadChatHistory, persistChatHistory } from "@/lib/chat-history"
import { sendChatMessage, type ChatTurnPayload } from "@/lib/chat-client"

type ChatMessage = StoredChatMessage

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hello! I can summarize recent crime reports, highlight known criminals, and share safety guidance. What do you need to know?",
  timestamp: Date.now(),
}

export function CrimeChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = loadChatHistory()
    if (saved.length > 0) {
      return saved
    }
    return [GREETING]
  })
  const [draft, setDraft] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    persistChatHistory(messages)
  }, [messages])

  useEffect(() => {
    if (!isOpen) return
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isOpen, isSending])

  const toggleWidget = useCallback(() => {
    setIsOpen((current) => !current)
    setError(null)
  }, [])

  const handleClearHistory = useCallback(() => {
    clearChatHistory()
    const freshGreeting: ChatMessage = { ...GREETING, timestamp: Date.now() }
    setMessages([freshGreeting])
    setError(null)
  }, [])

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim()
      if (!trimmed) {
        return
      }

      const userTurn: ChatMessage = {
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      }

      const historyForRequest = [...messages, userTurn]
      setMessages(historyForRequest)
      setDraft("")
      setError(null)
      setIsSending(true)

      try {
        const reply = await sendChatMessage(convertToPayload(historyForRequest))
        const assistantTurn: ChatMessage = {
          role: "assistant",
          content: reply.text,
          references: reply.references,
          timestamp: Date.now(),
        }
        setMessages((current) => [...current, assistantTurn])
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to reach chat service."
        setError(message)
      } finally {
        setIsSending(false)
      }
    },
    [messages],
  )

  const handleSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault()
      void sendMessage(draft)
    },
    [draft, sendMessage],
  )

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault()
        void sendMessage(draft)
      }
    },
    [draft, sendMessage],
  )

  const hasUnreadAssistantResponse = useMemo(() => {
    const [latest] = messages.slice(-1)
    return latest?.role === "assistant"
  }, [messages])

  return (
    <>
      <button
        type="button"
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isOpen && "pointer-events-none scale-95 opacity-0",
        )}
        onClick={toggleWidget}
        aria-label="Open crime chat"
      >
        <MessageCircle className="h-6 w-6" />
        {hasUnreadAssistantResponse && (
          <span className="absolute -top-1 -right-1 inline-flex h-3 w-3 rounded-full bg-emerald-500" />
        )}
      </button>

      {isOpen && (
        <Card
          className="fixed bottom-20 right-4 z-50 flex h-[600px] w-[360px] flex-col shadow-2xl md:w-[380px] md:h-[min(600px,80vh)]"
        >
          <div
            className="flex items-center justify-between border-b border-border bg-muted/70 px-4 py-3"
          >
            <div>
              <p className="text-sm font-semibold">Crime Awareness Assistant</p>
              <p className="text-xs text-muted-foreground">Here to help with reports and safety insights</p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleClearHistory}
                aria-label="Clear chat history"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={toggleWidget}
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-background px-4 py-4">
            {messages.map((message, index) => (
              <MessageBubble key={`${message.timestamp}-${index}`} message={message} />
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground shadow">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Generating response…
                </div>
              </div>
            )}
            <div ref={scrollAnchorRef} />
          </div>

          {error && (
            <div className="px-4">
              <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="border-t border-border bg-background px-4 py-3">
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about recent incidents or known suspects..."
              className="mb-2 min-h-[72px] resize-none"
              disabled={isSending}
            />
            <div className="flex items-center justify-end gap-2">
              <Button type="submit" disabled={isSending || !draft.trim()} size="sm">
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user"
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[90%] rounded-lg px-3 py-2 text-sm shadow",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
        )}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        {!isUser && message.references && message.references.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.references.map((reference, index) => (
              <ReferenceBlock key={`${reference.type}-${index}`} reference={reference} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ReferenceBlock({ reference }: { reference: ChatReference }) {
  const { type, items } = reference
  const safeItems = Array.isArray(items) ? items : []

  if (!safeItems.length) {
    return null
  }

  if (type === "feed") {
    return (
      <div className="rounded-md border border-border bg-background/60 p-2 text-xs">
        <p className="mb-1 font-semibold uppercase tracking-wide text-[10px] text-muted-foreground">
          Referenced incidents
        </p>
        <ul className="space-y-1">
          {safeItems.map((item, index) => {
            const record = item as Record<string, unknown>
            const offense = typeof record.offenseType === "string" ? record.offenseType : "Crime report"
            const location = typeof record.cityState === "string" ? record.cityState : "Unknown location"
            const createdAt = typeof record.createdAt === "number" ? record.createdAt : undefined
            return (
              <li key={`${offense}-${index}`}>
                <span className="font-medium text-foreground">{offense}</span>
                <span className="block text-[11px] text-muted-foreground">
                  {location} · {createdAt ? formatRelativeTime(createdAt) : "time unknown"}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  if (type === "criminals") {
    return (
      <div className="rounded-md border border-border bg-background/60 p-2 text-xs">
        <p className="mb-1 font-semibold uppercase tracking-wide text-[10px] text-muted-foreground">
          Referenced individuals
        </p>
        <ul className="space-y-1">
          {safeItems.map((item, index) => {
            const record = item as Record<string, unknown>
            const name = typeof record.name === "string" ? record.name : "Unknown name"
            const crime = typeof record.primaryCrime === "string" ? record.primaryCrime : "No crime listed"
            const status = typeof record.status === "string" ? record.status : "status unknown"
            return (
              <li key={`${name}-${index}`}>
                <span className="font-medium text-foreground">{name}</span>
                <span className="block text-[11px] text-muted-foreground">
                  {crime} · {status}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  return (
    <div className="rounded-md border border-border bg-background/60 p-2 text-xs">
      <p className="mb-1 font-semibold uppercase tracking-wide text-[10px] text-muted-foreground">
        {type}
      </p>
      <pre className="whitespace-pre-wrap text-[11px] text-muted-foreground">{JSON.stringify(items, null, 2)}</pre>
    </div>
  )
}

function convertToPayload(messages: ChatMessage[]): ChatTurnPayload[] {
  return messages.map(({ role, content }) => ({ role, content }))
}

function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  if (diffMinutes < 1) return "moments ago"
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}
