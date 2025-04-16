import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

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
      <body className={inter.className}>{children}</body>
    </html>
  )
}



import './globals.css'