import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { encode } from "next-auth/jwt"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const redirectPath = url.searchParams.get("redirect") || "/pos"
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3001"
    const proto = req.headers.get("x-forwarded-proto") || "http"
    const baseUrl = `${proto}://${host}`

    const user = await prisma.user.findFirst({
      orderBy: { createdAt: "asc" }
    })

    if (!user) {
      return NextResponse.redirect(`${baseUrl}/login`, { status: 302 })
    }

    const secret = process.env.NEXTAUTH_SECRET || "un_secreto_muy_seguro_para_desarrollo"
    const token = await encode({
      token: {
        id: user.id,
        email: user.email,
        name: user.name,
        sub: user.id,
      },
      secret,
    })

    const targetUrl = redirectPath.startsWith("http") ? redirectPath : `${baseUrl}${redirectPath.startsWith("/") ? "" : "/"}${redirectPath}`
    const response = NextResponse.redirect(targetUrl, { status: 302 })

    // Set for HTTP (localhost and local network IP)
    response.cookies.set("next-auth.session-token", token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: false,
      maxAge: 30 * 24 * 60 * 60,
    })

    // Set for HTTPS (Cloudflare tunnel and mobile browsers)
    response.cookies.set("__Secure-next-auth.session-token", token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: true,
      maxAge: 30 * 24 * 60 * 60,
    })

    return response
  } catch (err: any) {
    console.error("Direct login GET route error:", err)
    return NextResponse.redirect("/login", { status: 302 })
  }
}

export async function POST(req: Request) {
  try {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3001"
    const proto = req.headers.get("x-forwarded-proto") || "http"
    const baseUrl = `${proto}://${host}`

    let email = ""
    let password = ""

    const contentType = req.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
      const body = await req.json()
      email = body.email || ""
      password = body.password || ""
    } else {
      const formData = await req.formData()
      email = (formData.get("email") as string) || ""
      password = (formData.get("password") as string) || ""
    }

    email = email.trim().toLowerCase()
    password = password.trim()

    const user = await prisma.user.findFirst({
      where: { email }
    })

    if (!user) {
      if (contentType.includes("application/json")) {
        return NextResponse.json({ error: "Usuario o datos incorrectos" }, { status: 401 })
      }
      return NextResponse.redirect(`${baseUrl}/login?error=1`, { status: 302 })
    }

    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      if (contentType.includes("application/json")) {
        return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 })
      }
      return NextResponse.redirect(`${baseUrl}/login?error=1`, { status: 302 })
    }

    const secret = process.env.NEXTAUTH_SECRET || "un_secreto_muy_seguro_para_desarrollo"
    const token = await encode({
      token: {
        id: user.id,
        email: user.email,
        name: user.name,
        sub: user.id,
      },
      secret,
    })

    const response = contentType.includes("application/json")
      ? NextResponse.json({ success: true, redirect: `${baseUrl}/` })
      : NextResponse.redirect(`${baseUrl}/`, { status: 302 })

    // Set for HTTP (localhost and local network IP)
    response.cookies.set("next-auth.session-token", token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: false,
      maxAge: 30 * 24 * 60 * 60,
    })

    // Set for HTTPS (Cloudflare tunnel and mobile browsers)
    response.cookies.set("__Secure-next-auth.session-token", token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: true,
      maxAge: 30 * 24 * 60 * 60,
    })

    return response
  } catch (err: any) {
    console.error("Direct login route error:", err)
    return NextResponse.json({ error: "Error interno al iniciar sesión" }, { status: 500 })
  }
}
