import { NextResponse } from "next/server"
import { createPublicServerSupabaseClient } from "@/lib/server-supabase"
import { createSubwaySessionPayload, createSubwaySessionToken } from "@/lib/subway-session"

const supabase = createPublicServerSupabaseClient()

export async function POST(request: Request) {
  try {
    const { phone_number, first_name, last_name } = await request.json()

    // Validate input
    if (!phone_number || !first_name || !last_name) {
      return NextResponse.json({ error: "Phone number, first name, and last name are required" }, { status: 400 })
    }

    // Check if user already exists
    const { data: existingUsers } = await supabase.rpc("find_user_by_phone", {
      input_phone: phone_number,
    })
    const existingUser = Array.isArray(existingUsers) ? existingUsers[0] ?? null : existingUsers

    if (existingUser) {
      return NextResponse.json({ error: "User with this phone number already exists" }, { status: 409 })
    }

    const { data, error } = await supabase.rpc("create_subway_user", {
      input_phone: phone_number,
      input_first_name: first_name,
      input_last_name: last_name,
    })

    if (error) {
      console.error("Error creating user:", error)
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    const user = Array.isArray(data) ? data[0] ?? null : data

    if (!user) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
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
    console.error("Error in user creation API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
