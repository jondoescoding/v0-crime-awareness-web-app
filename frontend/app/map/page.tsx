"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, AlertTriangle, Calendar, Filter } from "lucide-react"

type CrimeReport = {
  _id: string
  offenseType: string
  cityState: string
  createdAt: number
  status: string
  locationLat?: number
  locationLng?: number
  description: string
}

export default function MapPage() {
  const [filter, setFilter] = useState<"all" | "active" | "investigating" | "resolved">("all")
  const [selectedCrime, setSelectedCrime] = useState<CrimeReport | null>(null)
  
  const reports = useQuery(api.crimeReports.list, { 
    status: filter === "all" ? undefined : filter 
  })

  // Filter only reports with location data for the map
  const crimeData = reports
    ?.filter((report) => report.locationLat && report.locationLng)
    .map((report) => ({
      _id: report._id,
      offenseType: report.offenseType,
      cityState: report.cityState,
      createdAt: report.createdAt,
      status: report.status,
      locationLat: report.locationLat,
      locationLng: report.locationLng,
      description: report.description,
    })) || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "destructive"
      case "investigating":
        return "default"
      case "resolved":
        return "secondary"
      default:
        return "default"
    }
  }

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-destructive"
      case "investigating":
        return "bg-yellow-500"
      case "resolved":
        return "bg-blue-500"
      default:
        return "bg-muted"
    }
  }

  if (reports === undefined) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center">Loading crime map...</div>
      </div>
    )
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
                      type, status, and details when clicked.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-4 pt-4">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-destructive" />
                      <span className="text-xs text-muted-foreground">Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-yellow-500" />
                      <span className="text-xs text-muted-foreground">Investigating</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-blue-500" />
                      <span className="text-xs text-muted-foreground">Resolved</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Simulated map markers */}
              <div className="absolute inset-0 pointer-events-none">
                {crimeData.map((crime, index) => (
                  <div
                    key={crime._id}
                    className="absolute pointer-events-auto cursor-pointer"
                    style={{
                      left: `${20 + (index % 4) * 20}%`,
                      top: `${20 + Math.floor(index / 4) * 25}%`,
                    }}
                    onClick={() => setSelectedCrime(crime)}
                  >
                    <div
                      className={`h-4 w-4 rounded-full ${getStatusDotColor(crime.status)} animate-pulse shadow-depth-md`}
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
                  <TabsTrigger value="active">Active</TabsTrigger>
                </TabsList>
                <TabsList className="grid w-full grid-cols-2 mt-2">
                  <TabsTrigger value="investigating">Investigating</TabsTrigger>
                  <TabsTrigger value="resolved">Resolved</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="shadow-depth-sm">
            <CardHeader>
              <CardTitle>Recent Incidents</CardTitle>
              <CardDescription>{crimeData.length} incidents found</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
              {crimeData.map((crime) => (
                <Card
                  key={crime._id}
                  className={`cursor-pointer transition-all hover:shadow-depth-md ${
                    selectedCrime?._id === crime._id ? "border-primary shadow-depth-sm" : ""
                  }`}
                  onClick={() => setSelectedCrime(crime)}
                >
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm">{crime.offenseType}</h4>
                      <Badge variant={getStatusColor(crime.status)} className="text-xs">
                        {crime.status}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" />
                        <span>{crime.cityState}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(crime.createdAt).toLocaleDateString()}</span>
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
                  <h4 className="font-semibold mb-1">{selectedCrime.offenseType}</h4>
                  <Badge variant={getStatusColor(selectedCrime.status)}>{selectedCrime.status} status</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <span>{selectedCrime.cityState}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <span>{new Date(selectedCrime.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {selectedCrime.description.substring(0, 100)}
                      {selectedCrime.description.length > 100 ? "..." : ""}
                    </span>
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
