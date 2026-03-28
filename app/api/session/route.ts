import { NextResponse } from "next/server"
import { createAuthenticatedServerSupabaseClient, getAuthenticatedSubwaySession } from "@/lib/server-supabase"

export async function GET() {
  try {
    const session = await getAuthenticatedSubwaySession()

    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const supabase = await createAuthenticatedServerSupabaseClient()
    const { data, error } = await supabase.from("users").select("*").eq("id", session.userId).single()

    if (error) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    return NextResponse.json({ user: data })
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 500 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.set("subway_session", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })
  return response
}
