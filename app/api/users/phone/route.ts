import { NextResponse } from "next/server"
import { createPublicServerSupabaseClient } from "@/lib/server-supabase"
import { createSubwaySessionPayload, createSubwaySessionToken } from "@/lib/subway-session"

const supabase = createPublicServerSupabaseClient()

export async function POST(request: Request) {
  try {
    const { phoneNumber } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    const { data, error } = await supabase.rpc("find_user_by_phone", {
      input_phone: phoneNumber,
    })

    if (error) {
      console.error("Error fetching user:", error)
      return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
    }

    const user = Array.isArray(data) ? data[0] ?? null : data

    if (!user) {
      return NextResponse.json(null)
    }

    const response = NextResponse.json(user)
    const sessionToken = await createSubwaySessionToken(createSubwaySessionPayload(user.id, user.phone_number))
    response.cookies.set("subway_session", sessionToken, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })

    return response
  } catch (error) {
    console.error("Error in user phone API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
