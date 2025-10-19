"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, AlertTriangle, Calendar, Filter } from "lucide-react"

// Mock crime data with coordinates
const crimeData = [
  {
    id: "1",
    type: "Armed Robbery",
    location: "Downtown District, 5th Avenue",
    date: "2025-10-18",
    severity: "high",
    lat: 40.7589,
    lng: -73.9851,
    description: "Armed robbery at convenience store",
  },
  {
    id: "2",
    type: "Drug Activity",
    location: "East End, Warehouse Row",
    date: "2025-10-18",
    severity: "high",
    lat: 40.7614,
    lng: -73.9776,
    description: "Suspected drug dealing activity",
  },
  {
    id: "3",
    type: "Vehicle Theft",
    location: "North Side, Shopping Mall",
    date: "2025-10-18",
    severity: "medium",
    lat: 40.7648,
    lng: -73.9808,
    description: "Black sedan stolen from parking lot",
  },
  {
    id: "4",
    type: "Burglary",
    location: "South District, Oak Street",
    date: "2025-10-17",
    severity: "medium",
    lat: 40.7527,
    lng: -73.9772,
    description: "Residential break-in",
  },
  {
    id: "5",
    type: "Assault",
    location: "Central Park",
    date: "2025-10-17",
    severity: "high",
    lat: 40.758,
    lng: -73.9855,
    description: "Physical altercation with injuries",
  },
  {
    id: "6",
    type: "Vandalism",
    location: "West Side, Main Street",
    date: "2025-10-16",
    severity: "low",
    lat: 40.7556,
    lng: -73.9919,
    description: "Property damage to storefront",
  },
  {
    id: "7",
    type: "Fraud",
    location: "Financial District",
    date: "2025-10-16",
    severity: "medium",
    lat: 40.7074,
    lng: -74.0113,
    description: "Identity theft reported",
  },
  {
    id: "8",
    type: "Theft",
    location: "University Area",
    date: "2025-10-15",
    severity: "low",
    lat: 40.7295,
    lng: -73.9965,
    description: "Bicycle stolen from campus",
  },
]

export default function MapPage() {
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all")
  const [selectedCrime, setSelectedCrime] = useState<(typeof crimeData)[0] | null>(null)

  const filteredCrimes = crimeData.filter((crime) => filter === "all" || crime.severity === filter)

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "default"
    }
  }

  const getSeverityDotColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-destructive"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-blue-500"
      default:
        return "bg-muted"
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-balance text-4xl font-bold tracking-tight">Crime Map</h1>
        <p className="mt-3 text-pretty text-lg text-muted-foreground leading-relaxed">
          Interactive map showing recent criminal activity in your area
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Map placeholder */}
        <div className="lg:col-span-2">
          <Card className="shadow-depth-md h-[600px]">
            <CardContent className="p-0 h-full relative">
              {/* Map visualization placeholder */}
              <div className="absolute inset-0 bg-muted/20 rounded-lg flex items-center justify-center">
                <div className="text-center space-y-4 p-8">
                  <MapPin className="h-16 w-16 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Interactive Crime Map</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                      This would display an interactive map with crime locations marked. Each marker would show crime
                      type, severity, and details when clicked.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-4 pt-4">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-destructive" />
                      <span className="text-xs text-muted-foreground">High Severity</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-yellow-500" />
                      <span className="text-xs text-muted-foreground">Medium Severity</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-blue-500" />
                      <span className="text-xs text-muted-foreground">Low Severity</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Simulated map markers */}
              <div className="absolute inset-0 pointer-events-none">
                {filteredCrimes.map((crime, index) => (
                  <div
                    key={crime.id}
                    className="absolute pointer-events-auto cursor-pointer"
                    style={{
                      left: `${20 + (index % 4) * 20}%`,
                      top: `${20 + Math.floor(index / 4) * 25}%`,
                    }}
                    onClick={() => setSelectedCrime(crime)}
                  >
                    <div
                      className={`h-4 w-4 rounded-full ${getSeverityDotColor(crime.severity)} animate-pulse shadow-depth-md`}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar with filters and list */}
        <div className="space-y-6">
          <Card className="shadow-depth-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="high">High</TabsTrigger>
                </TabsList>
                <TabsList className="grid w-full grid-cols-2 mt-2">
                  <TabsTrigger value="medium">Medium</TabsTrigger>
                  <TabsTrigger value="low">Low</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="shadow-depth-sm">
            <CardHeader>
              <CardTitle>Recent Incidents</CardTitle>
              <CardDescription>{filteredCrimes.length} incidents found</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
              {filteredCrimes.map((crime) => (
                <Card
                  key={crime.id}
                  className={`cursor-pointer transition-all hover:shadow-depth-md ${
                    selectedCrime?.id === crime.id ? "border-primary shadow-depth-sm" : ""
                  }`}
                  onClick={() => setSelectedCrime(crime)}
                >
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm">{crime.type}</h4>
                      <Badge variant={getSeverityColor(crime.severity)} className="text-xs">
                        {crime.severity}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" />
                        <span>{crime.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(crime.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          {selectedCrime && (
            <Card className="shadow-depth-md border-primary">
              <CardHeader>
                <CardTitle className="text-lg">Selected Incident</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-1">{selectedCrime.type}</h4>
                  <Badge variant={getSeverityColor(selectedCrime.severity)}>{selectedCrime.severity} severity</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <span>{selectedCrime.location}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <span>{new Date(selectedCrime.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <span className="text-muted-foreground">{selectedCrime.description}</span>
                  </div>
                </div>
                <Button className="w-full" size="sm">
                  Report Related Information
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
