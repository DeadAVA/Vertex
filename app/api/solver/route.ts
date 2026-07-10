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

// Accept common math notation: x^2 → x**2, 2x → 2*x, )( → )*(
function normalizeExpr(s: string): string {
  return s
    .replace(/\^/g, '**')
    .replace(/(\d)\s*([a-zA-Z(])/g, '$1*$2')
    .replace(/\)\s*\(/g, ')*(')
    .replace(/\)\s*([a-zA-Z])/g, ')*$1')
}

function toLatex(node: math.MathNode): string {
  try {
    return node.toTex({ parenthesis: 'auto' })
  } catch {
    return node.toString()
  }
}

function evalAt(expr: string, variable: string, value: number): number {
  return math.evaluate(expr, { [variable]: value }) as number
}

function bisectionCompiled(
  compiled: { evaluate: (s: Record<string, number>) => number },
  variable: string,
  lo: number,
  hi: number
): number | null {
  try {
    const flo = compiled.evaluate({ [variable]: lo })
    const fhi = compiled.evaluate({ [variable]: hi })
    if (!isFinite(flo) || !isFinite(fhi) || flo * fhi > 0) return null
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2
      const fm = compiled.evaluate({ [variable]: mid })
      if (Math.abs(fm) < 1e-10) return mid
      if (flo * fm < 0) hi = mid; else lo = mid
    }
    return (lo + hi) / 2
  } catch {
    return null
  }
}

function solveQuadratic(a: number, b: number, c: number): string[] {
  const d = b * b - 4 * a * c
  if (Math.abs(d) < 1e-10) {
    const r = -b / (2 * a)
    return [`x = ${fmt(r)}`]
  }
  if (d > 0) {
    const r1 = (-b + Math.sqrt(d)) / (2 * a)
    const r2 = (-b - Math.sqrt(d)) / (2 * a)
    return [`x = ${fmt(r1)}`, `x = ${fmt(r2)}`]
  }
  const re = -b / (2 * a)
  const im = Math.sqrt(-d) / (2 * a)
  return [`x = ${fmt(re)} + ${fmt(im)}i`, `x = ${fmt(re)} - ${fmt(im)}i`]
}

function fmt(n: number): string {
  return Math.round(n * 1e8) / 1e8 + ''
}

function factorQuadratic(expr: string, variable: string): string | null {
  try {
    // Coefficient of x^2 via second finite difference / 2
    const a = (evalAt(expr, variable, 2) - 2 * evalAt(expr, variable, 1) + evalAt(expr, variable, 0)) / 2
    if (Math.abs(a) < 1e-9) return null // linear or constant — not factorable as quadratic
    const c = evalAt(expr, variable, 0)
    const b = evalAt(expr, variable, 1) - c - a
    const d = b * b - 4 * a * c
    if (d < -1e-9) return null // complex roots
    const r1 = (-b + Math.sqrt(Math.max(0, d))) / (2 * a)
    const r2 = (-b - Math.sqrt(Math.max(0, d))) / (2 * a)
    const sign1 = r1 >= 0 ? '-' : '+'
    const sign2 = r2 >= 0 ? '-' : '+'
    if (Math.abs(d) < 1e-9) {
      return `${fmt(a)}(${variable} ${sign1} ${fmt(Math.abs(r1))})^{2}`
    }
    const aStr = Math.abs(a - 1) < 1e-9 ? '' : Math.abs(a + 1) < 1e-9 ? '-' : fmt(a)
    return `${aStr}(${variable} ${sign1} ${fmt(Math.abs(r1))})(${variable} ${sign2} ${fmt(Math.abs(r2))})`
  } catch {
    return null
  }
}

// Simple per-user in-memory rate limit: 60 requests / minute
const rateMap = new Map<string, { count: number; resetAt: number }>()
function checkRateLimit(key: string, limit = 60, windowMs = 60_000): boolean {
  const now = Date.now()
  const entry = rateMap.get(key)
  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

// Only a-z / A-Z followed by alphanumerics — prevents prototype pollution via variable names
const VAR_PATTERN = /^[a-zA-Z][a-zA-Z0-9]*$/

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })

  if (!checkRateLimit(session.user.id)) {
    return NextResponse.json({ error: 'Demasiadas solicitudes. Espera un momento.' }, { status: 429 })
  }

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 }) }

  let parsed: z.infer<typeof schema>
  try { parsed = schema.parse(body) } catch (e: any) {
    return NextResponse.json({ error: 'Datos inválidos: ' + e.message }, { status: 400 })
  }

  const { type, variable = 'x', point, equations, variables: vars } = parsed
  const rawExpr = parsed.expression ?? ''
  const expression = normalizeExpr(rawExpr)

  // Validate expression parseability — but NOT for equation (contains '=' which mathjs treats as
  // assignment and rejects) and NOT for system (equations are handled individually below).
  if (type !== 'system' && type !== 'equation' && expression) {
    try { math.parse(expression) } catch (e: any) {
      return NextResponse.json({ error: `Expresión inválida: ${e.message}` }, { status: 400 })
    }
  }

  try {
    // ── Derivative ─────────────────────────────────────────────────
    if (type === 'derivative') {
      const node = math.parse(expression)
      const fLatex = toLatex(node)
      const derivStr = math.derivative(node, variable).toString()
      const simplified = math.simplify(derivStr)
      const latex = toLatex(simplified)
      return NextResponse.json({
        result: derivStr,
        latex,
        steps: [
          { label: `f(${variable})`, latex: fLatex },
          { label: 'Diferenciando', latex: `\\frac{d}{d${variable}}\\left[${fLatex}\\right]` },
          { label: `f'(${variable})`, latex },
        ],
      })
    }

    // ── Simplify ───────────────────────────────────────────────────
    if (type === 'simplify') {
      const simplified = math.simplify(expression)
      const latex = toLatex(simplified)
      return NextResponse.json({
        result: simplified.toString(),
        latex,
        steps: [
          { label: 'Original', latex: toLatex(math.parse(expression)) },
          { label: 'Simplificado', latex },
        ],
      })
    }

    // ── Factor ─────────────────────────────────────────────────────
    if (type === 'factor') {
      const origLatex = toLatex(math.parse(expression))
      const factored = factorQuadratic(expression, variable)
      if (factored) {
        return NextResponse.json({
          result: factored,
          latex: factored,
          steps: [
            { label: 'Expresión', latex: origLatex },
            { label: 'Factorizada', latex: factored },
          ],
        })
      }
      const simplified = math.simplify(expression)
      const latex = toLatex(simplified)
      return NextResponse.json({
        result: simplified.toString(),
        latex,
        steps: [{ label: 'Simplificado', latex }],
      })
    }

    // ── Expand ─────────────────────────────────────────────────────
    if (type === 'expand') {
      const node = math.parse(expression)
      const origLatex = toLatex(node)
      let expanded: math.MathNode
      try {
        expanded = math.simplify(expression, [
          { l: 'n1*(n2+n3)', r: 'n1*n2+n1*n3' },
          { l: '(n1+n2)*n3', r: 'n1*n3+n2*n3' },
          { l: 'n1*(n2-n3)', r: 'n1*n2-n1*n3' },
          { l: '(n1-n2)*n3', r: 'n1*n3-n2*n3' },
          'n1*n1 -> n1^2',
        ])
      } catch {
        expanded = math.simplify(expression)
      }
      const latex = toLatex(expanded)
      return NextResponse.json({
        result: expanded.toString(),
        latex,
        steps: [
          { label: 'Original', latex: origLatex },
          { label: 'Expandido', latex },
        ],
      })
    }

    // ── Limit (numerical) ──────────────────────────────────────────
    if (type === 'limit') {
      const p = point ? parseFloat(point) : 0
      const eps = 1e-7
      // evalAt can throw (e.g. sqrt(x-2) near x=0); treat thrown as non-finite
      let v1: number, v2: number
      try { v1 = evalAt(expression, variable, p + eps) } catch { v1 = Infinity }
      try { v2 = evalAt(expression, variable, p - eps) } catch { v2 = Infinity }
      if (!isFinite(v1) || !isFinite(v2)) {
        return NextResponse.json({
          result: '∞ (no existe)',
          latex: '\\infty',
          steps: [
            { label: 'Límite', latex: `\\lim_{${variable} \\to ${p}} ${toLatex(math.parse(expression))}` },
            { label: 'Resultado', latex: '\\text{No existe (diverge)}' },
          ],
        })
      }
      const avg = Math.round(((v1 + v2) / 2) * 1e8) / 1e8
      const exprLatex = toLatex(math.parse(expression))
      return NextResponse.json({
        result: String(avg),
        latex: String(avg),
        steps: [
          { label: 'Límite', latex: `\\lim_{${variable} \\to ${p}} ${exprLatex}` },
          { label: 'Aproximación numérica', latex: `\\approx ${avg}` },
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
        try {
          const v = evalAt(expression, variable, x)
          sum += i === 0 || i === n ? v : i % 2 === 0 ? 2 * v : 4 * v
        } catch {}
      }
      const result = Math.round((h / 3) * sum * 1e6) / 1e6
      const exprLatex = toLatex(math.parse(expression))
      return NextResponse.json({
        result: String(result),
        latex: String(result),
        steps: [
          { label: 'Integral', latex: `\\int_{${a}}^{${b}} ${exprLatex}\\, d${variable}` },
          { label: 'Método', latex: '\\text{Regla de Simpson con 1000 intervalos}' },
          { label: 'Resultado', latex: `\\approx ${result}` },
        ],
      })
    }

    // ── Equation ───────────────────────────────────────────────────
    if (type === 'equation') {
      const eqParts = expression.split('=')
      if (eqParts.length !== 2) {
        return NextResponse.json({ error: 'Formato: f(x) = valor  (solo ecuaciones con =)' }, { status: 400 })
      }
      const lhs = eqParts[0].trim()
      const rhs = eqParts[1].trim()
      // Reject inequalities that split on '=' e.g. ">=" or "<="
      if (lhs.endsWith('>') || lhs.endsWith('<') || rhs.startsWith('>') || rhs.startsWith('<')) {
        return NextResponse.json({ error: 'Solo se soportan ecuaciones con =, no desigualdades.' }, { status: 400 })
      }
      const residual = `(${lhs})-(${rhs})`

      let solutions: string[] = []
      let solutionLatex: string[] = []

      const compiled = math.compile(residual)
      const ev = (v: number) => { try { return compiled.evaluate({ [variable]: v }) as number } catch { return NaN } }

      try {
        const at0 = ev(0), at1 = ev(1), at2 = ev(2), at3 = ev(3)
        const d2 = at2 - 2 * at1 + at0
        const d3 = at3 - 3 * at2 + 3 * at1 - at0
        const isLinear = Math.abs(d2) < 1e-7
        const isQuadratic = !isLinear && Math.abs(d3) < 1e-6

        if (isLinear) {
          const slope = at1 - at0
          if (Math.abs(slope) > 1e-10) {
            const root = Math.round(-at0 / slope * 1e8) / 1e8
            solutions = [`${variable} = ${root}`]
            solutionLatex = solutions
          }
        } else if (isQuadratic) {
          const a = d2 / 2
          const b = at1 - at0 - a
          const c = at0
          solutions = solveQuadratic(a, b, c)
          solutionLatex = solutions
        }
      } catch {}

      // Numerical bisection to catch roots symbolic analysis might miss
      const search = [-100,-50,-20,-10,-5,-3,-2,-1,-0.5,0,0.5,1,2,3,5,10,20,50,100]
      const roots: number[] = []
      for (let i = 0; i < search.length - 1; i++) {
        const r = bisectionCompiled(compiled as any, variable, search[i], search[i + 1])
        if (r !== null) {
          const rounded = Math.round(r * 1e6) / 1e6
          if (!roots.some(x => Math.abs(x - rounded) < 1e-4)) roots.push(rounded)
        }
      }
      if (solutions.length === 0 && roots.length > 0) {
        solutions = roots.map(r => `${variable} = ${r}`)
        solutionLatex = solutions
      }
      if (solutions.length === 0) solutions = ['Sin solución real en [-100, 100]']

      // Deduplicate numerical roots vs symbolic — skip complex symbolic roots to avoid false drops
      for (const r of roots) {
        const s = `${variable} = ${Math.round(r * 1e6) / 1e6}`
        const isDuplicate = solutionLatex.some(sl => {
          if (sl.includes('i')) return false // complex root — never a duplicate of a real one
          const num = parseFloat(sl.split('=')[1])
          return !isNaN(num) && Math.abs(num - r) < 1e-4
        })
        if (!solutionLatex.includes(s) && !isDuplicate) solutionLatex.push(s)
      }

      const lhsLatex = toLatex(math.parse(lhs))
      const rhsLatex = toLatex(math.parse(rhs))

      return NextResponse.json({
        solutions: solutionLatex,
        solutionLatex,
        steps: [
          { label: 'Ecuación', latex: `${lhsLatex} = ${rhsLatex}` },
          ...solutionLatex.map(s => ({ label: 'Solución', latex: s })),
        ],
      })
    }

    // ── System of equations (linear only) ─────────────────────────
    if (type === 'system') {
      if (!equations || !vars) {
        return NextResponse.json({ error: 'Se necesitan ecuaciones y variables.' }, { status: 400 })
      }
      // Prevent prototype pollution via crafted variable names
      if (!vars.every(v => VAR_PATTERN.test(v))) {
        return NextResponse.json({ error: 'Nombres de variable inválidos.' }, { status: 400 })
      }

      const A: number[][] = []
      const b_vec: number[] = []

      for (const eq of equations) {
        const normEq = normalizeExpr(eq)
        const parts = normEq.split('=')
        if (parts.length !== 2) continue
        const rhs = parseFloat(parts[1].trim())
        if (isNaN(rhs)) {
          return NextResponse.json({
            error: 'El lado derecho de cada ecuación debe ser una constante numérica (ej: "2x + y = 5").',
          }, { status: 400 })
        }
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

      if (A.length === 0 || A.length !== b_vec.length) {
        return NextResponse.json({ error: 'Sistema inválido. Verifica que cada ecuación tenga el formato "expresión = número".' }, { status: 400 })
      }

      let solution: number[][]
      try {
        solution = math.lusolve(math.matrix(A), math.matrix(b_vec)) as unknown as number[][]
      } catch {
        return NextResponse.json({
          error: 'El sistema no tiene solución única (puede ser inconsistente o dependiente).',
        }, { status: 400 })
      }

      const results = vars.map((v, i) => `${v} = ${fmt(solution[i][0] ?? 0)}`)

      return NextResponse.json({
        solutions: results,
        solutionLatex: results,
        steps: results.map(r => ({ label: 'Solución', latex: r })),
      })
    }

    return NextResponse.json({ error: 'Tipo no soportado.' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Error al procesar.' }, { status: 500 })
  }
}
