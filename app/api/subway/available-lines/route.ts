import { type NextRequest, NextResponse } from "next/server"
import { getAvailableLines } from "@/lib/mta"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const stationId = searchParams.get("stationId")
  const direction = searchParams.get("direction") as "N" | "S"
  const possibleLines = searchParams.get("lines")?.split(",") || []

  try {
    if (stationId && direction && possibleLines.length > 0) {
      const availableLines = await getAvailableLines(stationId, direction, possibleLines)
      return NextResponse.json({ availableLines })
    } else {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Failed to fetch available lines" }, { status: 500 })
  }
}

