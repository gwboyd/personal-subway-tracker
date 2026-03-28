import { NextResponse } from "next/server"
import { getAuthenticatedSubwaySession } from "@/lib/server-supabase"

export async function GET(request: Request, { params }: { params: any }) {
  try {
    const session = await getAuthenticatedSubwaySession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.redirect(new URL("/api/user-stations", request.url), 307)
  } catch (error) {
    console.error("Error in user stations API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
