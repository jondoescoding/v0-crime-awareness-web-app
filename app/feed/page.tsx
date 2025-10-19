"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Clock, AlertTriangle, CheckCircle, Eye, MessageSquare } from "lucide-react"

// Mock activity feed data
const activities = [
  {
    id: "1",
    type: "report",
    title: "Armed Robbery Reported",
    description: "Suspect fled the scene on foot heading north on Main Street",
    location: "Downtown District, 5th Avenue",
    time: "2025-10-18T14:30:00",
    status: "active",
    priority: "high",
    views: 234,
    comments: 12,
  },
  {
    id: "2",
    type: "update",
    title: "Suspect Apprehended",
    description: "John Doe was arrested in connection with the downtown robbery case",
    location: "Police Station, Central",
    time: "2025-10-18T12:15:00",
    status: "resolved",
    priority: "medium",
    views: 456,
    comments: 28,
  },
  {
    id: "3",
    type: "alert",
    title: "Drug Activity Suspected",
    description: "Multiple reports of suspicious activity near the old warehouse district",
    location: "East End, Warehouse Row",
    time: "2025-10-18T10:45:00",
    status: "investigating",
    priority: "high",
    views: 189,
    comments: 7,
  },
  {
    id: "4",
    type: "report",
    title: "Vehicle Theft",
    description: "Black sedan stolen from parking lot, license plate ABC-1234",
    location: "North Side, Shopping Mall",
    time: "2025-10-18T09:20:00",
    status: "active",
    priority: "medium",
    views: 312,
    comments: 15,
  },
  {
    id: "5",
    type: "update",
    title: "Missing Person Found",
    description: "Sarah Williams has been located safe and returned to family",
    location: "West Side",
    time: "2025-10-17T22:30:00",
    status: "resolved",
    priority: "low",
    views: 678,
    comments: 42,
  },
  {
    id: "6",
    type: "alert",
    title: "Burglary Pattern Identified",
    description: "Series of break-ins reported in residential area over the past week",
    location: "South District, Oak Street",
    time: "2025-10-17T18:00:00",
    status: "investigating",
    priority: "high",
    views: 523,
    comments: 31,
  },
  {
    id: "7",
    type: "report",
    title: "Assault Incident",
    description: "Victim transported to hospital with non-life-threatening injuries",
    location: "Central Park",
    time: "2025-10-17T15:45:00",
    status: "active",
    priority: "high",
    views: 401,
    comments: 19,
  },
  {
    id: "8",
    type: "update",
    title: "Fraud Ring Dismantled",
    description: "Multi-agency operation results in 5 arrests for organized fraud",
    location: "Multiple Locations",
    time: "2025-10-17T11:00:00",
    status: "resolved",
    priority: "medium",
    views: 892,
    comments: 56,
  },
]

export default function FeedPage() {
  const [filter, setFilter] = useState<"all" | "active" | "investigating" | "resolved">("all")

  const filteredActivities = activities.filter((activity) => filter === "all" || activity.status === filter)

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-destructive"
      case "medium":
        return "text-yellow-600 dark:text-yellow-500"
      case "low":
        return "text-muted-foreground"
      default:
        return "text-muted-foreground"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "alert":
        return AlertTriangle
      case "update":
        return CheckCircle
      default:
        return AlertTriangle
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
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
        {filteredActivities.map((activity) => {
          const TypeIcon = getTypeIcon(activity.type)
          return (
            <Card key={activity.id} className="shadow-depth-sm hover:shadow-depth-md transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`mt-1 ${getPriorityColor(activity.priority)}`}>
                      <TypeIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg mb-1">{activity.title}</CardTitle>
                      <CardDescription className="text-sm leading-relaxed">{activity.description}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={getStatusColor(activity.status)} className="shrink-0">
                    {activity.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    <span>{activity.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>{formatTimeAgo(activity.time)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4" />
                    <span>{activity.views} views</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4" />
                    <span>{activity.comments} comments</span>
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

      {filteredActivities.length === 0 && (
        <Card className="shadow-depth-sm">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No activities found for this filter</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
