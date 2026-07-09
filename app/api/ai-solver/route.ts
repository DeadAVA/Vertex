import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

const DAILY_LIMIT = { FREE: 10, PREMIUM: 100 }

const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'qwen2.5:14b'
const OLLAMA_VISION_MODEL = process.env.OLLAMA_VISION_MODEL ?? 'moondream'

const SYSTEM_PROMPT = `Eres un tutor de matemáticas. Responde SOLO con JSON válido sin bloques de código ni texto extra.

REGLA #1: Usa LaTeX para toda expresión matemática:
- Términos inline: $2x$, $x$, $6$
- Ecuaciones completas en campo "expresion": $$2x = 8$$

REGLA #2: En JSON los backslashes de LaTeX van DOBLES: \\\\frac, \\\\sqrt, \\\\pi

EJEMPLO para "2x + 6 = 14":
{"tipo":"Ecuación lineal","problema":"$2x + 6 = 14$","pasos":[{"numero":1,"titulo":"Restar 6","explicacion":"Restamos $6$ de ambos lados","expresion":"$$2x = 8$$"},{"numero":2,"titulo":"Dividir entre 2","explicacion":"Dividimos entre $2$","expresion":"$$x = \\\\frac{8}{2} = 4$$"}],"respuesta":"$x = 4$","verificacion":"$2(4)+6=14$ ✓"}

Responde con el MISMO formato. Idioma: español.`

async function fetchOllama(endpoint: string, body: object): Promise<any> {
  const res = await fetch(`${OLLAMA_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120000),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Ollama ${res.status}: ${err.slice(0, 300)}`)
  }
  return res.json()
}

// Vision step: uses /api/generate (moondream compatible)
async function extractFromImage(base64: string): Promise<string> {
  const data = await fetchOllama('/api/generate', {
    model: OLLAMA_VISION_MODEL,
    prompt: 'Extract ONLY the mathematical problem, equation, or exercise shown in this image. Return just the problem text, nothing else. If text is in Spanish, keep it in Spanish.',
    images: [base64],
    stream: false,
    options: { num_predict: 300, temperature: 0 },
  })
  return (data.response ?? '').trim()
}

// Math step: uses /api/chat
async function solveMath(problem: string): Promise<string> {
  const data = await fetchOllama('/api/chat', {
    model: OLLAMA_MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: problem },
    ],
    stream: false,
    options: { temperature: 0.1, num_predict: 2048 },
  })
  return (data?.message?.content ?? '').trim()
}

// LLMs often write LaTeX backslashes unescaped in JSON: \frac → should be \\frac
// Lookbehind (?<!\\) prevents double-escaping an already-correct \\frac
function fixLatexBackslashes(s: string): string {
  return s.replace(/(?<!\\)\\([a-zA-Z{}\[\]|()^_])/g, '\\\\$1')
}

function extractJson(raw: string): any {
  const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

  for (const s of [stripped, raw.trim()]) {
    try { return JSON.parse(s) } catch {}

    const m = s.match(/\{[\s\S]*\}/)
    if (!m) continue
    const block = m[0]

    try { return JSON.parse(block) } catch {}
    try { return JSON.parse(fixLatexBackslashes(block)) } catch {}

    const noCommas = block.replace(/,(\s*[}\]])/g, '$1')
    try { return JSON.parse(noCommas) } catch {}
    try { return JSON.parse(fixLatexBackslashes(noCommas)) } catch {}
  }
  return null
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })

  // ── Token limit check ─────────────────────────────────────────
  const plan = (session.user.plan ?? 'FREE') as 'FREE' | 'PREMIUM'
  const limit = DAILY_LIMIT[plan]
  const today = new Date().toISOString().slice(0, 10) // "YYYY-MM-DD" UTC

  const usage = await prisma.aiUsage.upsert({
    where: { userId_date: { userId: session.user.id, date: today } },
    create: { userId: session.user.id, date: today, requests: 0 },
    update: {},
  })

  if (usage.requests >= limit) {
    return NextResponse.json({
      error: `Límite diario alcanzado (${limit} solicitudes). ${plan === 'FREE' ? 'Actualiza a Premium para más.' : 'Se restablece mañana a medianoche UTC.'}`,
      limitReached: true,
      used: usage.requests,
      limit,
      plan,
    }, { status: 429 })
  }

  let body: { text?: string; image?: string; imageType?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  if (!body.text && !body.image) {
    return NextResponse.json({ error: 'Se necesita texto o imagen.' }, { status: 400 })
  }

  try {
    let problemText = body.text?.trim() ?? ''

    // ── Paso 1: extraer problema de la imagen ─────────────────────────────
    if (body.image) {
      const extracted = await extractFromImage(body.image)
      if (extracted) {
        problemText = body.text?.trim()
          ? `${body.text.trim()}\n(De la imagen: ${extracted})`
          : extracted
      }
    }

    if (!problemText) {
      return NextResponse.json({ error: 'No se pudo extraer el problema de la imagen.' }, { status: 400 })
    }

    // ── Paso 2: resolver con modelo de matemáticas ─────────────────────────
    const raw = await solveMath(problemText)

    // Increment usage counter after successful model call
    await prisma.aiUsage.update({
      where: { userId_date: { userId: session.user.id, date: today } },
      data: { requests: { increment: 1 } },
    })

    const parsed = extractJson(raw)

    if (!parsed) {
      return NextResponse.json({
        tipo: 'Solución',
        problema: problemText,
        pasos: [{ numero: 1, titulo: 'Resolución', explicacion: raw, expresion: '' }],
        respuesta: '',
        used: usage.requests + 1,
        limit,
      })
    }

    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 })
    return NextResponse.json({ ...parsed, used: usage.requests + 1, limit })

  } catch (err: any) {
    if (err.name === 'TimeoutError') {
      return NextResponse.json({ error: 'El modelo tardó demasiado. Intenta de nuevo.' }, { status: 504 })
    }
    if (err.cause?.code === 'ECONNREFUSED') {
      return NextResponse.json({ error: `No se puede conectar a Ollama en ${OLLAMA_URL}. ¿Está corriendo?` }, { status: 503 })
    }
    return NextResponse.json({ error: err.message ?? 'Error desconocido.' }, { status: 500 })
  }
}
