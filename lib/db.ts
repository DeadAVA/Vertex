import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function buildUrl(): string {
  const base = process.env.DATABASE_URL
  if (!base) throw new Error('DATABASE_URL is not set')
  // Neon auto-suspends idle computes and terminates connections (E57P01).
  // These params give Prisma more time to reconnect and reduce pool pressure.
  const extras: [string, string][] = [
    ['connect_timeout', '30'],
    ['pool_timeout', '30'],
    ['connection_limit', '5'],
  ]
  let url = base
  for (const [key, val] of extras) {
    if (!url.includes(key)) {
      url += (url.includes('?') ? '&' : '?') + `${key}=${val}`
    }
  }
  return url
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // 'error' level includes Neon's expected reconnection events (E57P01).
    // They are handled internally by Prisma — only show warnings and above.
    log: process.env.NODE_ENV === 'development' ? ['warn'] : ['error'],
    datasources: { db: { url: buildUrl() } },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
