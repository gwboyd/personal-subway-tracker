"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import StationSelector from "@/components/station-selector"
import SubwayLoading from "@/components/subway-loading"
import LoginFlow from "@/components/auth/login-flow"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import { getUserFromLocalStorage, getUserStations } from "@/lib/supabase"

export default function Home() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userStations, setUserStations] = useState<string[]>([])

  useEffect(() => {
    const checkAuth = async () => {
      const user = getUserFromLocalStorage()

      if (user) {
        setIsLoggedIn(true)

        // Load user's saved stations
        const stations = await getUserStations(user.id)
        setUserStations(stations)
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const handleLoginComplete = () => {
    window.location.reload() // Reload to get updated user data
  }

  const navigateToSettings = () => {
    router.push("/settings")
  }

  if (isLoading) {
    return <SubwayLoading />
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <header className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="w-10"></div> {/* Spacer for balance */}
          <h1 className="text-3xl font-bold text-center">NYC Subway ETAs</h1>
          {isLoggedIn && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={navigateToSettings} 
              className="w-10 h-10 flex items-center justify-center"
              aria-label="Settings"
            >
              <Settings className="h-5 w-5" />
            </Button>
          )}
        </div>
        <p className="text-center text-gray-600">Track your trains in real-time</p>
      </header>

      {isLoggedIn ? (
        <Suspense fallback={<SubwayLoading />}>
          <StationSelector userStations={userStations} />
        </Suspense>
      ) : (
        <LoginFlow onComplete={handleLoginComplete} />
      )}
    </main>
  )
}
