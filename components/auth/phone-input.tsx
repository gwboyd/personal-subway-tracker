"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getUserByPhone } from "@/lib/supabase"

interface PhoneInputProps {
  onExistingUser: (phoneNumber: string, userId: string) => void
  onNewUser: (phoneNumber: string) => void
}

export default function PhoneInput({ onExistingUser, onNewUser }: PhoneInputProps) {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "")

    // Format as (XXX) XXX-XXXX
    if (digits.length <= 3) {
      return digits
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    } else {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedNumber = formatPhoneNumber(e.target.value)
    setPhoneNumber(formattedNumber)
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    const digitsOnly = phoneNumber.replace(/\D/g, "")
    if (digitsOnly.length !== 10) {
      setError("Please enter a valid 10-digit phone number")
      return
    }

    setIsLoading(true)

    try {
      // Check if user exists in database
      const user = await getUserByPhone(digitsOnly)

      if (user) {
        // Existing user
        onExistingUser(digitsOnly, user.id)
      } else {
        // New user
        onNewUser(digitsOnly)
      }
    } catch (error) {
      console.error("Error checking phone number:", error)
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="(555) 555-5555"
          value={phoneNumber}
          onChange={handlePhoneChange}
          className="text-lg"
          autoComplete="tel"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Checking..." : "Continue"}
      </Button>

      <p className="text-xs text-center text-gray-500 mt-4">
        We'll use your phone number to save your preferences.
        <br />
        No verification code will be sent.
      </p>
    </form>
  )
}

