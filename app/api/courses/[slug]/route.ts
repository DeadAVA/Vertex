import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions)
  const isPremium = session?.user?.plan === 'PREMIUM'

  const course = await prisma.course.findUnique({
    where: { slug: params.slug },
    include: {
      units: {
        orderBy: { order: 'asc' },
        include: {
          problems: {
            where: isPremium ? {} : { isPremium: false },
            select: { id: true, title: true, difficulty: true, isPremium: true, statement: true, steps: true, answer: true, hints: true },
          },
        },
      },
    },
  })

  if (!course) return NextResponse.json({ error: 'Curso no encontrado.' }, { status: 404 })

  return NextResponse.json(course)
}
