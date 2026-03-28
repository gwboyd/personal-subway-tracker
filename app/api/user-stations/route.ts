import { NextResponse } from "next/server"
import { createAuthenticatedServerSupabaseClient, getAuthenticatedSubwaySession } from "@/lib/server-supabase"

export async function GET() {
  try {
    const session = await getAuthenticatedSubwaySession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createAuthenticatedServerSupabaseClient()
    const { data, error } = await supabase.from("user_stations").select("station_id").eq("user_id", session.userId)

    if (error) {
      return NextResponse.json({ error: "Failed to fetch user stations" }, { status: 500 })
    }

    return NextResponse.json(data.map((item) => item.station_id))
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedSubwaySession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { stationIds } = await request.json()

    // Validate input
    if (!stationIds || !Array.isArray(stationIds)) {
      return NextResponse.json({ error: "Station IDs array is required" }, { status: 400 })
    }

    const supabase = await createAuthenticatedServerSupabaseClient()

    // First delete existing stations
    const { error: deleteError } = await supabase.from("user_stations").delete().eq("user_id", session.userId)

    if (deleteError) {
      console.error("Error deleting existing stations:", deleteError)
      return NextResponse.json({ error: "Failed to delete existing stations" }, { status: 500 })
    }

    // Then insert new stations
    const stationsToInsert = stationIds.map((stationId) => ({
      user_id: session.userId,
      station_id: stationId,
    }))

    const { error: insertError } = await supabase.from("user_stations").insert(stationsToInsert)

    if (insertError) {
      console.error("Error saving user stations:", insertError)
      return NextResponse.json({ error: "Failed to save user stations" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in user stations API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
