"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Search, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Id } from "@/convex/_generated/dataModel"

interface CriminalSelectorProps {
  selectedId: string | null
  onSelect: (id: string) => void
}

export function CriminalSelector({ selectedId, onSelect }: CriminalSelectorProps) {
  const [search, setSearch] = useState("")
  const criminals = useQuery(api.criminals.list, { search: search || undefined })

  if (criminals === undefined) {
    return <div className="text-sm text-muted-foreground">Loading criminals...</div>
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, crime, or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid gap-3 max-h-96 overflow-y-auto">
        {criminals.map((criminal) => (
          <Card
            key={criminal._id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-depth-md",
              selectedId === criminal._id ? "border-primary shadow-depth-sm" : "hover:border-accent",
            )}
            onClick={() => onSelect(criminal._id)}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <img
                src={criminal.headshotUrl || "/placeholder.svg"}
                alt={criminal.name}
                className="h-20 w-20 rounded-md object-cover"
              />
              <div className="flex-1 space-y-1">
                <h3 className="font-semibold">{criminal.name}</h3>
                <p className="text-sm text-muted-foreground">{criminal.primaryCrime}</p>
                {criminal.locationLat && criminal.locationLng && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>
                      {criminal.locationLat.toFixed(2)}, {criminal.locationLng.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
              {selectedId === criminal._id && (
                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {criminals.length === 0 && (
        <div className="py-8 text-center text-sm text-muted-foreground">No criminals found matching your search</div>
      )}
    </div>
  )
}
