import stationData from "@/lib/station-data.json"

// Create a mapping from GTFS Stop ID to station name
const stationIdToNameMap: Record<string, string> = {}

// Initialize the map from the station data
export function initializeStationMap() {
  try {
    // The station data is in the "data" array
    // Each entry has "GTFS Stop ID" at index 8 and "Stop Name" at index 13
    stationData.data.forEach((station) => {
      const gtfsStopId = String(station[8]) // GTFS Stop ID - convert to string
      const stopName = station[13] != null ? String(station[13]) : '' // Stop Name at index 13

      if (gtfsStopId && stopName) {
        stationIdToNameMap[gtfsStopId] = stopName
      }
    })
    console.log("Station map initialized with", Object.keys(stationIdToNameMap).length, "stations")
  } catch (error) {
    console.error("Error initializing station map:", error)
  }
}

// Get station name from GTFS Stop ID
export function getStationName(gtfsStopId: string): string {
  // Initialize the map if it's empty
  if (Object.keys(stationIdToNameMap).length === 0) {
    initializeStationMap()
  }

  const stationName = stationIdToNameMap[gtfsStopId]
  if (!stationName) {
    console.log(`No station name found for ID: ${gtfsStopId}`)
  }
  return stationName || `Station ${gtfsStopId}`
}

// Get all stations for a specific line
export function getStationsForLine(line: string): { id: string; name: string }[] {
  // Initialize the map if it's empty
  if (Object.keys(stationIdToNameMap).length === 0) {
    initializeStationMap()
  }

  // Filter stations by line
  // This is a simplified approach - in a real implementation,
  // you would need to use the "Daytime Routes" field to filter by line
  const stations: { id: string; name: string }[] = []

  try {
    stationData.data.forEach((station) => {
      const gtfsStopId = String(station[8]) // GTFS Stop ID at index 8
      const stopName = station[13] != null ? String(station[13]) : '' // Stop Name at index 13
      const daytimeRoutes = station[16] ? String(station[16]) : "" // Daytime Routes at index 16

      if (gtfsStopId && stopName && daytimeRoutes && daytimeRoutes.includes(line)) {
        stations.push({
          id: gtfsStopId,
          name: stopName,
        })
      }
    })
  } catch (error) {
    console.error("Error getting stations for line:", error)
  }

  return stations
}
