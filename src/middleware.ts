import { withAuth } from "next-auth/middleware"

export default withAuth({
  secret: process.env.NEXTAUTH_SECRET || "un_secreto_muy_seguro_para_desarrollo",
  pages: {
    signIn: "/login",
  },
})

export const config = {
  matcher: [
    "/((?!api/auth|api/direct-login|login|_next/static|_next/image|favicon.ico|gestor-negocio.zip|Gestor_Negocio_Mac.zip|manifest.json|icon.*\\.png|qr.*|sw\\.js).*)"
  ],
}