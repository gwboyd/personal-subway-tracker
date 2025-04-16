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
      {/* Back button to exit settings */}
      <div className="mb-4">
        <Button variant="outline" onClick={() => router.back()} className="w-full">
          Back
        </Button>
      </div>
      {/* Settings card */}
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Update your preferences</CardDescription>
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

