import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'qwen2.5:14b'
const OLLAMA_VISION_MODEL = process.env.OLLAMA_VISION_MODEL ?? 'moondream'

const SYSTEM_PROMPT = `Eres un tutor de matemáticas. Responde SOLO con JSON válido sin bloques de código ni texto extra.

REGLA #1: CADA número, variable y expresión matemática DEBE usar LaTeX:
- Variables y términos inline: $2x$, $x$, $6$, $14$
- Ecuaciones completas (campo "expresion"): siempre entre $$...$$
- Respuesta final: $x = 4$

EJEMPLO CORRECTO para "2x + 6 = 14":
{"tipo":"Ecuación lineal","problema":"$2x + 6 = 14$","pasos":[{"numero":1,"titulo":"Restar 6 en ambos lados","explicacion":"Restamos $6$ de ambos lados para aislar el término con $x$","expresion":"$$2x + 6 - 6 = 14 - 6$$"},{"numero":2,"titulo":"Simplificar","explicacion":"El $6 - 6 = 0$ desaparece y $14 - 6 = 8$","expresion":"$$2x = 8$$"},{"numero":3,"titulo":"Dividir entre 2","explicacion":"Dividimos ambos lados entre $2$","expresion":"$$x = \\frac{8}{2} = 4$$"}],"respuesta":"$x = 4$","verificacion":"$2(4) + 6 = 8 + 6 = 14$ ✓"}

Resuelve el problema del usuario con el MISMO formato JSON y LaTeX en todo. Idioma: español.`

async function ollamaChat(model: string, messages: any[], images?: string[]): Promise<string> {
  const msgs = [...messages]
  if (images?.length) {
    const last = { ...msgs[msgs.length - 1], images }
    msgs[msgs.length - 1] = last
  }

  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: msgs,
      stream: false,
      options: { temperature: 0.1, num_predict: 2048 },
    }),
    signal: AbortSignal.timeout(120000),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Ollama ${res.status}: ${err.slice(0, 300)}`)
  }

  const data = await res.json()
  return data?.message?.content ?? ''
}

function extractJson(raw: string): any {
  const stripped = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  for (const s of [stripped, raw.trim()]) {
    try { return JSON.parse(s) } catch {}
    const m = s.match(/\{[\s\S]*\}/)
    if (m) {
      try { return JSON.parse(m[0]) } catch {}
      try { return JSON.parse(m[0].replace(/,(\s*[}\]])/g, '$1')) } catch {}
    }
  }
  return null
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })

  let body: { text?: string; image?: string; imageType?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  if (!body.text && !body.image) {
    return NextResponse.json({ error: 'Se necesita texto o imagen.' }, { status: 400 })
  }

  try {
    let problemText = body.text?.trim() ?? ''

    // ── Paso 1: leer la imagen con modelo de visión ────────────────────────
    if (body.image) {
      const extracted = await ollamaChat(
        OLLAMA_VISION_MODEL,
        [{
          role: 'user',
          content: 'Extrae SOLO el problema o ecuación matemática que aparece en esta imagen. Devuelve únicamente el enunciado del problema, sin explicaciones adicionales.',
        }],
        [body.image]
      )
      const clean = extracted.trim()
      if (clean) {
        problemText = body.text ? `${body.text}\n(De la imagen: ${clean})` : clean
      }
    }

    if (!problemText) {
      return NextResponse.json({ error: 'No se pudo extraer el problema de la imagen.' }, { status: 400 })
    }

    // ── Paso 2: resolver con modelo de matemáticas ─────────────────────────
    const raw = await ollamaChat(OLLAMA_MODEL, [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: problemText },
    ])

    const parsed = extractJson(raw)

    if (!parsed) {
      return NextResponse.json({
        tipo: 'Solución',
        problema: problemText,
        pasos: [{ numero: 1, titulo: 'Resolución', explicacion: raw, expresion: '' }],
        respuesta: '',
      })
    }

    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 })
    return NextResponse.json(parsed)

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
