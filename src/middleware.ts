import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET || "un_secreto_muy_seguro_para_desarrollo"

  // Check token with all cookie variations
  let token = await getToken({ req, secret })
  if (!token) {
    token = await getToken({ req, secret, cookieName: "next-auth.session-token" })
  }
  if (!token) {
    token = await getToken({ req, secret, cookieName: "__Secure-next-auth.session-token" })
  }

  if (!token) {
    const loginUrl = new URL("/login", req.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api/auth|api/direct-login|api/download|descargar|login|_next/static|_next/image|favicon.ico|manifest.json|sw\\.js|.*\\.(?:dmg|exe|zip|png|svg|ico|jpg|jpeg|webp|pdf|json)).*)"
  ],
}