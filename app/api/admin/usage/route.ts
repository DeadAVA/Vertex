import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin'
import { prisma } from '@/lib/db'

function getLast30Days(): string[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return d.toISOString().slice(0, 10)
  })
}

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const last30 = getLast30Days()

  const [topUsage, dailyRaw] = await Promise.all([
    // Top users by total requests in last 30 days
    prisma.aiUsage.groupBy({
      by: ['userId'],
      where: { date: { in: last30 } },
      _sum: { requests: true },
      orderBy: { _sum: { requests: 'desc' } },
      take: 20,
    }),
    // Daily totals last 30 days
    prisma.aiUsage.findMany({
      where: { date: { in: last30 } },
      select: { date: true, requests: true },
    }),
  ])

  // Fetch user names for top users
  const userIds = topUsage.map(u => u.userId)
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true, subscription: { select: { plan: true } } },
  })
  const userMap = new Map(users.map(u => [u.id, u]))

  const topUsers = topUsage.map(u => ({
    userId: u.userId,
    name: userMap.get(u.userId)?.name ?? '—',
    email: userMap.get(u.userId)?.email ?? '—',
    plan: userMap.get(u.userId)?.subscription?.plan ?? 'FREE',
    total: u._sum.requests ?? 0,
  }))

  // Aggregate daily totals
  const dayMap = new Map<string, number>()
  dailyRaw.forEach(r => dayMap.set(r.date, (dayMap.get(r.date) ?? 0) + r.requests))
  const dailyChart = last30.map(d => {
    const dt = new Date(d + 'T12:00:00Z')
    return {
      label: dt.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }),
      value: dayMap.get(d) ?? 0,
    }
  })

  // Grand totals
  const totalMonth = dailyRaw.reduce((s, r) => s + r.requests, 0)
  const today = new Date().toISOString().slice(0, 10)
  const totalToday = dayMap.get(today) ?? 0
  const last7 = last30.slice(-7)
  const totalWeek = last7.reduce((s, d) => s + (dayMap.get(d) ?? 0), 0)

  return NextResponse.json({ topUsers, dailyChart, totals: { today: totalToday, week: totalWeek, month: totalMonth } })
}
