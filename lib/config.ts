import { prisma } from '@/lib/db'

export async function getConfig(key: string): Promise<string | null> {
  try {
    const rows = await prisma.$queryRaw<{ value: string }[]>`
      SELECT value FROM "Config" WHERE key = ${key} LIMIT 1
    `
    return rows[0]?.value ?? null
  } catch {
    return null
  }
}

export async function setConfig(key: string, value: string): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO "Config" (key, value, "updatedAt")
    VALUES (${key}, ${value}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = ${value}, "updatedAt" = NOW()
  `
}
