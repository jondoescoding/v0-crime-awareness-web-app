"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Search, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

// Mock data - in a real app, this would come from a database
const criminals = [
  {
    id: "1",
    name: "John Doe",
    crime: "Armed Robbery",
    image: "/placeholder.svg?height=80&width=80",
    location: "Downtown District",
  },
  {
    id: "2",
    name: "Jane Smith",
    crime: "Fraud",
    image: "/placeholder.svg?height=80&width=80",
    location: "North Side",
  },
  {
    id: "3",
    name: "Mike Johnson",
    crime: "Drug Trafficking",
    image: "/placeholder.svg?height=80&width=80",
    location: "East End",
  },
  {
    id: "4",
    name: "Sarah Williams",
    crime: "Assault",
    image: "/placeholder.svg?height=80&width=80",
    location: "West Side",
  },
]

interface CriminalSelectorProps {
  selectedId: string | null
  onSelect: (id: string) => void
}

export function CriminalSelector({ selectedId, onSelect }: CriminalSelectorProps) {
  const [search, setSearch] = useState("")

  const filteredCriminals = criminals.filter(
    (criminal) =>
      criminal.name.toLowerCase().includes(search.toLowerCase()) ||
      criminal.crime.toLowerCase().includes(search.toLowerCase()) ||
      criminal.location.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, crime, or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid gap-3 max-h-96 overflow-y-auto">
        {filteredCriminals.map((criminal) => (
          <Card
            key={criminal.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-depth-md",
              selectedId === criminal.id ? "border-primary shadow-depth-sm" : "hover:border-accent",
            )}
            onClick={() => onSelect(criminal.id)}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <img
                src={criminal.image || "/placeholder.svg"}
                alt={criminal.name}
                className="h-20 w-20 rounded-md object-cover"
              />
              <div className="flex-1 space-y-1">
                <h3 className="font-semibold">{criminal.name}</h3>
                <p className="text-sm text-muted-foreground">{criminal.crime}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {criminal.location}
                </div>
              </div>
              {selectedId === criminal.id && (
                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCriminals.length === 0 && (
        <div className="py-8 text-center text-sm text-muted-foreground">No criminals found matching your search</div>
      )}
    </div>
  )
}
