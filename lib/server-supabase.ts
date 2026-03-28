import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { createSubwayAccessToken, verifySubwaySessionToken } from "@/lib/subway-session"

const SUPABASE_SCHEMA = "subway"

function getPublishableKey() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return { supabaseUrl, supabasePublishableKey }
}

export function createPublicServerSupabaseClient() {
  const { supabaseUrl, supabasePublishableKey } = getPublishableKey()

  return createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }).schema(SUPABASE_SCHEMA as never)
}

export async function getAuthenticatedSubwaySession() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get("subway_session")?.value

  if (!sessionToken) {
    return null
  }

  return verifySubwaySessionToken(sessionToken)
}

export async function createAuthenticatedServerSupabaseClient() {
  const session = await getAuthenticatedSubwaySession()

  if (!session) {
    throw new Error("Unauthorized")
  }

  const accessToken = await createSubwayAccessToken(session)
  const { supabaseUrl, supabasePublishableKey } = getPublishableKey()

  return createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  }).schema(SUPABASE_SCHEMA as never)
}
