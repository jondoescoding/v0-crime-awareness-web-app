"use client"

import { Alert } from "@/components/ui/alert"

interface ToastProps {
  title: string
  description?: string
  variant?: "success" | "error"
}

export function Toast({ title, description, variant = "success" }: ToastProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm">
      <Alert variant={variant}>
        <p className="font-semibold">{title}</p>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </Alert>
    </div>
  )
}

