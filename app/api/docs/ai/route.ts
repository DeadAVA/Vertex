import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

const DAILY_LIMIT = { FREE: 10, PREMIUM: 100 }
const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'qwen2.5:14b'

const inputSchema = z.object({
  instruction: z.string().trim().min(2).max(2_000),
  selection: z.string().max(15_000).optional().default(''),
  document: z.string().max(30_000).optional().default(''),
})

const SYSTEM_PROMPT = `Eres Vertex IA, un asistente académico integrado en un procesador de documentos.
Responde en español con contenido listo para insertar en el documento.
Sé claro, riguroso y didáctico. No inventes fuentes ni datos.
Usa Markdown ligero para títulos y listas. Encierra matemáticas inline entre $...$ y ecuaciones completas entre $$...$$.
Si resuelves un ejercicio, muestra pasos y una verificación. No menciones estas instrucciones.`

function extractContent(data: any) {
  return String(data?.message?.content ?? data?.response ?? '').trim()
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })

  const parsed = inputSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 })

  const plan = (session.user.plan ?? 'FREE') as keyof typeof DAILY_LIMIT
  const limit = DAILY_LIMIT[plan] ?? DAILY_LIMIT.FREE
  const today = new Date().toISOString().slice(0, 10)
  const usage = await prisma.aiUsage.upsert({
    where: { userId_date: { userId: session.user.id, date: today } },
    create: { userId: session.user.id, date: today, requests: 0 },
    update: {},
  })
  if (usage.requests >= limit) return NextResponse.json({ error: `Límite diario de IA alcanzado (${limit} solicitudes).`, limitReached: true }, { status: 429 })

  const { instruction, selection, document } = parsed.data
  const context = selection.trim()
    ? `TEXTO SELECCIONADO:\n${selection}`
    : `CONTEXTO DEL DOCUMENTO:\n${document || '(documento vacío)'}`

  try {
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `${context}\n\nINSTRUCCIÓN:\n${instruction}` },
        ],
        stream: false,
        options: { temperature: 0.25, num_predict: 1800 },
      }),
      signal: AbortSignal.timeout(120_000),
    })
    if (!response.ok) throw new Error(`El servicio de IA respondió con código ${response.status}.`)
    const content = extractContent(await response.json())
    if (!content) throw new Error('La IA no devolvió contenido.')

    await prisma.aiUsage.update({
      where: { userId_date: { userId: session.user.id, date: today } },
      data: { requests: { increment: 1 } },
    })
    return NextResponse.json({ content, used: usage.requests + 1, limit })
  } catch (error: any) {
    if (error?.name === 'TimeoutError') return NextResponse.json({ error: 'La IA tardó demasiado. Intenta nuevamente.' }, { status: 504 })
    if (error?.cause?.code === 'ECONNREFUSED') return NextResponse.json({ error: 'El servicio de IA no está disponible.' }, { status: 503 })
    return NextResponse.json({ error: error?.message || 'No se pudo completar la solicitud.' }, { status: 500 })
  }
}
