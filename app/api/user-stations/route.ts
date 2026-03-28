import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/server-supabase"

const supabase = createServerSupabaseClient()

export async function POST(request: Request) {
  try {
    const { userId, stationIds } = await request.json()

    // Validate input
    if (!userId || !stationIds || !Array.isArray(stationIds)) {
      return NextResponse.json({ error: "User ID and station IDs array are required" }, { status: 400 })
    }

    // First delete existing stations
    const { error: deleteError } = await supabase.from("user_stations").delete().eq("user_id", userId)

    if (deleteError) {
      console.error("Error deleting existing stations:", deleteError)
      return NextResponse.json({ error: "Failed to delete existing stations" }, { status: 500 })
    }

    // Then insert new stations
    const stationsToInsert = stationIds.map((stationId) => ({
      user_id: userId,
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
