import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/server-supabase"

const supabase = createServerSupabaseClient()

export async function POST(request: Request) {
  try {
    const { phoneNumber } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    const { data, error } = await supabase.from("users").select("*").eq("phone_number", phoneNumber).maybeSingle()

    if (error) {
      console.error("Error fetching user:", error)
      return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in user phone API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
