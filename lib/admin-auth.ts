import { createHmac, timingSafeEqual } from "crypto"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

const COOKIE_NAME = "emi_admin_session"
const SESSION_TTL_SECONDS = 60 * 60 * 8

function secret() {
  return process.env.NEXTAUTH_SECRET || "change-this-admin-session-secret"
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex")
}

export function createAdminToken(email: string) {
  const payload = Buffer.from(JSON.stringify({ email, expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000 })).toString("base64url")
  return `${payload}.${sign(payload)}`
}

export function verifyAdminToken(token: string | undefined) {
  if (!token) return null
  const [payload, signature] = token.split(".")
  if (!payload || !signature) return null

  const expected = sign(payload)
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { email?: string; expiresAt?: number }
    if (data.email !== process.env.ADMIN_EMAIL || !data.expiresAt || data.expiresAt < Date.now()) return null
    return { email: data.email }
  } catch {
    return null
  }
}

export async function getAdminSession() {
  const cookieStore = await cookies()
  return verifyAdminToken(cookieStore.get(COOKIE_NAME)?.value)
}

export async function requireAdmin() {
  const session = await getAdminSession()
  if (session) return null
  return NextResponse.json({ success: false, error: "Admin authentication required" }, { status: 401 })
}

export function adminCookie(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  }
}

export { COOKIE_NAME }
