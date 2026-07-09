import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

const DAILY_LIMIT = { FREE: 10, PREMIUM: 100 }

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })

  const plan = (session.user.plan ?? 'FREE') as 'FREE' | 'PREMIUM'
  const limit = DAILY_LIMIT[plan]
  const today = new Date().toISOString().slice(0, 10)

  const usage = await prisma.aiUsage.findUnique({
    where: { userId_date: { userId: session.user.id, date: today } },
  })

  const used = usage?.requests ?? 0

  // Midnight UTC reset info
  const now = new Date()
  const midnight = new Date(now)
  midnight.setUTCHours(24, 0, 0, 0)
  const resetInMs = midnight.getTime() - now.getTime()
  const resetInHours = Math.floor(resetInMs / 3600000)
  const resetInMins = Math.floor((resetInMs % 3600000) / 60000)

  return NextResponse.json({
    used,
    limit,
    remaining: Math.max(0, limit - used),
    plan,
    resetIn: `${resetInHours}h ${resetInMins}m`,
    resetAt: midnight.toISOString(),
    percent: Math.min(100, Math.round((used / limit) * 100)),
  })
}
