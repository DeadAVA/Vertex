import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

const documentInput = z.object({
  title: z.string().trim().max(160).optional(),
  content: z.string().max(8_000_000).optional(),
  category: z.string().trim().max(60).optional(),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })

  const documents = await prisma.document.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
  })
  return NextResponse.json({ documents })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })

  const parsed = documentInput.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Documento inválido.' }, { status: 400 })

  const document = await prisma.document.create({
    data: {
      userId: session.user.id,
      title: parsed.data.title || 'Documento sin título',
      content: parsed.data.content || '<p><br></p>',
      category: parsed.data.category || 'General',
    },
  })
  return NextResponse.json({ document }, { status: 201 })
}
