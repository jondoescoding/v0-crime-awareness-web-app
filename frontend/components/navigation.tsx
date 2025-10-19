"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { AlertCircle, Database, Activity, Map, FileText } from "lucide-react"

const navItems = [
  {
    title: "Report Crime",
    href: "/",
    icon: FileText,
  },
  {
    title: "Criminal Database",
    href: "/database",
    icon: Database,
  },
  {
    title: "Activity Feed",
    href: "/feed",
    icon: Activity,
  },
  {
    title: "Crime Map",
    href: "/map",
    icon: Map,
  },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6" />
            <span className="text-lg font-semibold">Crime Watch</span>
          </div>

          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive ? "bg-primary text-primary-foreground shadow-depth-sm" : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.title}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
