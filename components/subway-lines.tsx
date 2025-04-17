"use client"

import { useState, useEffect } from "react"
import type { Arrival } from "@/lib/mta"
import SubwayTrain from "./subway-train"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface SubwayLinesProps {
  stationId: string
  direction: "N" | "S"
  lines: string[]
  title: string
  onStationSelect?: (stationId: string, stationName: string) => void
}

export default function SubwayLines({ stationId, direction, lines, title, onStationSelect }: SubwayLinesProps) {
  const [arrivals, setArrivals] = useState<Arrival[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchArrivals = async () => {
    setLoading(true)
    try {
      // Fetch data from API endpoint instead of directly calling getSubwayArrivals
      const response = await fetch(`/api/subway?stationId=${stationId}&direction=${direction}&lines=${lines.join(',')}`)
      if (!response.ok) {
        throw new Error('Failed to fetch arrivals')
      }
      const data = await response.json()
      // Extract arrivals from the response and sort them
      const arrivalsData = data.arrivals || []
      
      // Convert time strings back to Date objects
      const processedArrivals = arrivalsData.map((arrival: any) => ({
        ...arrival,
        time: new Date(arrival.time)
      }))
      
      const sortedArrivals = processedArrivals.sort((a: Arrival, b: Arrival) => a.minutesAway - b.minutesAway)
      setArrivals(sortedArrivals)
    } catch (error) {
      console.error("Error fetching subway arrivals:", error)
      setArrivals([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (stationId && direction && lines.length > 0) {
      fetchArrivals()
    } else {
      setArrivals([])
      setLoading(false)
    }
  }, [stationId, direction, lines])

  const handleRefresh = () => {
    if (!refreshing && stationId && direction && lines.length > 0) {
      setRefreshing(true)
      fetchArrivals()
    }
  }

  // Show loading state
  if (loading && !refreshing) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-full h-16 rounded-md border bg-background p-4 flex items-center justify-between animate-pulse">
              <div className="flex items-center flex-grow min-w-0 mr-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted mr-3" />
                <div className="min-w-0 flex-grow">
                  <div className="h-4 w-16 bg-muted rounded-md mb-2" />
                  <div className="h-3 w-24 bg-muted rounded-md" />
                </div>
              </div>
              <div className="flex items-center flex-shrink-0">
                <div className="h-4 w-14 bg-muted rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold truncate pr-2">{title}</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="flex items-center gap-1 shrink-0"
          aria-label={refreshing ? "Refreshing" : "Refresh"}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </Button>
      </div>

      {refreshing ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-full h-16 rounded-md border bg-background p-4 flex items-center justify-between animate-pulse">
              <div className="flex items-center flex-grow min-w-0 mr-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted mr-3" />
                <div className="min-w-0 flex-grow">
                  <div className="h-4 w-16 bg-muted rounded-md mb-2" />
                  <div className="h-3 w-24 bg-muted rounded-md" />
                </div>
              </div>
              <div className="flex items-center flex-shrink-0">
                <div className="h-4 w-14 bg-muted rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : arrivals.length > 0 ? (
        <div className="space-y-3">
          {arrivals.map((arrival) => (
            <SubwayTrain 
              key={arrival.id} 
              arrival={arrival} 
              onStationSelect={onStationSelect}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-gray-500">No upcoming arrivals found for the selected lines.</p>
        </div>
      )}
    </div>
  )
}
