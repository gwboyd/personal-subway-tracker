import { type NextRequest, NextResponse } from "next/server"
import { getSubwayArrivals, getDestinationTimes } from "@/lib/mta"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const stationId = searchParams.get("stationId")
  const direction = searchParams.get("direction") as "N" | "S"
  const lines = searchParams.get("lines")?.split(",") || []
  const tripId = searchParams.get("tripId")
  const line = searchParams.get("line")

  try {
    if (tripId && line) {
      // Get destination times for a specific trip
      const destinations = await getDestinationTimes(tripId, line)
      return NextResponse.json({ destinations })
    } else if (stationId && direction && lines.length > 0) {
      // Get arrivals for a station
      const arrivals = await getSubwayArrivals(stationId, direction, lines)
      return NextResponse.json({ arrivals })
    } else {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Failed to fetch subway data" }, { status: 500 })
  }
}

