"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import SubwayLines from "@/components/subway-lines"
import LineToggle from "@/components/line-toggle"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getStationName } from "@/lib/station-utils"

// Helper function to get line colors
const getLineColor = (line: string): string => {
  switch (line.charAt(0)) {
    case "A":
    case "C":
    case "E":
      return "blue"
    case "B":
    case "D":
    case "F":
    case "M":
      return "#ff5d0d"
    case "N":
    case "Q":
    case "R":
    case "W":
      return "yellow"
    case "1":
    case "2":
    case "3":
      return "red"
    case "4":
    case "5":
    case "6":
      return "green"
    case "7":
      return "purple"
    case "G":
      return "green"
    case "J":
    case "Z":
      return "brown"
    case "L":
      return "gray"
    case "S":
      return "gray"
    default:
      return "gray"
  }
}

// Function to get lines for a station from station-data.json
// Uses GTFS Stop ID at index 8 and Daytime Routes at index 16
const getLinesForStation = (stationId: string): string[] => {
  try {
    const stationData = require("@/lib/station-data.json")
    for (const station of stationData.data) {
      if (station[8] === stationId) {
        const routesField = station[16]
        if (routesField && typeof routesField === 'string') {
          return routesField.split(" ")
        }
      }
    }
    return []
  } catch (error) {
    console.error("Error getting lines for station:", error)
    return []
  }
}

interface StationSelectorProps {
  userStations?: string[]
}

// Define a type for the station object to fix TypeScript errors
type StationType = {
  id: string;
  name: string;
  stationId: string;
  lines: string[];
  lineColors: Record<string, string>;
};

export default function StationSelector({ userStations = [] }: StationSelectorProps) {
  // Convert user stations to station objects
  const [stations, setStations] = useState<StationType[]>([])
  const [selectedStation, setSelectedStation] = useState<StationType | null>(null)
  const [direction, setDirection] = useState<"N" | "S">("N")
  const [availableLines, setAvailableLines] = useState<string[]>([])
  const [enabledLines, setEnabledLines] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  // Load user stations
  useEffect(() => {
    const loadUserStations = () => {
      if (userStations.length === 0) {
        // Use default stations if no user stations
        setStations([]);
        setSelectedStation(null);
        return
      }

      // Convert user station IDs to station objects
      const userStationObjects = userStations.map((stationId) => {
        // Get proper station name using the utility function
        const stationName = getStationName(stationId) || `Station ${stationId}`
        const lines = getLinesForStation(stationId)

        // Create line colors map
        const lineColors: Record<string, string> = {}
        lines.forEach((line) => {
          lineColors[line] = getLineColor(line)
        })

        return {
          id: stationId,
          name: stationName, // Use the proper station name
          stationId: stationId,
          lines,
          lineColors,
        }
      })

      setStations(userStationObjects)
      setSelectedStation(userStationObjects[0] || null)
    }

    loadUserStations()
  }, [userStations])

  // Fetch available lines when station or direction changes
  useEffect(() => {
    const fetchAvailableLines = async () => {
      if (!selectedStation) return

      setLoading(true)
      try {
        // Fetch available lines via our API route (server-side)
        const query = new URLSearchParams({
          stationId: selectedStation.stationId,
          direction,
          lines: selectedStation.lines.join(','),
        })
        const response = await fetch(`/api/subway/available-lines?${query}`)
        let lines: string[] = []
        if (response.ok) {
          const data = await response.json()
          lines = data.availableLines || []
        } else {
          console.error('Failed to fetch available lines:', await response.text())
        }
        setAvailableLines(lines)

        // Initialize enabled state for available lines
        const newEnabledLines: Record<string, boolean> = {}
        lines.forEach((line) => {
          newEnabledLines[line] = enabledLines[line] !== undefined ? enabledLines[line] : true
        })
        setEnabledLines(newEnabledLines)
      } catch (error) {
        console.error("Failed to fetch available lines:", error)
      } finally {
        setLoading(false)
      }
    }

    if (selectedStation) {
      fetchAvailableLines()
    }
  }, [selectedStation, direction])

  const toggleLine = (line: string) => {
    setEnabledLines((prev) => ({
      ...prev,
      [line]: !prev[line],
    }))
  }

  const activeLines = availableLines.filter((line) => enabledLines[line])
  const directionText = direction === "N" ? "Uptown" : "Downtown"

  if (!selectedStation) {
    return (
      <div className="text-center py-8">
        <p>No stations available. Please add stations in settings.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="overflow-hidden">
        <Tabs
          defaultValue={stations[0]?.id}
          value={selectedStation?.id}
          onValueChange={(value) => setSelectedStation(stations.find((s) => s.id === value) || null)}
          className="w-full"
        >
          <div className="flex justify-center mb-8">
            <div className="w-full max-w-3xl">
              {/* Restore the TabsList component to fix the error, but with custom styling */}
              <TabsList className="flex flex-wrap justify-center gap-4 bg-transparent p-0 h-auto">
                {stations.map((station) => (
                  <TabsTrigger 
                    key={station.id} 
                    value={station.id}
                    className="min-w-[150px] max-w-[200px] flex-grow-0 py-3 px-4 
                              text-sm font-medium transition-all 
                              data-[state=active]:shadow-md data-[state=active]:scale-105 
                              data-[state=active]:z-10 data-[state=active]:font-bold
                              rounded-md border border-gray-200 hover:bg-gray-50"
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-center truncate w-full">{station.name}</span>
                      {station.lines && station.lines.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-1 mt-1">
                          {station.lines.slice(0, 5).map(line => (
                            <span 
                              key={line} 
                              className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full"
                              style={{
                                backgroundColor: station.lineColors[line] || getLineColor(line),
                                color: ['yellow', 'orange'].includes(station.lineColors[line] || getLineColor(line)) ? 'black' : 'white'
                              }}
                            >
                              {line}
                            </span>
                          ))}
                          {station.lines.length > 5 && (
                            <span className="text-xs">+{station.lines.length - 5}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>
        </Tabs>
      </div>

      <Card className="border-t-4 mt-4" style={{ borderTopColor: selectedStation.lines[0] ? (selectedStation.lineColors[selectedStation.lines[0]] || getLineColor(selectedStation.lines[0])) : 'currentColor' }}>
        <CardHeader className="pb-3">
          <CardTitle className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <span className="text-center sm:text-left">{selectedStation.name}</span>
            <div className="flex space-x-2">
              <Button variant={direction === "N" ? "default" : "outline"} size="sm" onClick={() => setDirection("N")}>
                Uptown
              </Button>
              <Button variant={direction === "S" ? "default" : "outline"} size="sm" onClick={() => setDirection("S")}>
                Downtown
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-8 w-12 bg-muted animate-pulse rounded-full" />
                ))}
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-6 w-6 bg-muted animate-pulse rounded-full" />
                    <div className="h-4 w-full max-w-[250px] bg-muted animate-pulse rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {availableLines.length > 0 ? (
                <>
                  <div className="flex flex-wrap gap-2 mb-8">
                    {availableLines.map((line) => (
                      <LineToggle
                        key={line}
                        line={line}
                        color={selectedStation.lineColors[line] || getLineColor(line)}
                        enabled={enabledLines[line]}
                        onToggle={() => toggleLine(line)}
                      />
                    ))}
                  </div>

                  {activeLines.length > 0 ? (
                    <SubwayLines
                      stationId={selectedStation.stationId}
                      direction={direction}
                      lines={activeLines}
                      title={`${directionText} Trains - Next Hour`}
                    />
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No lines selected. Toggle at least one line to see arrivals.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No trains scheduled at this station in the next hour.</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
