import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "un_secreto_muy_seguro_para_desarrollo",
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@empresa.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = credentials.email.trim().toLowerCase()
        const password = credentials.password.trim()

        // Check if this is the very first login ever (no users in DB)
        const userCount = await prisma.user.count()
        if (userCount === 0) {
           const hashedPassword = await bcrypt.hash(password, 10)
           const newUser = await prisma.user.create({
             data: {
               email: email,
               password: hashedPassword,
               name: "Admin"
             }
           })
           return { id: newUser.id, email: newUser.email, name: newUser.name }
        }

        const user = await prisma.user.findFirst({
          where: { 
            email: {
              equals: email
            }
          }
        })

        if (!user) return null

        const passwordMatch = await bcrypt.compare(password, user.password)
        if (!passwordMatch) return null

        return { id: user.id, email: user.email, name: user.name }
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
}