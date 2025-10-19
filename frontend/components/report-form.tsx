"use client"

import type React from "react"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CriminalSelector } from "@/components/criminal-selector"
import { FileUpload } from "@/components/file-upload"
import { AlertCircle } from "lucide-react"
import type { Id } from "@/convex/_generated/dataModel"

const offenseTypes = [
  "Abduction",
  "Abscond Bail",
  "Aggravated Assault",
  "Aiding and Abetting",
  "Arson",
  "Bank Fraud",
  "Breach of Condition of Bail",
  "Breach of Excise Duty Act",
  "Breach of the Disaster Risk Management Act",
  "Burglary",
  "Burglary Habitation",
  "Carnal Abuse",
  "Child Abuse",
  "Child in Need of Care & Protection",
  "Child Pornography",
  "Contraband",
  "Corruption",
  "Crime of the Month",
  "Dead Body",
  "Drugs - Cocaine",
  "Drugs - Marijuana",
  "Escapee",
  "Forgery",
  "Fraud",
  "Fraudulent Use of License Plate",
  "Fugitive",
  "Gunmen",
  "Harboring Fugitive",
  "Homicide",
  "House Breaking",
  "Human Trafficking",
  "Illegal Activities",
  "Illegal Firearm/Ammo",
  "Illegal Gambling",
  "Illegal Immigrant",
  "Illegal Sale of Petrol",
  "Illicit Goods",
  "Incest",
  "Kidnapping",
  "Larceny",
  "Lottery Scamming",
  "Missing Person",
  "MOCA Tip Line",
  "Murder",
  "Person of Interest",
  "Planned Murder",
  "Praedial Larceny",
  "Query",
  "Rape",
  "Robbery",
  "Robbery with Aggravation",
  "Sacrilege",
  "Sexual Assault",
  "Shooting with Intent",
  "Stolen Motor Vehicle",
  "Stolen Property",
  "Suspicious Activities",
  "Suspicious Person",
  "Terrorism",
  "Theft",
  "Threat",
  "Uncustomed Goods",
  "Unlawful Discharge of Firearm",
  "Wanted Person",
  "Warrant",
  "Other",
]

const hearAboutOptions = [
  "Facebook",
  "Twitter",
  "Internet",
  "TV",
  "Radio",
  "Newspaper",
  "Flyer",
  "Word of Mouth",
  "Public Service Announcement",
  "Sign/Billboard",
  "Instagram",
  "Flyer/Poster",
  "Public Bus Advert.",
  "Movie Theater Advert.",
  "Law enforcement",
  "Kiosk",
  "Other",
]

const additionalInfoOptions = [
  "School Related & Bullying",
  "Wanted/Fugitive",
  "Suspect",
  "Vehicle",
  "Drugs",
  "Abuse",
  "Weapons",
]

export function ReportForm() {
  const [reportType, setReportType] = useState<"existing" | "new">("new")
  const [selectedCriminal, setSelectedCriminal] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    description: "",
    offenseType: "",
    address: "",
    county: "",
    city: "",
    intersection: "",
    neighborhood: "",
    directions: "",
    hearAbout: "",
    newsLinks: "",
    additionalInfo: [] as string[],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [files, setFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createReport = useMutation(api.crimeReports.create)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (reportType === "existing" && !selectedCriminal) {
      newErrors.criminal = "Please select a criminal from the list"
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required (Who, What, When, Where, How)"
    }

    if (!formData.offenseType) {
      newErrors.offenseType = "Offense type is required"
    }

    if (!formData.city.trim()) {
      newErrors.city = "City/State is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Parse additional info checkboxes
      const schoolRelated = formData.additionalInfo.includes("School Related & Bullying")
      const wantedFugitive = formData.additionalInfo.includes("Wanted/Fugitive")
      const drugsInvolved = formData.additionalInfo.includes("Drugs")
      const abuseInvolved = formData.additionalInfo.includes("Abuse")
      const weaponsInvolved = formData.additionalInfo.includes("Weapons")

      const suspectInfo = formData.additionalInfo.includes("Suspect") ? "Suspect information provided" : undefined
      const vehicleInfo = formData.additionalInfo.includes("Vehicle") ? "Vehicle information provided" : undefined

      // Create the report
      await createReport({
        reportType: reportType === "existing" ? "existing_criminal" : "new_crime",
        criminalId: selectedCriminal ? (selectedCriminal as Id<"criminals">) : undefined,
        description: formData.description,
        offenseType: formData.offenseType,
        incidentAddress: formData.address || undefined,
        county: formData.county || undefined,
        cityState: formData.city,
        nearestIntersection: formData.intersection || undefined,
        neighborhood: formData.neighborhood || undefined,
        directionsToLocation: formData.directions || undefined,
        howHeardProgram: formData.hearAbout || undefined,
        newsStoryLinks: formData.newsLinks || undefined,
        additionalInfo: formData.additionalInfo.join(", ") || undefined,
        schoolRelated,
        wantedFugitive,
        suspectInfo,
        vehicleInfo,
        drugsInvolved,
        abuseInvolved,
        weaponsInvolved,
        fileUploads: files.map((f) => f.name),
        fileDescriptions: [],
        locationLat: undefined, // TODO: Add geocoding
        locationLng: undefined, // TODO: Add geocoding
      })

      // Reset form
      setFormData({
        description: "",
        offenseType: "",
        address: "",
        county: "",
        city: "",
        intersection: "",
        neighborhood: "",
        directions: "",
        hearAbout: "",
        newsLinks: "",
        additionalInfo: [],
      })
      setSelectedCriminal(null)
      setFiles([])
      setErrors({})

      alert("Report submitted successfully!")
    } catch (error) {
      console.error("Error submitting report:", error)
      alert("Failed to submit report. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="shadow-depth-md">
        <CardHeader>
          <CardTitle>Submit a Report</CardTitle>
          <CardDescription>Choose the type of report you want to submit</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={reportType} onValueChange={(v) => setReportType(v as "existing" | "new")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing">Known Criminal</TabsTrigger>
              <TabsTrigger value="new">New Crime Report</TabsTrigger>
            </TabsList>

            <TabsContent value="existing" className="space-y-4">
              <div className="space-y-2">
                <Label>Select Criminal</Label>
                <CriminalSelector selectedId={selectedCriminal} onSelect={setSelectedCriminal} />
                {errors.criminal && (
                  <p className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {errors.criminal}
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="new" className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Report crimes such as drugs, prostitution, human trafficking, and other criminal activities.
              </p>
            </TabsContent>
          </Tabs>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Include: Who, What, When, Where, and How Do You Know"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={errors.description ? "border-destructive" : ""}
                rows={5}
              />
              {errors.description && (
                <p className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  {errors.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="offenseType">
                Offense Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.offenseType}
                onValueChange={(value) => setFormData({ ...formData, offenseType: value })}
              >
                <SelectTrigger className={errors.offenseType ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select offense type" />
                </SelectTrigger>
                <SelectContent>
                  {offenseTypes.map((offense) => (
                    <SelectItem key={offense} value={offense}>
                      {offense}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.offenseType && (
                <p className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  {errors.offenseType}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="address">Address of Incident</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="county">County</Label>
                <Input
                  id="county"
                  value={formData.county}
                  onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                  placeholder="County name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">
                City, State <span className="text-destructive">*</span>
              </Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="City and state"
                className={errors.city ? "border-destructive" : ""}
              />
              {errors.city && (
                <p className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  {errors.city}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="intersection">Nearest Intersection or Crossing Street</Label>
                <Input
                  id="intersection"
                  value={formData.intersection}
                  onChange={(e) => setFormData({ ...formData, intersection: e.target.value })}
                  placeholder="Intersection"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="neighborhood">Neighborhood or Subdivision</Label>
                <Input
                  id="neighborhood"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  placeholder="Neighborhood"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="directions">Directions to Location</Label>
              <Textarea
                id="directions"
                value={formData.directions}
                onChange={(e) => setFormData({ ...formData, directions: e.target.value })}
                placeholder="Provide detailed directions"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hearAbout">How did you hear about our program?</Label>
              <Select
                value={formData.hearAbout}
                onValueChange={(value) => setFormData({ ...formData, hearAbout: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  {hearAboutOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newsLinks">Links to Online News Stories</Label>
              <Textarea
                id="newsLinks"
                value={formData.newsLinks}
                onChange={(e) => setFormData({ ...formData, newsLinks: e.target.value })}
                placeholder="Copy and paste URLs (one per line)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Additional Information</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {additionalInfoOptions.map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.additionalInfo.includes(option)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            additionalInfo: [...formData.additionalInfo, option],
                          })
                        } else {
                          setFormData({
                            ...formData,
                            additionalInfo: formData.additionalInfo.filter((i) => i !== option),
                          })
                        }
                      }}
                      className="h-4 w-4"
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>File Upload</Label>
              <FileUpload files={files} onFilesChange={setFiles} />
              <p className="text-xs text-muted-foreground">Upload images, videos, audio, or documents (Max 100MB)</p>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full shadow-depth-sm hover:shadow-depth-md transition-shadow" 
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}
