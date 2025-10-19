"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Clock, AlertTriangle, CheckCircle } from "lucide-react"

export default function FeedPage() {
  const [filter, setFilter] = useState<"all" | "active" | "investigating" | "resolved">("all")
  const reports = useQuery(api.crimeReports.list, { 
    status: filter === "all" ? undefined : filter 
  })

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

  if (reports === undefined) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center">Loading activity feed...</div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-balance text-4xl font-bold tracking-tight">Activity Feed</h1>
        <p className="mt-3 text-pretty text-lg text-muted-foreground leading-relaxed">
          Real-time updates on criminal activity and investigations in your area
        </p>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mb-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="investigating">Investigating</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-4">
        {reports.map((report) => {
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
                    <span>{report.cityState}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>{formatTimeAgo(report.createdAt)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                    View Details
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                    Add Information
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {reports.length === 0 && (
        <Card className="shadow-depth-sm">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No activities found for this filter</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
