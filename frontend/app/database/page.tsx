"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
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

export default function DatabasePage() {
  const [search, setSearch] = useState("")
  const criminals = useQuery(api.criminals.list, { search: search || undefined })

  if (criminals === undefined) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center">Loading criminal database...</div>
      </div>
    )
  }

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
            placeholder="Search by name, crime, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-12 shadow-depth-sm"
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {criminals.map((criminal) => (
          <Dialog key={criminal._id}>
            <DialogTrigger asChild>
              <Card className="cursor-pointer transition-all hover:shadow-depth-md shadow-depth-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{criminal.name}</CardTitle>
                      <CardDescription className="text-sm">{criminal.primaryCrime}</CardDescription>
                    </div>
                    <Badge variant={criminal.status === "wanted" ? "destructive" : "secondary"} className="shrink-0">
                      {criminal.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <img
                    src={criminal.headshotUrl || "/placeholder.svg"}
                    alt={criminal.name}
                    className="w-full aspect-square object-cover rounded-md"
                  />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <span className="font-medium">{criminal.primaryCrime}</span>
                    </div>
                    {criminal.locationLat && criminal.locationLng && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>Last Known Location</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Added: {new Date(criminal.createdAt).toLocaleDateString()}</span>
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
                <DialogDescription>Status: {criminal.status}</DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="flex items-start gap-6">
                  <img
                    src={criminal.headshotUrl || "/placeholder.svg"}
                    alt={criminal.name}
                    className="w-48 h-48 object-cover rounded-md shadow-depth-md"
                  />
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="font-semibold mb-1">Status</h3>
                      <Badge variant={criminal.status === "wanted" ? "destructive" : "secondary"}>
                        {criminal.status}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Primary Crime</h3>
                      <p className="text-lg font-medium text-destructive">{criminal.primaryCrime}</p>
                    </div>
                    {criminal.locationLat && criminal.locationLng && (
                      <div>
                        <h3 className="font-semibold mb-1">Last Known Location</h3>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {criminal.locationLat.toFixed(4)}, {criminal.locationLng.toFixed(4)}
                          </span>
                        </div>
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold mb-1">Added to Database</h3>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(criminal.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {criminal.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{criminal.description}</p>
                  </div>
                )}

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

      {criminals.length === 0 && (
        <Card className="shadow-depth-sm">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No criminals found matching your search</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
