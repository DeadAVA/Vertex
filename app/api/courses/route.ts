import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const courses = await prisma.course.findMany({
    orderBy: { order: 'asc' },
    include: {
      units: {
        orderBy: { order: 'asc' },
        select: { id: true, slug: true, title: true, order: true, isPremium: true, _count: { select: { problems: true } } },
      },
    },
  })
  return NextResponse.json(courses)
}
