import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/server-supabase"

const supabase = createServerSupabaseClient()

export async function GET(request: Request, { params }: { params: any }) {
  try {
    // params is a promise-like in Next.js; await before using
    const { userId } = await params

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const { data, error } = await supabase.from("user_stations").select("station_id").eq("user_id", userId)

    if (error) {
      console.error("Error fetching user stations:", error)
      return NextResponse.json({ error: "Failed to fetch user stations" }, { status: 500 })
    }

    const stationIds = data.map((item) => item.station_id)
    return NextResponse.json(stationIds)
  } catch (error) {
    console.error("Error in user stations API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
