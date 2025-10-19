import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ConvexClientProvider } from "@/components/convex-provider"
import { CrimeChatWidget } from "@/components/crime-chat-widget"
import { Navigation } from "@/components/navigation"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Informa - Community Safety Platform",
  description: "Report and track criminal activity in your community",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <ConvexClientProvider>
          <Navigation />
          <main className="min-h-[calc(100vh-4rem)]">{children}</main>
          <CrimeChatWidget />
          <Analytics />
          <Toaster />
        </ConvexClientProvider>
      </body>
    </html>
  )
}
