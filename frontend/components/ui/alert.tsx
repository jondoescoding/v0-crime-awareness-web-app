"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface AlertProps {
  children: ReactNode
  className?: string
  variant?: "success" | "error"
}

export function Alert({ children, className, variant = "success" }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-md border px-4 py-3 text-sm shadow-sm",
        variant === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-rose-200 bg-rose-50 text-rose-900",
        className,
      )}
    >
      {children}
    </div>
  )
}

