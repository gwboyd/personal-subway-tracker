import stationData from "@/lib/station-data.json"

export type Station = {
  id: string
  name: string
  borough: string
  lines?: string[]
}

export function loadStations(): Station[] {
  try {
    console.log("Loading stations from JSON data...")

    // Check if the data structure is as expected
    if (!stationData || !stationData.data || !Array.isArray(stationData.data)) {
      console.error("Station data is not in the expected format:", stationData)
      return []
    }

    const stationMap = new Map<string, Station>()

    // Process each station in the data
    stationData.data.forEach((station, index) => {
      // Check if this is a valid station entry
      if (!Array.isArray(station) || station.length < 10) {
        console.warn(`Skipping invalid station entry at index ${index}:`, station)
        return
      }

      const gtfsStopId = station[8] as string // GTFS Stop ID
      const stopName = station[6] as string // Stop Name
      const borough = station[7] as string // Borough
      const daytimeRoutes = station[9] as string // Daytime Routes

      // Skip if missing essential data
      if (!gtfsStopId || !stopName) {
        console.warn(`Skipping station with missing ID or name at index ${index}`)
        return
      }

      // Create a unique key combining ID and name to handle stations with same name
      const key = `${stopName}-${borough}`

      // If we already have this station, just add the line if it's new
      if (stationMap.has(key)) {
        const existingStation = stationMap.get(key)!

        // Add lines if they're not already included
        if (daytimeRoutes && existingStation.lines) {
          const newLines = daytimeRoutes.split(" ")
          newLines.forEach((line) => {
            if (!existingStation.lines!.includes(line)) {
              existingStation.lines!.push(line)
            }
          })
        }
      } else {
        // Create a new station entry
        const newStation: Station = {
          id: gtfsStopId,
          name: stopName,
          borough: borough || "",
          lines: daytimeRoutes ? daytimeRoutes.split(" ") : [],
        }

        stationMap.set(key, newStation)
      }
    })

    // Convert the map to an array and sort
    const stationList = Array.from(stationMap.values())

    // Sort by borough then name
    stationList.sort((a, b) => {
      if (a.borough !== b.borough) {
        return a.borough.localeCompare(b.borough)
      }
      return a.name.localeCompare(b.name)
    })

    console.log(`Successfully loaded ${stationList.length} unique stations`)
    return stationList
  } catch (error) {
    console.error("Error loading stations:", error)
    return []
  }
}

