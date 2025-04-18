"use client"

import { useState } from "react"
import { Clock, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Arrival } from "@/lib/mta"
import { getLineColor, shouldUseBlackText } from "@/lib/line-info"

interface SubwayTrainProps {
  arrival: Arrival
  onStationSelect?: (stationId: string, stationName: string) => void
}

export default function SubwayTrain({ arrival, onStationSelect }: SubwayTrainProps) {
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

  const bgHex = getLineColor(arrival.line)
  const textColorClass = shouldUseBlackText(arrival.line) ? "text-black" : "text-white"

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-between p-4 h-auto" onClick={handleShowDestinations}>
          <div className="flex items-center flex-grow min-w-0 mr-3">
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 ${textColorClass}`}
              style={{ backgroundColor: bgHex }}
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
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold mr-2 ${textColorClass}`}
                style={{ backgroundColor: bgHex }}
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
            <div className="relative py-4">
              <div className="absolute top-0 bottom-0 left-4 w-0.5 bg-gray-300"></div>
              {[1, 2, 3, 4, 5].map((index) => (
                <div key={index} className="flex items-start mb-4 relative pl-10 animate-pulse">
                  <div className="absolute left-3 w-3 h-3 rounded-full bg-muted -ml-1.5 mt-2"></div>
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-muted rounded-md mb-2"></div>
                    <div className="flex items-center">
                      <div className="h-3 w-20 bg-muted rounded-md"></div>
                      <div className="mx-1 h-3 w-3 bg-muted rounded-full"></div>
                      <div className="h-3 w-12 bg-muted rounded-md"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="relative">
              <div className="absolute top-0 bottom-0 left-4 w-0.5 bg-gray-300"></div>
              {destinations.map((dest, index) => (
                <div key={index} className="flex items-start mb-4 relative pl-10">
                  <div className="absolute left-3 w-3 h-3 rounded-full bg-gray-400 -ml-1.5 mt-2"></div>
                  <div className="flex-1">
                    {onStationSelect ? (
                      <Button 
                        variant="link" 
                        className="p-0 h-auto font-medium text-left"
                        onClick={() => {
                          if (dest.stationName && onStationSelect) {
                            onStationSelect(dest.id.split('-')[1], dest.stationName)
                          }
                        }}
                      >
                        {dest.stationName}
                      </Button>
                    ) : (
                      <p className="font-medium">{dest.stationName}</p>
                    )}
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

// Removed local colour switch: centralized in lib/line-info.ts
