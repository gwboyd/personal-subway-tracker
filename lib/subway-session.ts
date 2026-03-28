type SubwaySession = {
  userId: string
  phoneNumber: string
  exp: number
}

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30

function getSessionSecret() {
  const sessionSecret = process.env.SUBWAY_SESSION_SECRET || process.env.SUPABASE_JWT_SECRET

  if (!sessionSecret) {
    throw new Error("Missing subway session secret")
  }

  return sessionSecret
}

function getJwtSecret() {
  const jwtSecret = process.env.SUPABASE_JWT_SECRET

  if (!jwtSecret) {
    throw new Error("Missing Supabase JWT secret")
  }

  return jwtSecret
}

function stringToBytes(value: string) {
  return new TextEncoder().encode(value)
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = ""

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function base64UrlToBytes(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=")
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

async function sign(value: string, secret: string) {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    stringToBytes(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, stringToBytes(value))
  return bytesToBase64Url(new Uint8Array(signature))
}

async function verify(value: string, signature: string, secret: string) {
  const expectedSignature = await sign(value, secret)
  return expectedSignature === signature
}

export function createSubwaySessionPayload(userId: string, phoneNumber: string): SubwaySession {
  return {
    userId,
    phoneNumber,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  }
}

export async function createSubwaySessionToken(session: SubwaySession) {
  const encodedPayload = bytesToBase64Url(stringToBytes(JSON.stringify(session)))
  const signature = await sign(encodedPayload, getSessionSecret())
  return `${encodedPayload}.${signature}`
}

export async function verifySubwaySessionToken(token: string) {
  const [encodedPayload, signature] = token.split(".")

  if (!encodedPayload || !signature) {
    return null
  }

  const isValid = await verify(encodedPayload, signature, getSessionSecret())

  if (!isValid) {
    return null
  }

  const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(encodedPayload))) as SubwaySession

  if (payload.exp <= Math.floor(Date.now() / 1000)) {
    return null
  }

  return payload
}

export async function createSubwayAccessToken(session: SubwaySession) {
  const header = bytesToBase64Url(stringToBytes(JSON.stringify({ alg: "HS256", typ: "JWT" })))
  const payload = bytesToBase64Url(
    stringToBytes(
      JSON.stringify({
        aud: "authenticated",
        exp: session.exp,
        iat: Math.floor(Date.now() / 1000),
        role: "authenticated",
        sub: session.userId,
        phone: session.phoneNumber,
      }),
    ),
  )

  const signature = await sign(`${header}.${payload}`, getJwtSecret())
  return `${header}.${payload}.${signature}`
}
