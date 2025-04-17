"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
// Removed dynamic map imports as map is no longer used
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import StationSelector from "@/components/auth/station-selector"
import { getUserFromLocalStorage, clearUserFromLocalStorage, getUserStations } from "@/lib/supabase"
import SubwayLoading from "@/components/subway-loading"


export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userStations, setUserStations] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUserData = async () => {
      const userData = getUserFromLocalStorage()

      if (!userData) {
        // Redirect to home if not logged in
        router.push("/")
        return
      }

      setUser(userData)

      // Load user's saved stations
      const stations = await getUserStations(userData.id)
      setUserStations(stations)
      setLoading(false)
    }

    loadUserData()
  }, [router])

  const handleLogout = () => {
    clearUserFromLocalStorage()
    router.push("/")
  }

  const handleComplete = () => {
    router.push("/")
  }

  if (loading) {
    return <SubwayLoading />
  }


  return (
    <div className="container max-w-md py-8">
      {/* Settings card with integrated back button */}
      <Card>
        <CardHeader className="relative pb-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()} 
            className="absolute left-4 top-4 p-0 h-8 w-8 rounded-full"
            aria-label="Back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </Button>
          <div className="text-center">
            <CardTitle>Settings</CardTitle>
            <CardDescription>Update your preferences</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Your Information</h3>
            <p className="text-sm text-gray-500">
              Name: {user?.first_name} {user?.last_name}
            </p>
            <p className="text-sm text-gray-500">
              Phone: {user?.phone_number.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3")}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Your Stations</h3>
            <StationSelector
              userId={user?.id}
              phoneNumber={user?.phone_number}
              initialStations={userStations}
              onComplete={handleComplete}
              isSettings={true}
            />
          </div>

          <Button variant="destructive" onClick={handleLogout} className="w-full">
            Log Out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
