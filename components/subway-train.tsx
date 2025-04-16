"use client"

import { useState } from "react"
import { Clock, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Arrival } from "@/lib/mta"

interface SubwayTrainProps {
  arrival: Arrival
}

export default function SubwayTrain({ arrival }: SubwayTrainProps) {
  const [destinations, setDestinations] = useState<Arrival[]>([])
  const [loading, setLoading] = useState(false)

  const handleShowDestinations = async () => {
    setLoading(true)
    try {
      // Fetch destination times from API
      const response = await fetch(`/api/subway?tripId=${arrival.tripId}&line=${arrival.line}`)
      if (!response.ok) {
        throw new Error('Failed to fetch destination times')
      }
      const data = await response.json()
      
      // Process the destinations and convert time strings back to Date objects
      const processedDestinations = (data.destinations || []).map((dest: any) => ({
        ...dest,
        time: new Date(dest.time)
      }))
      
      setDestinations(processedDestinations)
    } catch (error) {
      console.error("Failed to fetch destination times:", error)
    } finally {
      setLoading(false)
    }
  }

  const bgColor = getLineColor(arrival.line)
  const textColor =
    arrival.line === "N" || arrival.line === "Q" || arrival.line === "R" || arrival.line === "W"
      ? "text-black"
      : "text-white"

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-between p-4 h-auto" onClick={handleShowDestinations}>
          <div className="flex items-center flex-grow min-w-0 mr-3">
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full ${bgColor} ${textColor} flex items-center justify-center font-bold mr-3`}
            >
              {arrival.line}
            </div>
            <div className="text-left min-w-0 flex-grow">
              <p className="font-medium">
                {arrival.time.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </p>
              <p className="text-sm text-gray-500 truncate">To: {arrival.destination}</p>
            </div>
          </div>
          <div className="flex items-center flex-shrink-0">
            <div className="flex items-center whitespace-nowrap">
              <Clock className="w-4 h-4 mr-1 text-gray-500" />
              <span className="font-medium">{arrival.minutesAway} min</span>
            </div>
            {arrival.delayed && <AlertTriangle className="w-5 h-5 ml-3 text-red-500" />}
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center">
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full ${bgColor} ${textColor} flex items-center justify-center font-bold mr-2`}
              >
                {arrival.line}
              </div>
              <span className="truncate">
                {arrival.line} Train to {arrival.destination}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          {loading ? (
            <div className="py-8 text-center">
              <p>Loading destinations...</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute top-0 bottom-0 left-4 w-0.5 bg-gray-300"></div>
              {destinations.map((dest, index) => (
                <div key={index} className="flex items-start mb-4 relative pl-10">
                  <div className="absolute left-3 w-3 h-3 rounded-full bg-gray-400 -ml-1.5 mt-2"></div>
                  <div className="flex-1">
                    <p className="font-medium">{dest.stationName}</p>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>{dest.time.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
                      <span className="mx-1">•</span>
                      <span>{dest.minutesAway} min</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

function getLineColor(line: string): string {
  // NYC Subway line colors
  switch (line) {
    case "A":
    case "C":
    case "E":
      return "bg-blue-600" // Blue
    case "B":
    case "D":
    case "F":
    case "M":
      return "bg-orange-500" // Orange
    case "G":
      return "bg-green-500" // Light Green
    case "J":
    case "Z":
      return "bg-amber-800" // Brown
    case "L":
      return "bg-gray-600" // Gray
    case "N":
    case "Q":
    case "R":
    case "W":
      return "bg-yellow-500" // Yellow
    case "1":
    case "2":
    case "3":
      return "bg-red-600" // Red
    case "4":
    case "5":
    case "6":
      return "bg-green-600" // Green
    case "7":
      return "bg-purple-600" // Purple
    case "S":
      return "bg-gray-500" // Gray
    default:
      return "bg-gray-600"
  }
}
