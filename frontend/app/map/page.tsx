"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, AlertTriangle, Calendar, Filter, Users, FileText, Shield } from "lucide-react"

type CrimeReport = {
  _id: string
  reportType: "existing_criminal" | "new_crime"
  criminalId?: string
  criminalName?: string
  criminalHeadshot?: string
  criminalCrime?: string
  offenseType: string
  incidentAddress?: string
  county?: string
  cityState: string
  nearestIntersection?: string
  neighborhood?: string
  directionsToLocation?: string
  howHeardProgram?: string
  newsStoryLinks?: string
  additionalInfo?: string
  schoolRelated: boolean
  wantedFugitive: boolean
  suspectInfo?: string
  vehicleInfo?: string
  drugsInvolved: boolean
  abuseInvolved: boolean
  weaponsInvolved: boolean
  fileUploads: string[]
  fileDescriptions: string[]
  locationLat?: number
  locationLng?: number
  status: string
  createdAt: number
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
      reportType: report.reportType,
      criminalId: report.criminalId,
      criminalName: report.criminalName,
      criminalHeadshot: report.criminalHeadshot,
      criminalCrime: report.criminalCrime,
      offenseType: report.offenseType,
      incidentAddress: report.incidentAddress,
      county: report.county,
      cityState: report.cityState,
      nearestIntersection: report.nearestIntersection,
      neighborhood: report.neighborhood,
      directionsToLocation: report.directionsToLocation,
      howHeardProgram: report.howHeardProgram,
      newsStoryLinks: report.newsStoryLinks,
      additionalInfo: report.additionalInfo,
      schoolRelated: report.schoolRelated,
      wantedFugitive: report.wantedFugitive,
      suspectInfo: report.suspectInfo,
      vehicleInfo: report.vehicleInfo,
      drugsInvolved: report.drugsInvolved,
      abuseInvolved: report.abuseInvolved,
      weaponsInvolved: report.weaponsInvolved,
      fileUploads: report.fileUploads,
      fileDescriptions: report.fileDescriptions,
      locationLat: report.locationLat,
      locationLng: report.locationLng,
      status: report.status,
      createdAt: report.createdAt,
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

  const getCrimeTypeIcon = (crime: CrimeReport) => {
    if (crime.weaponsInvolved) return Shield
    if (crime.drugsInvolved) return FileText
    if (crime.schoolRelated) return Users
    return AlertTriangle
  }

  const getCrimeTypeColor = (crime: CrimeReport) => {
    if (crime.weaponsInvolved) return "border-red-500 bg-red-50"
    if (crime.drugsInvolved) return "border-orange-500 bg-orange-50"
    if (crime.schoolRelated) return "border-yellow-500 bg-yellow-50"
    if (crime.abuseInvolved) return "border-purple-500 bg-purple-50"
    return "border-gray-500 bg-gray-50"
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

              {/* Real map markers with crime data */}
              <div className="absolute inset-0 pointer-events-none">
                {crimeData.map((crime, index) => {
                  const CrimeIcon = getCrimeTypeIcon(crime);
                  const crimeColor = getCrimeTypeColor(crime);
                  
                  return (
                    <div
                      key={crime._id}
                      className="absolute pointer-events-auto cursor-pointer"
                      style={{
                        left: `${20 + (index % 4) * 20}%`,
                        top: `${20 + Math.floor(index / 4) * 25}%`,
                      }}
                      onClick={() => setSelectedCrime(crime)}
                    >
                      <div className={`p-2 rounded-full border-2 ${crimeColor} shadow-depth-md hover:shadow-depth-lg transition-all`}>
                        <div className="flex items-center gap-1">
                          <CrimeIcon className="h-3 w-3" />
                          <div className={`h-2 w-2 rounded-full ${getStatusDotColor(crime.status)}`} />
                        </div>
                      </div>
                    </div>
                  );
                })}
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
              {crimeData.map((crime) => {
                const CrimeIcon = getCrimeTypeIcon(crime);
                const crimeColor = getCrimeTypeColor(crime);
                
                return (
                  <Card
                    key={crime._id}
                    className={`cursor-pointer transition-all hover:shadow-depth-md ${
                      selectedCrime?._id === crime._id ? "border-primary shadow-depth-sm" : ""
                    }`}
                    onClick={() => setSelectedCrime(crime)}
                  >
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CrimeIcon className="h-4 w-4" />
                          <h4 className="font-semibold text-sm">{crime.offenseType}</h4>
                        </div>
                        <Badge variant={getStatusColor(crime.status)} className="text-xs">
                          {crime.status}
                        </Badge>
                      </div>
                      
                      {/* Show criminal info if available */}
                      {crime.criminalName && (
                        <div className="text-xs text-blue-600 font-medium">
                          Criminal: {crime.criminalName}
                        </div>
                      )}
                      
                      {/* Show crime flags */}
                      <div className="flex flex-wrap gap-1">
                        {crime.weaponsInvolved && <Badge variant="destructive" className="text-xs">Weapons</Badge>}
                        {crime.drugsInvolved && <Badge variant="secondary" className="text-xs">Drugs</Badge>}
                        {crime.schoolRelated && <Badge variant="outline" className="text-xs">School</Badge>}
                        {crime.abuseInvolved && <Badge variant="outline" className="text-xs">Abuse</Badge>}
                        {crime.wantedFugitive && <Badge variant="destructive" className="text-xs">Fugitive</Badge>}
                      </div>
                      
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3" />
                          <span>{crime.incidentAddress || crime.cityState}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(crime.createdAt).toLocaleDateString()}</span>
                        </div>
                        {crime.fileUploads.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <FileText className="h-3 w-3" />
                            <span>{crime.fileUploads.length} files</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </CardContent>
          </Card>

          {selectedCrime && (
            <Card className="shadow-depth-md border-primary">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {(() => {
                    const CrimeIcon = getCrimeTypeIcon(selectedCrime);
                    return <CrimeIcon className="h-5 w-5" />;
                  })()}
                  Selected Incident
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-1">{selectedCrime.offenseType}</h4>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={getStatusColor(selectedCrime.status)}>{selectedCrime.status} status</Badge>
                    <Badge variant="outline">{selectedCrime.reportType.replace('_', ' ')}</Badge>
                  </div>
                </div>

                {/* Criminal Information */}
                {selectedCrime.criminalName && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h5 className="font-medium text-blue-900 mb-1">Criminal Information</h5>
                    <p className="text-sm text-blue-700">{selectedCrime.criminalName}</p>
                    {selectedCrime.criminalCrime && (
                      <p className="text-xs text-blue-600">Crime: {selectedCrime.criminalCrime}</p>
                    )}
                  </div>
                )}

                {/* Crime Flags */}
                <div className="flex flex-wrap gap-1">
                  {selectedCrime.weaponsInvolved && <Badge variant="destructive" className="text-xs">Weapons</Badge>}
                  {selectedCrime.drugsInvolved && <Badge variant="secondary" className="text-xs">Drugs</Badge>}
                  {selectedCrime.schoolRelated && <Badge variant="outline" className="text-xs">School Related</Badge>}
                  {selectedCrime.abuseInvolved && <Badge variant="outline" className="text-xs">Abuse</Badge>}
                  {selectedCrime.wantedFugitive && <Badge variant="destructive" className="text-xs">Wanted Fugitive</Badge>}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <div>{selectedCrime.incidentAddress || selectedCrime.cityState}</div>
                      {selectedCrime.neighborhood && (
                        <div className="text-xs text-muted-foreground">Neighborhood: {selectedCrime.neighborhood}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <span>{new Date(selectedCrime.createdAt).toLocaleDateString()}</span>
                  </div>
                  {selectedCrime.fileUploads.length > 0 && (
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <span>{selectedCrime.fileUploads.length} evidence files</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {selectedCrime.description.substring(0, 150)}
                      {selectedCrime.description.length > 150 ? "..." : ""}
                    </span>
                  </div>
                </div>

                {/* Additional Information */}
                {selectedCrime.suspectInfo && (
                  <div className="p-2 bg-yellow-50 rounded text-xs">
                    <strong>Suspect Info:</strong> {selectedCrime.suspectInfo}
                  </div>
                )}
                
                {selectedCrime.vehicleInfo && (
                  <div className="p-2 bg-green-50 rounded text-xs">
                    <strong>Vehicle Info:</strong> {selectedCrime.vehicleInfo}
                  </div>
                )}

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
