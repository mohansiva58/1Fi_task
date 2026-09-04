import { NextResponse } from "next/server"
import { adminCookie, createAdminToken } from "@/lib/admin-auth"

export async function POST(request: Request) {
  const { email, password } = await request.json()
  const validEmail = typeof email === "string" && email.trim().toLowerCase() === process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const validPassword = typeof password === "string" && password === process.env.ADMIN_PASSWORD

  if (!validEmail || !validPassword) {
    return NextResponse.json({ success: false, error: "Invalid admin email or password" }, { status: 401 })
  }

  const response = NextResponse.json({ success: true, admin: { email: process.env.ADMIN_EMAIL } })
  response.cookies.set(adminCookie(createAdminToken(process.env.ADMIN_EMAIL!)))
  return response
}
