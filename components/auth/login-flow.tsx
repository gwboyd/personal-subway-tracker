"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import PhoneInput from "@/components/auth/phone-input"
import NameInput from "@/components/auth/name-input"
import StationSelector from "@/components/auth/station-selector"
import { getUserFromLocalStorage, getUserStations } from "@/lib/supabase"
import { debugStationData } from "@/lib/debug-stations"

interface LoginFlowProps {
  onComplete: () => void
  onGuestMode: () => void
}

type Step = "phone" | "name" | "stations"

export default function LoginFlow({ onComplete, onGuestMode }: LoginFlowProps) {
  const [step, setStep] = useState<Step>("phone")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [userId, setUserId] = useState("")
  const [userStations, setUserStations] = useState<string[]>([])

  useEffect(() => {
    // Debug station data
    debugStationData()

    // Check if user is already logged in
    const checkLocalStorage = () => {
      const user = getUserFromLocalStorage()
      if (user) {
        onComplete()
      }
    }

    checkLocalStorage()
  }, [onComplete])

  const handleExistingUser = async (phone: string, id: string) => {
    setPhoneNumber(phone)
    setUserId(id)

    // Fetch user's saved stations
    const stations = await getUserStations(id)
    setUserStations(stations)

    // Skip name step for existing users
    setStep("stations")
  }

  const handleNewUser = (phone: string) => {
    setPhoneNumber(phone)
    setStep("name")
  }

  const handleNameComplete = (id: string) => {
    setUserId(id)
    setStep("stations")
  }

  const getStepTitle = () => {
    switch (step) {
      case "phone":
        return "Welcome to NYC Subway Tracker"
      case "name":
        return "Tell Us Your Name"
      case "stations":
        return "Select Your Stations"
      default:
        return ""
    }
  }

  const getStepDescription = () => {
    switch (step) {
      case "phone":
        return "Enter your phone number to begin picking your stations"
      case "name":
        return "Please enter your first and last name"
      case "stations":
        return "Choose the subway stations you want to track"
      default:
        return ""
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{getStepTitle()}</CardTitle>
        <CardDescription>{getStepDescription()}</CardDescription>
      </CardHeader>
      <CardContent>
        {step === "phone" && (
          <PhoneInput 
            onExistingUser={handleExistingUser} 
            onNewUser={handleNewUser} 
            onGuestMode={onGuestMode}
          />
        )}

        {step === "name" && (
          <NameInput phoneNumber={phoneNumber} onComplete={handleNameComplete} onBack={() => setStep("phone")} />
        )}

        {step === "stations" && (
          <StationSelector
            userId={userId}
            phoneNumber={phoneNumber}
            initialStations={userStations}
            onComplete={onComplete}
            onBack={() => (step === "stations" && userId ? setStep("phone") : null)}
          />
        )}
      </CardContent>
    </Card>
  )
}
