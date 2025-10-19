import { ReportForm } from "@/components/report-form"

export default function HomePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6  lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-balance text-4xl font-bold tracking-tight">Report Criminal Activity</h1>
        <p className="mt-3 text-pretty text-lg text-muted-foreground leading-relaxed">
          Help keep your community safe by reporting criminal activity. All reports are confidential.
        </p>
      </div>

      <ReportForm />
    </div>
  )
}
