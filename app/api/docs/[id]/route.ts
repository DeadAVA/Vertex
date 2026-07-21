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

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })

  const parsed = documentInput.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Documento inválido.' }, { status: 400 })

  const result = await prisma.document.updateMany({
    where: { id: params.id, userId: session.user.id },
    data: parsed.data,
  })
  if (!result.count) return NextResponse.json({ error: 'Documento no encontrado.' }, { status: 404 })

  const document = await prisma.document.findUnique({ where: { id: params.id } })
  return NextResponse.json({ document })
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })

  const result = await prisma.document.deleteMany({ where: { id: params.id, userId: session.user.id } })
  if (!result.count) return NextResponse.json({ error: 'Documento no encontrado.' }, { status: 404 })
  return NextResponse.json({ success: true })
}
