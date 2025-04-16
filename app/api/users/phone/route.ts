import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Initialize the Supabase client with server-side credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseServiceKey)

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

