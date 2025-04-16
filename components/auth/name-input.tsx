"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createUser } from "@/lib/supabase"

interface NameInputProps {
  phoneNumber: string
  onComplete: (userId: string) => void
  onBack: () => void
}

export default function NameInput({ phoneNumber, onComplete, onBack }: NameInputProps) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!firstName.trim()) {
      setError("Please enter your first name")
      return
    }

    if (!lastName.trim()) {
      setError("Please enter your last name")
      return
    }

    setIsLoading(true)

    try {
      const user = await createUser(phoneNumber, firstName.trim(), lastName.trim())

      if (user) {
        onComplete(user.id)
      } else {
        setError("Failed to create account. Please try again.")
      }
    } catch (error) {
      console.error("Error creating user:", error)
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="firstName">First Name</Label>
        <Input
          id="firstName"
          type="text"
          placeholder="Enter your first name"
          value={firstName}
          onChange={(e) => {
            setFirstName(e.target.value)
            setError("")
          }}
          className="text-lg"
          autoComplete="given-name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lastName">Last Name</Label>
        <Input
          id="lastName"
          type="text"
          placeholder="Enter your last name"
          value={lastName}
          onChange={(e) => {
            setLastName(e.target.value)
            setError("")
          }}
          className="text-lg"
          autoComplete="family-name"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      <div className="flex space-x-2">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {isLoading ? "Creating..." : "Continue"}
        </Button>
      </div>
    </form>
  )
}

