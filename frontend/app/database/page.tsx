"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, MapPin, Calendar, AlertTriangle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Mock criminal database
const criminals = [
  {
    id: "1",
    name: "John Doe",
    alias: "The Shadow",
    crime: "Armed Robbery",
    status: "Wanted",
    image: "/placeholder.svg?height=200&width=200",
    location: "Downtown District",
    lastSeen: "2025-10-15",
    description: "Male, 6'2\", brown hair, blue eyes. Known to frequent downtown area. Considered armed and dangerous.",
    charges: ["Armed Robbery", "Assault", "Theft"],
    reward: "$5,000",
  },
  {
    id: "2",
    name: "Jane Smith",
    alias: "Red Fox",
    crime: "Fraud",
    status: "At Large",
    image: "/placeholder.svg?height=200&width=200",
    location: "North Side",
    lastSeen: "2025-10-12",
    description: "Female, 5'6\", red hair, green eyes. Expert in identity theft and financial fraud.",
    charges: ["Wire Fraud", "Identity Theft", "Money Laundering"],
    reward: "$10,000",
  },
  {
    id: "3",
    name: "Mike Johnson",
    alias: "Big Mike",
    crime: "Drug Trafficking",
    status: "Wanted",
    image: "/placeholder.svg?height=200&width=200",
    location: "East End",
    lastSeen: "2025-10-10",
    description: "Male, 6'0\", bald, brown eyes. Known drug dealer with connections to organized crime.",
    charges: ["Drug Trafficking", "Possession with Intent", "Racketeering"],
    reward: "$15,000",
  },
  {
    id: "4",
    name: "Sarah Williams",
    alias: "Silent Sarah",
    crime: "Assault",
    status: "Wanted",
    image: "/placeholder.svg?height=200&width=200",
    location: "West Side",
    lastSeen: "2025-10-08",
    description: "Female, 5'8\", blonde hair, hazel eyes. History of violent behavior.",
    charges: ["Aggravated Assault", "Battery", "Resisting Arrest"],
    reward: "$3,000",
  },
  {
    id: "5",
    name: "Robert Chen",
    alias: "Bobby C",
    crime: "Burglary",
    status: "At Large",
    image: "/placeholder.svg?height=200&width=200",
    location: "South District",
    lastSeen: "2025-10-05",
    description: "Male, 5'10\", black hair, brown eyes. Specializes in residential burglaries.",
    charges: ["Burglary", "Breaking and Entering", "Theft"],
    reward: "$2,500",
  },
  {
    id: "6",
    name: "Maria Garcia",
    alias: "La Reina",
    crime: "Human Trafficking",
    status: "Wanted",
    image: "/placeholder.svg?height=200&width=200",
    location: "Central Area",
    lastSeen: "2025-10-01",
    description: "Female, 5'4\", dark hair, brown eyes. Leader of trafficking ring.",
    charges: ["Human Trafficking", "Kidnapping", "Organized Crime"],
    reward: "$25,000",
  },
]

export default function DatabasePage() {
  const [search, setSearch] = useState("")
  const [selectedCriminal, setSelectedCriminal] = useState<(typeof criminals)[0] | null>(null)

  const filteredCriminals = criminals.filter(
    (criminal) =>
      criminal.name.toLowerCase().includes(search.toLowerCase()) ||
      criminal.alias.toLowerCase().includes(search.toLowerCase()) ||
      criminal.crime.toLowerCase().includes(search.toLowerCase()) ||
      criminal.location.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-balance text-4xl font-bold tracking-tight">Criminal Database</h1>
        <p className="mt-3 text-pretty text-lg text-muted-foreground leading-relaxed">
          Search our database of wanted criminals. If you have information, please report it.
        </p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, alias, crime, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-12 shadow-depth-sm"
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCriminals.map((criminal) => (
          <Dialog key={criminal.id}>
            <DialogTrigger asChild>
              <Card className="cursor-pointer transition-all hover:shadow-depth-md shadow-depth-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{criminal.name}</CardTitle>
                      <CardDescription className="text-sm">"{criminal.alias}"</CardDescription>
                    </div>
                    <Badge variant={criminal.status === "Wanted" ? "destructive" : "secondary"} className="shrink-0">
                      {criminal.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <img
                    src={criminal.image || "/placeholder.svg"}
                    alt={criminal.name}
                    className="w-full aspect-square object-cover rounded-md"
                  />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <span className="font-medium">{criminal.crime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{criminal.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Last seen: {new Date(criminal.lastSeen).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full bg-transparent" size="sm">
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">{criminal.name}</DialogTitle>
                <DialogDescription>Alias: "{criminal.alias}"</DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="flex items-start gap-6">
                  <img
                    src={criminal.image || "/placeholder.svg"}
                    alt={criminal.name}
                    className="w-48 h-48 object-cover rounded-md shadow-depth-md"
                  />
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="font-semibold mb-1">Status</h3>
                      <Badge variant={criminal.status === "Wanted" ? "destructive" : "secondary"}>
                        {criminal.status}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Reward</h3>
                      <p className="text-2xl font-bold text-primary">{criminal.reward}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Last Known Location</h3>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{criminal.location}</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Last Seen</h3>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(criminal.lastSeen).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{criminal.description}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Charges</h3>
                  <div className="flex flex-wrap gap-2">
                    {criminal.charges.map((charge, index) => (
                      <Badge key={index} variant="outline">
                        {charge}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-destructive mb-1">Warning</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Do not attempt to apprehend this individual. If you have information about their whereabouts,
                        please contact authorities immediately or submit a tip through our reporting system.
                      </p>
                    </div>
                  </div>
                </div>

                <Button className="w-full" size="lg">
                  Report Information
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>

      {filteredCriminals.length === 0 && (
        <Card className="shadow-depth-sm">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No criminals found matching your search</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
