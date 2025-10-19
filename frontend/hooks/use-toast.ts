"use client"

import { useState, useCallback } from "react"

type ToastVariant = "success" | "error"

interface ToastState {
  title: string
  description?: string
  variant: ToastVariant
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null)

  const showToast = useCallback((state: ToastState) => {
    setToast(state)
    setTimeout(() => setToast(null), 4000)
  }, [])

  return {
    toast,
    showToast,
  }
}

