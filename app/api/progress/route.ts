import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  courseId: z.string(),
  unitId: z.string().optional(),
  completed: z.boolean().optional(),
  score: z.number().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })

  const progress = await prisma.progress.findMany({
    where: { userId: session.user.id },
    orderBy: { lastSeen: 'desc' },
  })

  return NextResponse.json(progress)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })

  const body = await req.json()
  const { courseId, unitId, completed, score } = schema.parse(body)

  const progress = await prisma.progress.upsert({
    where: { userId_courseId_unitId: { userId: session.user.id, courseId, unitId: unitId ?? '' } },
    update: { completed: completed ?? false, score, lastSeen: new Date() },
    create: { userId: session.user.id, courseId, unitId: unitId ?? null, completed: completed ?? false, score },
  })

  return NextResponse.json(progress)
}
