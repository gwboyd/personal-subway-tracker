"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search } from "lucide-react"
import { saveUserStations, saveUserToLocalStorage, getUserByPhone } from "@/lib/supabase"
import stationData from "@/lib/station-data.json"

interface StationSelectorProps {
  userId: string
  phoneNumber: string
  initialStations?: string[]
  onComplete: () => void
  onBack?: () => void
  isSettings?: boolean
}

// Define a simple station type
// Station object including optional typical trains and coordinates
type Station = {
  id: string
  name: string
  borough: string
  routes?: string            // space-separated list of typical trains (from index 16 in JSON)
  latitude?: number          // GTFS latitude (position 11)
  longitude?: number         // GTFS longitude (position 12)
}

// Pre-define popular Manhattan stations (will be enriched with routes)
const POPULAR_MANHATTAN_STATIONS: Station[] = [
  { id: "127", name: "Times Sq-42 St", borough: "Manhattan" },
  { id: "635", name: "14 St-Union Sq", borough: "Manhattan" },
  { id: "631", name: "Grand Central-42 St", borough: "Manhattan" },
  { id: "A32", name: "W 4 St-Wash Sq", borough: "Manhattan" },
  { id: "D18", name: "23 St (6th Ave)", borough: "Manhattan" },
  { id: "R19", name: "23 St (Broadway)", borough: "Manhattan" },
  { id: "634", name: "23 St (Park Ave)", borough: "Manhattan" },
  { id: "A24", name: "59 St-Columbus Circle", borough: "Manhattan" },
  { id: "R16", name: "Times Sq-42 St", borough: "Manhattan" },
  { id: "A27", name: "42 St-Port Authority", borough: "Manhattan" },
  { id: "L01", name: "8 Av", borough: "Manhattan" },
  { id: "A15", name: "125 St", borough: "Manhattan" },
  { id: "120", name: "96 St", borough: "Manhattan" },
  { id: "123", name: "72 St", borough: "Manhattan" },
  { id: "132", name: "14 St", borough: "Manhattan" },
  { id: "137", name: "Chambers St", borough: "Manhattan" },
  { id: "A38", name: "Fulton St", borough: "Manhattan" },
  { id: "R26", name: "Rector St", borough: "Manhattan" },
  { id: "142", name: "South Ferry", borough: "Manhattan" },
  { id: "R27", name: "Whitehall St-South Ferry", borough: "Manhattan" },
  { id: "A02", name: "Inwood-207 St", borough: "Manhattan" },
  { id: "112", name: "168 St-Washington Hts", borough: "Manhattan" },
  { id: "A09", name: "168 St", borough: "Manhattan" },
  { id: "A12", name: "145 St", borough: "Manhattan" },
  { id: "D13", name: "145 St", borough: "Manhattan" },
  { id: "621", name: "125 St", borough: "Manhattan" },
  { id: "A22", name: "72 St", borough: "Manhattan" },
  { id: "R14", name: "57 St-7 Av", borough: "Manhattan" },
  { id: "D15", name: "47-50 Sts-Rockefeller Ctr", borough: "Manhattan" },
  { id: "R17", name: "34 St-Herald Sq", borough: "Manhattan" },
]

// Helper to look up daytime routes (typical trains) by GTFS Stop ID at JSON index 16
function getRoutesForStop(gtfsStopId: string): string {
  if (!stationData || !Array.isArray(stationData.data)) return ''
  for (const row of stationData.data) {
    if (row[8] === gtfsStopId) {
      return (row[16] ?? '').toString()
    }
  }
  return ''
}

// Enrich popular stations with their typical train routes
const ENRICHED_POPULAR_STATIONS: Station[] = POPULAR_MANHATTAN_STATIONS.map(s => ({
  ...s,
  routes: getRoutesForStop(s.id)
}))
// Helper to build a Station object (with coords) from the GTFS Stop ID by looking up in stationData
function getStationById(gtfsStopId: string): Station | null {
  if (!stationData || !Array.isArray(stationData.data)) return null
  for (const row of stationData.data) {
    if (row[8] === gtfsStopId) {
      const id = row[8]?.toString() || gtfsStopId
      const name = (row[13] ?? '').toString()
      const borough = (row[14] ?? '').toString()
      // GTFS data: latitude and longitude are at indices 18 and 19 respectively
      const latRaw = row[18]
      const lonRaw = row[19]
      const latitude = latRaw != null ? Number(latRaw) : undefined
      const longitude = lonRaw != null ? Number(lonRaw) : undefined
      return {
        id,
        name,
        borough,
        routes: getRoutesForStop(id),
        latitude,
        longitude,
      }
    }
  }
  return null
}

export default function StationSelector({
  userId,
  phoneNumber,
  initialStations = [],
  onComplete,
  onBack,
  isSettings = false,
}: StationSelectorProps) {
  // Initialize station list: saved stations first, then popular ones
  const [stations, setStations] = useState<Station[]>(() => {
    const uniqueIds = Array.from(new Set(initialStations))
    // Build Station objects for saved stations
    const selectedObjs: Station[] = uniqueIds
      .map(id => getStationById(id))
      .filter((s): s is Station => s !== null)
    // Append popular stations not already selected
    const rest = ENRICHED_POPULAR_STATIONS.filter(s => !uniqueIds.includes(s.id))
    return [...selectedObjs, ...rest]
  })
  const [selectedStations, setSelectedStations] = useState<string[]>(initialStations)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Search stations in the JSON data (filters stations and prioritizes selected)
  const searchStations = () => {
    if (!searchQuery.trim()) {
      // Empty search: revert to saved stations + popular list
      const uniqueIds = Array.from(new Set(selectedStations))
      const selectedObjs: Station[] = uniqueIds
        .map(id => getStationById(id))
        .filter((s): s is Station => s !== null)
      const rest = ENRICHED_POPULAR_STATIONS.filter(s => !uniqueIds.includes(s.id))
      setStations([...selectedObjs, ...rest])
      return
    }

    setIsSearching(true)

    try {
      console.log(`Searching for stations matching "${searchQuery}"...`)

      if (!stationData || !stationData.data || !Array.isArray(stationData.data)) {
        console.error("Station data is not in the expected format:", stationData)
        setIsSearching(false)
        return
      }

      // Log a sample station to verify structure
      if (stationData.data.length > 0) {
        console.log("Sample station structure:", stationData.data[0])
      }

      const query = searchQuery.toLowerCase().trim()
      const matchingStations: Station[] = []
      const stationMap = new Map<string, boolean>() // To prevent duplicates by unique stop ID

      stationData.data.forEach((station) => {
        if (!Array.isArray(station) || station.length < 10) return

        // Based on the Socrata JSON structure, use these indices:
        // [8] = GTFS Stop ID, [13] = Stop Name, [14] = Borough
        const gtfsStopId = (station[8] ?? '').toString()
        const stopName = (station[13] ?? '').toString()
        const borough = (station[14] ?? '').toString()

        if (!gtfsStopId || !stopName) return

        // Only search by station name as requested
        if (stopName.toLowerCase().includes(query)) {
          // Use unique GTFS Stop ID as key to deduplicate
          const key = gtfsStopId

          if (!stationMap.has(key)) {
            stationMap.set(key, true)
            matchingStations.push({
              id: gtfsStopId,
              name: stopName,
              borough: borough || "",
              // include typical trains from index 16
              routes: getRoutesForStop(gtfsStopId),
            })
          }
        }
      })

      // Sort by borough then name, then prioritize selected stations
      matchingStations.sort((a, b) => {
        if (a.borough !== b.borough) {
          return a.borough.localeCompare(b.borough)
        }
        return a.name.localeCompare(b.name)
      })
      // Prioritize stations already selected
      const selectedMatches = matchingStations.filter(s => selectedStations.includes(s.id))
      const otherMatches = matchingStations.filter(s => !selectedStations.includes(s.id))
      const sorted = [...selectedMatches, ...otherMatches]
      console.log(`Found ${sorted.length} stations matching "${searchQuery}"`)
      setStations(sorted)
    } catch (error) {
      console.error("Error searching stations:", error)
    } finally {
      setIsSearching(false)
    }
  }
  // Dynamically filter as the user types or selections change
  useEffect(() => {
    searchStations()
  }, [searchQuery, selectedStations])

  const handleToggleStation = (stationId: string) => {
    setSelectedStations((prev) => {
      if (prev.includes(stationId)) {
        return prev.filter((id) => id !== stationId)
      } else {
        return [...prev, stationId]
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedStations.length === 0) {
      setError("Please select at least one station")
      return
    }

    setIsLoading(true)

    try {
      // Save selected stations to database
      const success = await saveUserStations(userId, selectedStations)

      if (success) {
        // Get updated user data
        const user = await getUserByPhone(phoneNumber)

        if (user) {
          // Save to local storage
          saveUserToLocalStorage(user)
          onComplete()
        } else {
          setError("Failed to retrieve user data")
        }
      } else {
        setError("Failed to save your station preferences")
      }
    } catch (error) {
      console.error("Error saving stations:", error)
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="search">Search Stations</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="search"
              ref={searchInputRef}
              type="text"
              placeholder="Search by station name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  searchStations()
                }
              }}
              autoComplete="off"
              className="pr-10"
            />
          </div>
          <Button
            type="button"
            size="icon"
            disabled={isSearching}
            onClick={(e) => {
              e.preventDefault()
              searchStations()
            }}
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500">
          {isSearching
            ? "Searching stations..."
            : searchQuery
              ? `${stations.length} stations found matching "${searchQuery}"`
              : "Showing your saved stations followed by popular stations. Search to see more."}
        </p>
      </div>

      <div>
        <div className="flex-1 border rounded-md">
          <ScrollArea className="h-[300px] p-4">
            <div className="space-y-2">
              {stations.length > 0 ? (
                stations.map((station, index) => (
                  <div key={`${station.id}-${index}`} className="flex items-start space-x-2">
                    <Checkbox
                      id={`station-${station.id}-${index}`}
                      checked={selectedStations.includes(station.id)}
                      onCheckedChange={() => handleToggleStation(station.id)}
                    />
                    <Label htmlFor={`station-${station.id}-${index}`} className="text-sm cursor-pointer">
                      <span className="font-medium">{station.name}</span>
                      {/* show typical trains in parentheses */}
                      {station.routes && (
                        <span className="text-gray-500 ml-1">
                          ({station.routes.split(' ').join(', ')})
                        </span>
                      )}
                    </Label>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">
                  {isSearching
                    ? "Searching stations..."
                    : searchQuery
                      ? `No stations found matching "${searchQuery}"`
                      : "No stations available"}
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
        {/* Map removed */}
      </div>

      <div className="text-sm text-gray-500">
        Selected {selectedStations.length} station{selectedStations.length !== 1 ? "s" : ""}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex space-x-2">
        {onBack && (
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
        )}
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {isLoading ? "Saving..." : isSettings ? "Save Changes" : "Complete Setup"}
        </Button>
      </div>
    </form>
  )
}

