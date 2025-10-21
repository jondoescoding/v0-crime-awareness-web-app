"use client"

import { useState, useEffect } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Clock, AlertTriangle, CheckCircle, User, Car, Shield, Calendar, Link as LinkIcon, Filter, Loader2, FileText } from "lucide-react"
import type { Id } from "@/convex/_generated/dataModel"
import { useToast } from "@/hooks/use-toast"

const jamaicanParishes = [
  "Clarendon",
  "Hanover",
  "Kingston",
  "Manchester",
  "Portland",
  "Saint Andrew",
  "Saint Ann",
  "Saint Catherine",
  "Saint Elizabeth",
  "Saint James",
  "Saint Mary",
  "Saint Thomas",
  "Trelawny",
  "Westmoreland",
]

type Report = {
  _id: Id<"crimeReports">
  _creationTime: number
  reportType: "existing_criminal" | "new_crime"
  criminalId?: Id<"criminals">
  criminalName?: string
  criminalHeadshot?: string
  criminalCrime?: string
  description: string
  offenseType: string
  incidentAddress?: string
  parish?: string
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
}

export default function FeedPage() {
  const [selectedParish, setSelectedParish] = useState<string | undefined>(undefined)
  const [showFilters, setShowFilters] = useState(false)
  const reports = useQuery(api.crimeReports.list, { 
    status: undefined,
    parish: selectedParish 
  })
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const { toast } = useToast()

  // Keep showing the last results while new data loads so only the activity list updates
  const [lastReports, setLastReports] = useState<Array<Report> | null>(null)
  useEffect(() => {
    if (reports) setLastReports(reports)
  }, [reports])
  const isLoading = reports === undefined
  const isInitialLoading = isLoading && lastReports === null
  const isUpdating = isLoading && lastReports !== null
  const displayedReports = (reports ?? lastReports ?? []) as Array<Report>

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

  const getTypeIcon = (reportType: "existing_criminal" | "new_crime") => {
    return reportType === "existing_criminal" ? CheckCircle : AlertTriangle
  }

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now()
    const diffInMinutes = Math.floor((now - timestamp) / (1000 * 60))

    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const formatFullDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-US", {
      dateStyle: "long",
      timeStyle: "short",
    })
  }

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true)
    try {
      const response = await fetch("http://localhost:8000/reports/daily", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to generate report")
      }

      toast({
        title: "Report Generated",
        description: "24-hour crime intelligence report has been sent to all recipients.",
      })
    } catch (error) {
      console.error("Error generating report:", error)
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingReport(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-balance text-4xl font-bold tracking-tight">Activity Feed</h1>
            <p className="mt-3 text-pretty text-lg text-muted-foreground leading-relaxed">
              Real-time updates on criminal activity and investigations in your area
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <Button
              variant={showFilters ? "secondary" : "outline"}
              onClick={() => setShowFilters((value) => !value)}
              className="sm:w-auto"
            >
              <Filter className="mr-2 h-4 w-4" />
              {showFilters ? "Hide filters" : "Advanced filters"}
            </Button>
            {/* HIDDEN: Generate 24h Report Button - Code preserved for future use */}
            {false && (
              <Button 
                onClick={handleGenerateReport} 
                disabled={isGeneratingReport}
                className="shrink-0"
                size="lg"
              >
                {isGeneratingReport ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate 24h Report
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Section */}
      {showFilters && (
        <Card className="mb-6 shadow-depth-sm">
          <CardContent className="pt-0">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex items-center gap-2 text-sm font-medium shrink-0">
                <Filter className="h-4 w-4" />
                <span>Filter by Parish</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <Select
                  value={selectedParish}
                  onValueChange={(value) => setSelectedParish(value)}
                >
                  <SelectTrigger className="w-[240px]">
                    <SelectValue placeholder="All Parishes" />
                  </SelectTrigger>
                  <SelectContent>
                    {jamaicanParishes.map((parish) => (
                      <SelectItem key={parish} value={parish}>
                        {parish}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedParish && (
                  <>
                    <Badge variant="secondary" className="rounded-sm">
                      {selectedParish}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedParish(undefined)}>
                      Clear
                    </Button>
                  </>
                )}
                {isUpdating && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Updating
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isInitialLoading ? (
        <div className="space-y-4">
          {[0,1,2].map((i) => (
            <Card key={i} className="shadow-depth-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1 h-5 w-5 rounded bg-muted animate-pulse" />
                    <div className="flex-1 min-w-0">
                      <div className="h-5 w-48 rounded bg-muted animate-pulse mb-2" />
                      <div className="h-3 w-full rounded bg-muted animate-pulse" />
                    </div>
                  </div>
                  <div className="h-5 w-20 rounded bg-muted animate-pulse" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-3 w-40 rounded bg-muted animate-pulse" />
                <div className="h-9 w-full rounded bg-muted animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
        {displayedReports.map((report) => {
          const TypeIcon = getTypeIcon(report.reportType)
          return (
            <Card key={report._id} className="shadow-depth-sm hover:shadow-depth-md transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1 text-destructive">
                      <TypeIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg mb-1">
                        {report.reportType === "existing_criminal" && report.criminalName
                          ? `${report.offenseType} - ${report.criminalName}`
                          : report.offenseType}
                      </CardTitle>
                      <CardDescription className="text-sm leading-relaxed">
                        {report.description.substring(0, 150)}
                        {report.description.length > 150 ? "..." : ""}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={getStatusColor(report.status)} className="shrink-0">
                    {report.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {report.cityState}
                      {report.parish && `, ${report.parish}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>{formatTimeAgo(report.createdAt)}</span>
                  </div>
                </div>
                <div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full bg-transparent"
                    onClick={() => setSelectedReport(report)}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      )}

      {displayedReports.length === 0 && !isInitialLoading && (
        <Card className="shadow-depth-sm">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No activities found for this filter</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={selectedReport !== null} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedReport && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <DialogTitle className="text-2xl mb-2">
                      {selectedReport.reportType === "existing_criminal" && selectedReport.criminalName
                        ? `${selectedReport.offenseType} - ${selectedReport.criminalName}`
                        : selectedReport.offenseType}
                    </DialogTitle>
                    <DialogDescription className="text-base">
                      Report submitted on {formatFullDate(selectedReport.createdAt)}
                    </DialogDescription>
                  </div>
                  <Badge variant={getStatusColor(selectedReport.status)} className="shrink-0">
                    {selectedReport.status}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Description */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">Description</h3>
                  <p className="text-muted-foreground leading-relaxed">{selectedReport.description}</p>
                </div>

                {/* Location Information */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium">City/State:</span> {selectedReport.cityState}
                    </div>
                    {selectedReport.parish && (
                      <div>
                        <span className="font-medium">Parish:</span> {selectedReport.parish}
                      </div>
                    )}
                    {selectedReport.neighborhood && (
                      <div>
                        <span className="font-medium">Neighborhood:</span> {selectedReport.neighborhood}
                      </div>
                    )}
                    {selectedReport.incidentAddress && (
                      <div>
                        <span className="font-medium">Address:</span> {selectedReport.incidentAddress}
                      </div>
                    )}
                    {selectedReport.nearestIntersection && (
                      <div>
                        <span className="font-medium">Nearest Intersection:</span> {selectedReport.nearestIntersection}
                      </div>
                    )}
                  </div>
                  {selectedReport.directionsToLocation && (
                    <div className="mt-3 p-3 bg-muted rounded-md">
                      <span className="font-medium">Directions:</span> {selectedReport.directionsToLocation}
                    </div>
                  )}
                </div>

                {/* Criminal Information */}
                {selectedReport.reportType === "existing_criminal" && selectedReport.criminalName && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Criminal Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Name:</span> {selectedReport.criminalName}
                      </div>
                      {selectedReport.criminalCrime && (
                        <div>
                          <span className="font-medium">Known Crime:</span> {selectedReport.criminalCrime}
                        </div>
                      )}
                      {selectedReport.wantedFugitive && (
                        <Badge variant="destructive" className="mt-2">Wanted Fugitive</Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Suspect Information */}
                {selectedReport.suspectInfo && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Suspect Information
                    </h3>
                    <p className="text-muted-foreground text-sm">{selectedReport.suspectInfo}</p>
                  </div>
                )}

                {/* Vehicle Information */}
                {selectedReport.vehicleInfo && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                      <Car className="h-5 w-5" />
                      Vehicle Information
                    </h3>
                    <p className="text-muted-foreground text-sm">{selectedReport.vehicleInfo}</p>
                  </div>
                )}

                {/* Crime Details */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Crime Details
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedReport.drugsInvolved && (
                      <Badge variant="outline">Drugs Involved</Badge>
                    )}
                    {selectedReport.weaponsInvolved && (
                      <Badge variant="outline">Weapons Involved</Badge>
                    )}
                    {selectedReport.abuseInvolved && (
                      <Badge variant="outline">Abuse Involved</Badge>
                    )}
                    {selectedReport.schoolRelated && (
                      <Badge variant="outline">School Related</Badge>
                    )}
                  </div>
                </div>

                {/* Additional Information */}
                {selectedReport.additionalInfo && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Additional Information</h3>
                    <p className="text-muted-foreground text-sm">{selectedReport.additionalInfo}</p>
                  </div>
                )}

                {/* News Links */}
                {selectedReport.newsStoryLinks && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                      <LinkIcon className="h-5 w-5" />
                      News Story Links
                    </h3>
                    <div className="text-sm text-muted-foreground break-all">
                      {selectedReport.newsStoryLinks.split(',').map((link, index) => (
                        <a 
                          key={index} 
                          href={link.trim()} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline block mb-1"
                        >
                          {link.trim()}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* How Heard */}
                {selectedReport.howHeardProgram && (
                  <div>
                    <h3 className="font-semibold text-sm mb-1">How They Heard About This</h3>
                    <p className="text-muted-foreground text-sm">{selectedReport.howHeardProgram}</p>
                  </div>
                )}

                {/* File Attachments */}
                {selectedReport.fileUploads.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Attachments</h3>
                    <div className="space-y-2">
                      {selectedReport.fileUploads.map((fileUrl, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                          <span className="text-sm">
                            {selectedReport.fileDescriptions[index] || `Attachment ${index + 1}`}
                          </span>
                          <a 
                            href={fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm ml-auto"
                          >
                            View
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
