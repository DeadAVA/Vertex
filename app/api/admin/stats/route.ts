import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin'
import { prisma } from '@/lib/db'

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
}

function getLast14Days(): string[] {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    return d.toISOString().slice(0, 10)
  })
}

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const today = new Date().toISOString().slice(0, 10)
  const last7 = getLast7Days()
  const last14 = getLast14Days()
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const monthStr = monthAgo.toISOString().slice(0, 10)

  const [
    totalUsers,
    premiumCount,
    todayAI,
    weekAI,
    monthAI,
    aiByDay,
    newUsersRaw,
    recentUsers,
    totalAttempts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.count({ where: { plan: 'PREMIUM', status: 'ACTIVE' } }),
    prisma.aiUsage.aggregate({ where: { date: today }, _sum: { requests: true } }),
    prisma.aiUsage.aggregate({ where: { date: { in: last7 } }, _sum: { requests: true } }),
    prisma.aiUsage.aggregate({ where: { date: { gte: monthStr } }, _sum: { requests: true } }),
    prisma.aiUsage.findMany({ where: { date: { in: last7 } }, select: { date: true, requests: true } }),
    prisma.user.findMany({ where: { createdAt: { gte: twoWeeksAgo } }, select: { createdAt: true } }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { subscription: { select: { plan: true } } },
    }),
    prisma.problemAttempt.count(),
  ])

  // Aggregate AI usage by date
  const aiMap = new Map<string, number>()
  aiByDay.forEach(r => aiMap.set(r.date, (aiMap.get(r.date) ?? 0) + r.requests))
  const aiLast7 = last7.map(d => {
    const dt = new Date(d + 'T12:00:00Z')
    return {
      label: dt.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }),
      value: aiMap.get(d) ?? 0,
    }
  })

  // Group new users by day
  const userMap = new Map<string, number>()
  newUsersRaw.forEach(u => {
    const key = u.createdAt.toISOString().slice(0, 10)
    userMap.set(key, (userMap.get(key) ?? 0) + 1)
  })
  const newUsersLast14 = last14.map(d => {
    const dt = new Date(d + 'T12:00:00Z')
    return {
      label: dt.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }),
      value: userMap.get(d) ?? 0,
    }
  })

  return NextResponse.json({
    users: {
      total: totalUsers,
      premium: premiumCount,
      free: totalUsers - premiumCount,
    },
    ai: {
      today: todayAI._sum.requests ?? 0,
      week: weekAI._sum.requests ?? 0,
      month: monthAI._sum.requests ?? 0,
    },
    attempts: totalAttempts,
    aiLast7,
    newUsersLast14,
    recentUsers: recentUsers.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      plan: u.subscription?.plan ?? 'FREE',
      createdAt: u.createdAt,
    })),
  })
}
