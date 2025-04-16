import stationData from "@/lib/station-data.json"

export function debugStationData() {
  console.log("Station data structure:", {
    metaInfo: stationData.meta,
    dataLength: stationData.data.length,
    firstFewEntries: stationData.data.slice(0, 3),
  })

  // Extract and log some sample stations
  const sampleStations = stationData.data.slice(0, 10).map((station) => ({
    gtfsStopId: station[8],
    stationId: station[9],
    stopName: station[6],
    borough: station[7],
    daytimeRoutes: station[9],
  }))

  console.log("Sample stations:", sampleStations)

  // Count unique station names
  const uniqueNames = new Set()
  stationData.data.forEach((station) => {
    if (station[6]) uniqueNames.add(station[6])
  })

  console.log(`Total stations: ${stationData.data.length}, Unique station names: ${uniqueNames.size}`)
}

