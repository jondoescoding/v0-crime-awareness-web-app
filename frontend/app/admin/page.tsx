"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Toast } from "@/components/toast"
import { useToast } from "@/hooks/use-toast"
import { CRIME_OPTIONS } from "@/constants/crime-options"

const demoDefaults = {
  name: "Jonathan White",
  headshotUrl: "",
  primaryCrime: "Robbery with Aggravation",
  description:
    "Armed suspect linked to multiple coordinated robberies targeting high-value transport convoys across the Kingston metropolitan zone. Witnesses note the individual operates with accomplices, remains armed, and avoids zones with heightened police presence.",
  status: "wanted",
}

type FormState = typeof demoDefaults

const createInitialFormState = (): FormState => ({ ...demoDefaults })

export default function AdminPage() {
  const [formState, setFormState] = useState<FormState>(() => createInitialFormState())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const createCriminal = useMutation(api.criminals.create)
  const { toast, showToast } = useToast()

  const validate = () => {
    const nextErrors: Record<string, string> = {}

    if (!formState.name.trim()) {
      nextErrors.name = "Name is required"
    }

    if (!formState.primaryCrime.trim()) {
      nextErrors.primaryCrime = "Primary crime is required"
    }

    if (!formState.headshotUrl.trim()) {
      nextErrors.headshotUrl = "Headshot URL is required"
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!validate()) {
      showToast({
        title: "Validation failed",
        description: "Fix the highlighted fields before submitting",
        variant: "error",
      })
      return
    }

    setIsSubmitting(true)

    try {
      await createCriminal({
        name: formState.name.trim(),
        headshotUrl: formState.headshotUrl.trim(),
        primaryCrime: formState.primaryCrime.trim(),
        description: formState.description.trim() || undefined,
        status: formState.status,
      })

      showToast({
        title: "Criminal added",
        description: `${formState.name} is now in the database`,
        variant: "success",
      })

      setFormState(createInitialFormState())
      setErrors({})
    } catch (error) {
      console.error("Failed to create criminal", error)
      showToast({
        title: "Request failed",
        description: "Convex rejected the mutation. Check browser console for details.",
        variant: "error",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Card className="shadow-depth-md">
        <CardHeader>
          <CardTitle>Rapid Criminal Uploader</CardTitle>
          <CardDescription>
            Pre-filled data for Jonathan White. Adjust any field and submit to push directly to Convex.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formState.name}
                  onChange={(event) => setFormState({ ...formState, name: event.target.value })}
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formState.status}
                  onValueChange={(value) => setFormState({ ...formState, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wanted">wanted</SelectItem>
                    <SelectItem value="arrested">arrested</SelectItem>
                    <SelectItem value="cleared">cleared</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="headshotUrl">Headshot URL</Label>
              <Input
                id="headshotUrl"
                placeholder="https://..."
                value={formState.headshotUrl}
                onChange={(event) => setFormState({ ...formState, headshotUrl: event.target.value })}
                className={errors.headshotUrl ? "border-destructive" : ""}
              />
              {errors.headshotUrl && <p className="text-xs text-destructive">{errors.headshotUrl}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryCrime">Primary Crime</Label>
              <Select
                value={formState.primaryCrime}
                onValueChange={(value) => setFormState({ ...formState, primaryCrime: value })}
              >
                <SelectTrigger className={errors.primaryCrime ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select crime type" />
                </SelectTrigger>
                <SelectContent>
                  {CRIME_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.primaryCrime && <p className="text-xs text-destructive">{errors.primaryCrime}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={5}
                value={formState.description}
                onChange={(event) => setFormState({ ...formState, description: event.target.value })}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Add to Database"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {toast && (
        <Toast title={toast.title} description={toast.description} variant={toast.variant} />
      )}
    </div>
  )
}

