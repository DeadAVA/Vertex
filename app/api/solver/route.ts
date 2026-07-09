import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import * as math from 'mathjs'

const schema = z.object({
  type: z.enum(['equation', 'derivative', 'integral', 'simplify', 'factor', 'expand', 'limit', 'system']),
  expression: z.string().min(1).max(500).optional(),
  variable: z.string().optional().default('x'),
  order: z.number().optional(),
  point: z.string().optional(),
  definite: z.boolean().optional(),
  lowerBound: z.string().optional(),
  upperBound: z.string().optional(),
  equations: z.array(z.string()).optional(),
  variables: z.array(z.string()).optional(),
})

function evalAt(expr: string, variable: string, value: number): number {
  return math.evaluate(expr, { [variable]: value }) as number
}

function bisection(expr: string, variable: string, lo: number, hi: number): number | null {
  const flo = evalAt(expr, variable, lo)
  const fhi = evalAt(expr, variable, hi)
  if (flo * fhi > 0) return null
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2
    const fm = evalAt(expr, variable, mid)
    if (Math.abs(fm) < 1e-10) return mid
    if (flo * fm < 0) hi = mid; else lo = mid
  }
  return (lo + hi) / 2
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 }) }

  let parsed: z.infer<typeof schema>
  try { parsed = schema.parse(body) } catch (e: any) {
    return NextResponse.json({ error: 'Datos inválidos: ' + e.message }, { status: 400 })
  }

  const { type, variable = 'x', point, equations, variables: vars } = parsed
  const expression = parsed.expression ?? ''

  try {
    // ── Derivative ─────────────────────────────────────────────────
    if (type === 'derivative') {
      const node = math.parse(expression)
      const deriv = math.derivative(node, variable)
      const simplified = math.simplify(deriv)
      return NextResponse.json({
        result: simplified.toString(),
        steps: [
          `f(${variable}) = ${expression}`,
          `Aplicando reglas de derivación…`,
          `f'(${variable}) = ${simplified.toString()}`,
        ],
      })
    }

    // ── Simplify ───────────────────────────────────────────────────
    if (type === 'simplify' || type === 'factor') {
      const simplified = math.simplify(expression)
      return NextResponse.json({ result: simplified.toString() })
    }

    // ── Expand ─────────────────────────────────────────────────────
    if (type === 'expand') {
      const expanded = math.simplify(expression, math.simplify.rules)
      return NextResponse.json({ result: expanded.toString() })
    }

    // ── Limit (numerical) ──────────────────────────────────────────
    if (type === 'limit') {
      const p = point ? parseFloat(point) : 0
      const eps = 1e-7
      const v1 = evalAt(expression, variable, p + eps)
      const v2 = evalAt(expression, variable, p - eps)
      const avg = Math.round(((v1 + v2) / 2) * 1e6) / 1e6
      return NextResponse.json({
        result: String(avg),
        steps: [
          `lim(${variable}→${p}) ${expression}`,
          `Evaluando cerca de ${variable} = ${p}`,
          `≈ ${avg}`,
        ],
      })
    }

    // ── Integral (numerical Simpson) ───────────────────────────────
    if (type === 'integral') {
      const a = parsed.lowerBound ? parseFloat(parsed.lowerBound) : -5
      const b = parsed.upperBound ? parseFloat(parsed.upperBound) : 5
      const n = 1000
      const h = (b - a) / n
      let sum = 0
      for (let i = 0; i <= n; i++) {
        const x = a + i * h
        const v = evalAt(expression, variable, x)
        sum += i === 0 || i === n ? v : i % 2 === 0 ? 2 * v : 4 * v
      }
      const result = Math.round((h / 3) * sum * 1e4) / 1e4
      return NextResponse.json({
        result: `∫(${a} a ${b}) = ${result}`,
        steps: [
          `∫ ${expression} d${variable}`,
          `Integración numérica de ${a} a ${b} (Regla de Simpson)`,
          `Resultado ≈ ${result}`,
        ],
      })
    }

    // ── Equation (numerical root finding) ─────────────────────────
    if (type === 'equation') {
      const parts = expression.split('=')
      if (parts.length !== 2) return NextResponse.json({ error: 'Formato: f(x) = valor' }, { status: 400 })
      const expr = `(${parts[0].trim()}) - (${parts[1].trim()})`

      const search = [-50, -20, -10, -5, -3, -2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2, 3, 5, 10, 20, 50]
      const roots: number[] = []

      for (let i = 0; i < search.length - 1; i++) {
        try {
          const root = bisection(expr, variable, search[i], search[i + 1])
          if (root !== null) {
            const rounded = Math.round(root * 1e6) / 1e6
            if (!roots.some(r => Math.abs(r - rounded) < 1e-4)) roots.push(rounded)
          }
        } catch {}
      }

      if (roots.length === 0)
        return NextResponse.json({ result: 'Sin solución real en [-50, 50]' })

      return NextResponse.json({
        solutions: roots.map(r => `${variable} = ${r}`),
        steps: [
          `Ecuación: ${expression}`,
          `Reordenada: ${expr} = 0`,
          `Raíces encontradas numéricamente:`,
          ...roots.map(r => `${variable} = ${r}`),
        ],
      })
    }

    // ── System of equations ────────────────────────────────────────
    if (type === 'system') {
      if (!equations || !vars) return NextResponse.json({ error: 'Se necesitan ecuaciones y variables.' }, { status: 400 })

      const A: number[][] = []
      const b_vec: number[] = []

      for (const eq of equations) {
        const parts = eq.split('=')
        if (parts.length !== 2) continue
        const rhs = parseFloat(parts[1].trim())
        b_vec.push(rhs)

        const row: number[] = []
        for (const v of vars) {
          const scope: Record<string, number> = {}
          vars.forEach(vv => (scope[vv] = 0))
          scope[v] = 1
          try { row.push(math.evaluate(parts[0].trim(), scope) as number) }
          catch { row.push(0) }
        }
        A.push(row)
      }

      const solution = math.lusolve(math.matrix(A), math.matrix(b_vec)) as number[][]
      const results = vars.map((v, i) => `${v} = ${Math.round((solution[i][0] ?? 0) * 1e6) / 1e6}`)

      return NextResponse.json({ solutions: results, steps: results })
    }

    return NextResponse.json({ error: 'Tipo no soportado.' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Error al procesar.' }, { status: 400 })
  }
}
