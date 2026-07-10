import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin'
import { prisma } from '@/lib/db'

const PAGE_SIZE = 20

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? ''
  const plan = searchParams.get('plan') ?? 'ALL'
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const today = new Date().toISOString().slice(0, 10)

  const searchFilter = q
    ? { OR: [
        { name: { contains: q, mode: 'insensitive' as const } },
        { email: { contains: q, mode: 'insensitive' as const } },
      ]}
    : {}

  const planFilter =
    plan === 'PREMIUM'
      ? { subscription: { plan: 'PREMIUM' as const } }
      : plan === 'FREE'
        ? { OR: [{ subscription: null }, { subscription: { plan: 'FREE' as const } }] }
        : {}

  const where = { AND: [searchFilter, planFilter] }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        subscription: { select: { plan: true, status: true, currentPeriodEnd: true } },
        aiUsage: { where: { date: today }, select: { requests: true } },
        progress: { orderBy: { lastSeen: 'desc' }, take: 1, select: { lastSeen: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.user.count({ where }),
  ])

  return NextResponse.json({
    users: users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      plan: u.subscription?.plan ?? 'FREE',
      subStatus: u.subscription?.status ?? null,
      periodEnd: u.subscription?.currentPeriodEnd ?? null,
      aiToday: u.aiUsage[0]?.requests ?? 0,
      lastSeen: u.progress[0]?.lastSeen ?? null,
      createdAt: u.createdAt,
    })),
    total,
    pages: Math.ceil(total / PAGE_SIZE),
    page,
  })
}
