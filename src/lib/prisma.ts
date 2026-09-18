import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'

function getDatabaseUrl() {
  const possiblePaths = [
    path.resolve(process.cwd(), 'prisma/dev.db'),
    path.resolve(process.cwd(), '.next/standalone/prisma/dev.db'),
    path.resolve(process.cwd(), 'dev.db'),
    '/Users/mrgarciag/.gemini/antigravity/scratch/gestor-negocio/prisma/dev.db'
  ]

  for (const p of possiblePaths) {
    if (fs.existsSync(p) && fs.statSync(p).size > 0) {
      return `file:${p}`
    }
  }

  return process.env.DATABASE_URL || `file:${possiblePaths[0]}`
}

const dbUrl = getDatabaseUrl()

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma