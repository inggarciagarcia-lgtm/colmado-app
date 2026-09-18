import { withAuth } from "next-auth/middleware"

export default withAuth({
  secret: process.env.NEXTAUTH_SECRET || "un_secreto_muy_seguro_para_desarrollo",
  pages: {
    signIn: "/login",
  },
})

export const config = {
  matcher: [
    "/((?!api/auth|api/direct-login|api/download|descargar|login|_next/static|_next/image|favicon.ico|manifest.json|sw\\.js|.*\\.(?:dmg|exe|zip|png|svg|ico|jpg|jpeg|webp|pdf|json)).*)"
  ],
}