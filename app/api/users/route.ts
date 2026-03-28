import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/server-supabase"

const supabase = createServerSupabaseClient()

export async function POST(request: Request) {
  try {
    const { phone_number, first_name, last_name } = await request.json()

    // Validate input
    if (!phone_number || !first_name || !last_name) {
      return NextResponse.json({ error: "Phone number, first name, and last name are required" }, { status: 400 })
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("phone_number", phone_number)
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json({ error: "User with this phone number already exists" }, { status: 409 })
    }

    // Create new user
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          phone_number,
          first_name,
          last_name,
        },
      ])
      .select()

    if (error) {
      console.error("Error creating user:", error)
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error("Error in user creation API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
