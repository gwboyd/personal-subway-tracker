"use client"

import { useState, useEffect, memo, useRef } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import SubwayLines from "@/components/subway-lines"
import LineToggle from "@/components/line-toggle"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getStationName } from "@/lib/station-utils"
import { getLineColor, shouldUseBlackText } from "@/lib/line-info"
import { getDirectionLabelsForLines } from "@/lib/direction-labels"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import stationData from "@/lib/station-data.json"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getTempStationsFromLocalStorage, saveTempStationsToLocalStorage, clearTempStationsFromLocalStorage } from "@/lib/temp-stations"

// Search box that does not re-render the main selector on typing
const StationSearch = memo(function StationSearch({ onSelect }: { onSelect: (id: string, name: string) => void }) {
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [searchResults, setSearchResults] = useState<{ id: string; name: string }[]>([])
  const [isResultsVisible, setIsResultsVisible] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Handle clicks outside of search component
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsResultsVisible(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    if (!searchTerm) {
      setSearchResults([])
      setIsResultsVisible(false)
      return
    }
    const results = (stationData.data as any[])
      .map((station) => {
        const id = String(station[8])
        const name = String(station[13])
        const lines = station[16] ? String(station[16]).split(" ") : []
        return { id, name, lines }
      })
      .filter((s) => {
        const searchLower = searchTerm.toLowerCase()
        // Check if search matches station name
        if (s.name.toLowerCase().includes(searchLower)) {
          return true
        }
        // Check if search matches any line combinations
        const searchChars = searchLower.split('').filter(char => /[a-z0-9]/.test(char))
        if (searchChars.length > 0) {
          const stationLines = s.lines.map(line => line.toLowerCase())
          // Check if all search characters match the beginning of some line
          return searchChars.every(char => 
            stationLines.some(line => line.startsWith(char))
          )
        }
        return false
      })
      .sort((a, b) => {
        // Prioritize exact station name matches
        const aNameMatch = a.name.toLowerCase().includes(searchTerm.toLowerCase())
        const bNameMatch = b.name.toLowerCase().includes(searchTerm.toLowerCase())
        if (aNameMatch && !bNameMatch) return -1
        if (!aNameMatch && bNameMatch) return 1
        return 0
      })
    setSearchResults(results.slice(0, 15)) // Show more results
    setIsResultsVisible(true)
  }, [searchTerm])

  const handleSelect = (id: string, name: string) => {
    onSelect(id, name)
    setSearchTerm("")
    setIsResultsVisible(false)
  }

  return (
    <div className="relative z-50" ref={searchRef}>
      <Input
        type="search"
        inputMode="search"
        placeholder="Search stations..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-2"
      />
      {isResultsVisible && searchResults.length > 0 && (
        <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-md top-full left-0 shadow-lg">
          <ScrollArea className="max-h-[40vh] sm:max-h-[50vh]">
            <ul className="divide-y divide-gray-100">
              {searchResults.map((s) => {
                const lines = getLinesForStation(s.id)
                return (
                  <li
                    key={s.id}
                    className="px-3 py-3 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                    onClick={() => { handleSelect(s.id, s.name) }}
                  >
                    <span className="truncate">{s.name}</span>
                    <div className="flex items-center gap-1 ml-2">
                      {lines.slice(0, 5).map((line) => (
                        <span
                          key={line}
                          className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full"
                          style={{
                            backgroundColor: getLineColor(line),
                            color: shouldUseBlackText(line) ? 'black' : 'white'
                          }}
                        >
                          {line}
                        </span>
                      ))}
                      {lines.length > 5 && (
                        <span className="text-xs text-gray-600">+{lines.length - 5}</span>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </ScrollArea>
        </div>
      )}
    </div>
  )
})

// Helper function to get line colors
// getLineColor and shouldUseBlackText are now centralised in lib/line-info.ts

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
  isGuestMode?: boolean
  isLoggedIn?: boolean
  onExitGuestMode?: () => void
}

// Define a type for the station object to fix TypeScript errors
type StationType = {
  id: string;
  name: string;
  stationId: string;
  lines: string[];
  lineColors: Record<string, string>;
  isTemporary?: boolean;
};

export default function StationSelector({ 
  userStations = [], 
  isGuestMode = false,
  isLoggedIn = false,
  onExitGuestMode 
}: StationSelectorProps) {
  // Convert user stations to station objects
  const [stations, setStations] = useState<StationType[]>([])
  const [selectedStation, setSelectedStation] = useState<StationType | null>(null)
  const [direction, setDirection] = useState<"N" | "S">("N")
  const [availableLines, setAvailableLines] = useState<string[]>([])
  const [enabledLines, setEnabledLines] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [tempStations, setTempStations] = useState<StationType[]>([])
  const [extraStations, setExtraStations] = useState<StationType[]>([])

  // Load user stations and temporary stations from localStorage
  useEffect(() => {
    const loadUserStations = () => {
      // Load temporary stations from local storage
      const tempStationIds = getTempStationsFromLocalStorage()
      
      if (isGuestMode) {
        // W 4th St station ID is "167"
        const stationId = "A32"
        const stationName = "W 4 St-Wash Sq"
        const lines = getLinesForStation(stationId)
        const lineColors: Record<string, string> = {}
        lines.forEach((line) => {
          lineColors[line] = getLineColor(line)
        })

        const w4thStation: StationType = {
          id: stationId,
          name: stationName,
          stationId: stationId,
          lines,
          lineColors,
        }

        setStations([])
        setSelectedStation(w4thStation)
        setExtraStations([w4thStation])
        
        // Load temporary stations
        loadTempStations(tempStationIds)
        return
      }

      if (userStations.length === 0) {
        setStations([])
        setSelectedStation(null)
        
        // Load temporary stations
        loadTempStations(tempStationIds)
        return
      }

      // Convert user station IDs to station objects
      const userStationObjects = userStations.map((stationId) => {
        const stationName = getStationName(stationId) || `Station ${stationId}`
        const lines = getLinesForStation(stationId)
        const lineColors: Record<string, string> = {}
        lines.forEach((line) => {
          lineColors[line] = getLineColor(line)
        })

        return {
          id: stationId,
          name: stationName,
          stationId: stationId,
          lines,
          lineColors,
        }
      })

      setStations(userStationObjects)
      setSelectedStation(userStationObjects[0] || null)
      
      // Load temporary stations
      loadTempStations(tempStationIds)
    }

    const loadTempStations = (tempStationIds: string[]) => {
      if (tempStationIds.length === 0) {
        setTempStations([])
        return
      }
      
      // Convert temp station IDs to station objects
      const tempStationObjects = tempStationIds.map((stationId) => {
        const stationName = getStationName(stationId) || `Station ${stationId}`
        const lines = getLinesForStation(stationId)
        const lineColors: Record<string, string> = {}
        lines.forEach((line) => {
          lineColors[line] = getLineColor(line)
        })

        return {
          id: stationId,
          name: stationName,
          stationId: stationId,
          lines,
          lineColors,
          isTemporary: true,
        }
      })
      
      setTempStations(tempStationObjects)
    }

    loadUserStations()
  }, [userStations, isGuestMode])

  // Clear temporary stations when a user logs out
  useEffect(() => {
    if (!isGuestMode && !isLoggedIn) {
      clearTempStationsFromLocalStorage()
      setTempStations([])
    }
  }, [isGuestMode, isLoggedIn])

  // Fetch available lines whenever selected station or direction changes
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

  // Determine which labels to use for the N/S buttons based on the lines available at this station
  const directionLabels = getDirectionLabelsForLines(selectedStation ? selectedStation.lines : [])

  const toggleLine = (line: string) => {
    setEnabledLines((prev) => ({
      ...prev,
      [line]: !prev[line],
    }))
  }

  const activeLines = Array.isArray(availableLines) 
    ? availableLines.filter(line => enabledLines[line])
    : []
  const directionText = direction === "N" ? directionLabels.N : directionLabels.S
  
  // Determine which lines should be running but aren't
  const missingLines = selectedStation ? 
    selectedStation.lines.filter(line => !availableLines.includes(line)) : 
    []

  const handleExtraStationSelect = (stationId: string, stationName: string) => {
    // Check if we already have this station in our state
    const existingStation = [...stations, ...extraStations, ...tempStations].find(s => s.id === stationId)
    
    if (existingStation) {
      setSelectedStation(existingStation)
      return
    }
    
    // Create a new station object for the station
    const lines = getLinesForStation(stationId)
    
    // Create line colors map
    const lineColors: Record<string, string> = {}
    lines.forEach((line) => {
      lineColors[line] = getLineColor(line)
    })
    
    const newStation: StationType = {
      id: stationId,
      name: stationName,
      stationId: stationId,
      lines,
      lineColors,
    }
    
    // Add to our extra stations and select it
    setExtraStations(prev => [...prev, newStation])
    setSelectedStation(newStation)
  }
  
  // Add or remove a station from temporary pins
  const toggleTemporaryStation = (station: StationType) => {
    // If it's already in the temporary stations, remove it
    if (tempStations.some(s => s.id === station.id)) {
      const updatedTempStations = tempStations.filter(s => s.id !== station.id)
      setTempStations(updatedTempStations)
      
      // Update the localStorage
      saveTempStationsToLocalStorage(updatedTempStations.map(s => s.id))
      
      // If the current station is the one being removed and it's not in stations or extraStations,
      // switch to the first available station
      if (selectedStation?.id === station.id && 
          !stations.some(s => s.id === station.id) && 
          !extraStations.some(s => s.id === station.id)) {
        const nextStation = stations[0] || extraStations[0] || (updatedTempStations.length > 0 ? updatedTempStations[0] : null)
        setSelectedStation(nextStation)
      }
    } else {
      // Add to temporary stations
      const tempStation: StationType = {
        ...station,
        isTemporary: true
      }
      
      const updatedTempStations = [...tempStations, tempStation]
      setTempStations(updatedTempStations)
      
      // Update the localStorage
      saveTempStationsToLocalStorage(updatedTempStations.map(s => s.id))
    }
  }

  // Controlled tab value: highlight if selected station is one of the saved or temporary stations
  const tabValue = selectedStation != null 
    ? (stations.some(s => s.id === selectedStation.id) || tempStations.some(s => s.id === selectedStation.id)) 
      ? selectedStation.id 
      : ""
    : ""

  if (!selectedStation) {
    return (
      <div className="text-center py-8">
        {isGuestMode ? (
          <div className="space-y-4">
            <StationSearch onSelect={handleExtraStationSelect} />
            <p className="text-sm text-gray-500">
              Guest mode: You can search for any station, but your selections won't be saved.{' '}
              <button 
                onClick={onExitGuestMode} 
                className="text-primary hover:underline font-medium"
              >
                Log in
              </button>
              {' '}to save your most used stations.
            </p>
          </div>
        ) : (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No stations selected. Please add stations in settings.
            </AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  // Check if this is a terminal station
  const isTerminalStation = (stationData.data as any[])
    .find(station => station[8] === selectedStation.stationId)?.[20] === "Last Stop"

  return (
    <div className="space-y-8">
      <div className="space-y-4 mb-4">
        <StationSearch onSelect={handleExtraStationSelect} />
        {isGuestMode && (
          <p className="text-sm text-gray-500">
            Guest mode: You can search for any station, but your selections won't be saved.{' '}
            <button 
              onClick={onExitGuestMode} 
              className="text-primary hover:underline font-medium"
            >
              Log in
            </button>
            {' '}to save your most used stations.
          </p>
        )}
      </div>

      {(!isGuestMode || tempStations.length > 0) && (
        <div className="relative">
          <Tabs
            value={tabValue}
            onValueChange={(value) => {
              const station = [...stations, ...tempStations, ...extraStations].find((s) => s.id === value)
              if (station) setSelectedStation(station)
            }}
          >
            <div className="flex justify-center mb-8">
              <div className="w-full max-w-3xl">
                <TabsList className="flex flex-wrap justify-center gap-4 bg-transparent p-0 h-auto">
                  {/* User favorite stations */}
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
                            {station.lines.slice(0, 5).map((line) => (
                              <span 
                                key={line} 
                                className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full"
                                style={{
                                  backgroundColor: station.lineColors[line] || getLineColor(line),
                                  color: shouldUseBlackText(line) ? 'black' : 'white'
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
                  
                  {/* Temporary stations */}
                  {tempStations.map((station) => (
                    <TabsTrigger 
                      key={station.id} 
                      value={station.id}
                      className="min-w-[150px] max-w-[200px] flex-grow-0 py-3 px-4 
                                text-sm font-medium transition-all 
                                data-[state=active]:shadow-md data-[state=active]:scale-105 
                                data-[state=active]:z-10 data-[state=active]:font-bold
                                rounded-md border border-gray-200 hover:bg-gray-50 border-dashed"
                      // No onClick handler here - we only want the default tab selection behavior
                      // Removal is handled by the "Temporary" button in the card header
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-center truncate w-full">{station.name}</span>
                        {station.lines && station.lines.length > 0 && (
                          <div className="flex flex-wrap justify-center gap-1 mt-1">
                            {station.lines.slice(0, 5).map((line) => (
                              <span 
                                key={line} 
                                className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full"
                                style={{
                                  backgroundColor: station.lineColors[line] || getLineColor(line),
                                  color: shouldUseBlackText(line) ? 'black' : 'white'
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
      )}

      <Card className="border-t-4 mt-4" style={{ borderTopColor: selectedStation.lines[0] ? (selectedStation.lineColors[selectedStation.lines[0]] || getLineColor(selectedStation.lines[0])) : 'currentColor' }}>
        <CardHeader className="pb-3">
          <CardTitle className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <span className="text-center sm:text-left flex items-center gap-2">
              {selectedStation.name}
              {/* Show clickable Temporary indicator */}
              {!stations.some(s => s.id === selectedStation.id) && (
                <button 
                  onClick={() => toggleTemporaryStation(selectedStation)}
                  className={`inline-flex items-center text-xs px-2 rounded-full h-5 transition-colors ${
                    tempStations.some(s => s.id === selectedStation.id) 
                      ? "bg-black text-white" 
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Temporary
                </button>
              )}
            </span>
            <div className="flex space-x-2">
              {!isTerminalStation ? (
                <>
                  <Button variant={direction === "N" ? "default" : "outline"} size="sm" onClick={() => setDirection("N")}>
                    {directionLabels.N}
                  </Button>
                  <Button variant={direction === "S" ? "default" : "outline"} size="sm" onClick={() => setDirection("S")}>
                    {directionLabels.S}
                  </Button>
                </>
              ) : (
                <Button variant="default" size="sm" disabled>
                  {directionLabels[direction]}
                </Button>
              )}
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
              {/* Display alert for missing lines */}
              {missingLines.length > 0 && (
                <Alert variant="destructive" className="mb-4 py-2 text-sm flex justify-center items-center">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    <AlertDescription className="flex items-center">
                      Lines not running: {' '}
                      <span className="flex flex-wrap gap-1 ml-1">
                        {missingLines.map((line) => (
                          <span 
                            key={line} 
                            className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full"
                            style={{
                              backgroundColor: selectedStation.lineColors[line] || getLineColor(line),
                              color: shouldUseBlackText(line) ? 'black' : 'white'
                            }}
                          >
                            {line}
                          </span>
                        ))}
                      </span>
                    </AlertDescription>
                  </div>
                </Alert>
              )}

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
                      onStationSelect={handleExtraStationSelect}
                    />
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No lines selected. Toggle at least one line to see arrivals.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="flex flex-col items-center gap-4">
                    <p>No trains scheduled at this station in the next hour.</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={async () => {
                        setLoading(true)
                        try {
                          const response = await fetch(`/api/subway/available-lines?stationId=${selectedStation.stationId}&direction=${direction}&lines=${selectedStation.lines.join(',')}`).then(r => r.json())
                          const lines = Array.isArray(response) ? response : []
                          setAvailableLines(lines)
                          const enabledLinesObj = lines.reduce((acc: Record<string, boolean>, line: string) => {
                            acc[line] = true
                            return acc
                          }, {})
                          setEnabledLines(enabledLinesObj)
                        } catch (error) {
                          console.error('Error fetching available lines:', error)
                          setAvailableLines([])
                          setEnabledLines({})
                        }
                        setLoading(false)
                      }}
                      disabled={loading}
                    >
                      {loading ? "Refreshing..." : "Refresh"}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
