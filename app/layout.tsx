import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "NYC Subway Tracker",
  description: "Track personalized NYC subway arrivals in real-time",
  generator: 'Next.js',
  manifest: '/manifest.json',
  icons: {
    icon: '/subway_icon.png',
    apple: '/subway_icon.png'
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}