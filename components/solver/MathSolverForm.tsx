'use client'
import { useState, useCallback } from 'react'
import { Loader2, Sigma, BarChart2, X } from 'lucide-react'

const TYPES = [
  { value: 'equation', label: 'Ecuación', placeholder: 'x**2 - 5*x + 6 = 0', desc: 'Resuelve para x' },
  { value: 'derivative', label: 'Derivada', placeholder: 'x**3 + 2*x**2 - x', desc: "Calcula f'(x)" },
  { value: 'integral', label: 'Integral', placeholder: 'x**2 + 2*x', desc: 'Integral numérica' },
  { value: 'simplify', label: 'Simplificar', placeholder: '(x**2 - 1)/(x - 1)', desc: 'Simplifica la expresión' },
  { value: 'factor', label: 'Factorizar', placeholder: 'x**2 - 5*x + 6', desc: 'Factoriza el polinomio' },
  { value: 'expand', label: 'Expandir', placeholder: '(x + 1)*(x - 2)', desc: 'Expande el producto' },
  { value: 'limit', label: 'Límite', placeholder: 'sin(x)/x', desc: 'lim cuando x → punto' },
  { value: 'system', label: 'Sistema', placeholder: 'x + y = 5\n2*x - y = 1', desc: 'Sistema de ecuaciones (una por línea)' },
]

const EXAMPLES: Record<string, { expression: string; variable?: string; point?: string }> = {
  equation: { expression: 'x**2 - 5*x + 6 = 0' },
  derivative: { expression: 'x**3 + 2*x**2 - x + 1', variable: 'x' },
  integral: { expression: 'x**2 + sin(x)', variable: 'x' },
  simplify: { expression: '(x**2 - 1)/(x - 1)' },
  factor: { expression: 'x**2 - 5*x + 6' },
  expand: { expression: '(x + 1)*(x - 2)*(x + 3)' },
  limit: { expression: 'sin(x)/x', variable: 'x', point: '0' },
  system: { expression: 'x + y = 5\n2*x - y = 1' },
}

const PLOTTABLE = ['equation', 'derivative', 'simplify', 'factor', 'expand']

// ── SVG Function Plotter ─────────────────────────────────────────
interface PlotPoint { x: number; y: number }

function FunctionPlot({ expression, variable }: { expression: string; variable: string }) {
  const [points, setPoints] = useState<PlotPoint[]>([])
  const [xMin, setXMin] = useState('-10')
  const [xMax, setXMax] = useState('10')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const W = 440, H = 280, PAD = 36

  const plot = useCallback(async () => {
    setLoading(true)
    setError('')
    const res = await fetch('/api/plot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expression, variable, xMin: parseFloat(xMin), xMax: parseFloat(xMax) }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Error'); return }
    setPoints(data.points)
  }, [expression, variable, xMin, xMax])

  const validPoints = points.filter(p => !isNaN(p.y))
  const yValues = validPoints.map(p => p.y)
  const yMin = yValues.length ? Math.min(...yValues) : -10
  const yMax = yValues.length ? Math.max(...yValues) : 10
  const yPad = Math.max((yMax - yMin) * 0.1, 0.5)
  const yCur = [yMin - yPad, yMax + yPad]
  const xCur = [parseFloat(xMin), parseFloat(xMax)]

  function toSVG(x: number, y: number): [number, number] {
    const sx = PAD + ((x - xCur[0]) / (xCur[1] - xCur[0])) * (W - 2 * PAD)
    const sy = PAD + ((yCur[1] - y) / (yCur[1] - yCur[0])) * (H - 2 * PAD)
    return [sx, sy]
  }

  // Build polyline segments (break on NaN)
  const segments: string[][] = []
  let current: string[] = []
  for (let i = 0; i < points.length; i++) {
    const p = points[i]
    if (isNaN(p.y)) {
      if (current.length) { segments.push(current); current = [] }
    } else {
      const [sx, sy] = toSVG(p.x, p.y)
      if (sy < -H || sy > 2 * H) {
        if (current.length) { segments.push(current); current = [] }
      } else {
        current.push(`${sx.toFixed(1)},${sy.toFixed(1)}`)
      }
    }
  }
  if (current.length) segments.push(current)

  // Axis positions
  const [ax0] = toSVG(0, yCur[0])
  const [ax1] = toSVG(0, yCur[1])
  const [, ay0] = toSVG(xCur[0], 0)
  const [, ay1] = toSVG(xCur[1], 0)
  const zeroX = ax0 >= PAD && ax0 <= W - PAD
  const zeroY = ay0 >= PAD && ay0 <= H - PAD

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-2">
        <div>
          <label className="text-xs text-tx-muted mb-1 block">x mín</label>
          <input value={xMin} onChange={e => setXMin(e.target.value)}
            className="w-20 bg-bg-elevated border border-bg-border rounded-lg px-2 py-1.5 text-tx text-sm font-mono focus:outline-none focus:border-primary/50" />
        </div>
        <div>
          <label className="text-xs text-tx-muted mb-1 block">x máx</label>
          <input value={xMax} onChange={e => setXMax(e.target.value)}
            className="w-20 bg-bg-elevated border border-bg-border rounded-lg px-2 py-1.5 text-tx text-sm font-mono focus:outline-none focus:border-primary/50" />
        </div>
        <button onClick={plot} disabled={loading}
          className="mt-4 flex items-center gap-1.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <BarChart2 size={14} />}
          Graficar
        </button>
      </div>

      {error && <p className="text-danger text-sm">{error}</p>}

      <div className="bg-bg-elevated border border-bg-border rounded-xl overflow-hidden">
        <svg width={W} height={H} className="w-full">
          {/* Grid */}
          {[-8,-6,-4,-2,0,2,4,6,8].map(v => {
            if (v < xCur[0] || v > xCur[1]) return null
            const [sx] = toSVG(v, 0)
            return <line key={`vg${v}`} x1={sx} y1={PAD} x2={sx} y2={H - PAD} stroke="currentColor" strokeWidth="0.5" className="text-bg-border" />
          })}
          {[-8,-6,-4,-2,0,2,4,6,8].map(v => {
            if (v < yCur[0] || v > yCur[1]) return null
            const [, sy] = toSVG(0, v)
            return <line key={`hg${v}`} x1={PAD} y1={sy} x2={W - PAD} y2={sy} stroke="currentColor" strokeWidth="0.5" className="text-bg-border" />
          })}

          {/* Axes */}
          {zeroX && <line x1={ax0} y1={PAD - 4} x2={ax0} y2={H - PAD + 4} stroke="currentColor" strokeWidth="1.5" className="text-tx-muted" />}
          {zeroY && <line x1={PAD - 4} y1={ay0} x2={W - PAD + 4} y2={ay0} stroke="currentColor" strokeWidth="1.5" className="text-tx-muted" />}

          {/* Axis labels */}
          {[-8,-4,0,4,8].map(v => {
            if (v < xCur[0] || v > xCur[1]) return null
            const [sx] = toSVG(v, 0)
            const labelY = zeroY ? ay0 + 14 : H - PAD + 14
            return <text key={`xl${v}`} x={sx} y={labelY} textAnchor="middle" fontSize="9" className="fill-tx-subtle">{v}</text>
          })}
          {[-8,-4,0,4,8].map(v => {
            if (v < yCur[0] || v > yCur[1]) return null
            const [, sy] = toSVG(0, v)
            if (v === 0 && zeroY) return null
            const labelX = zeroX ? ax0 - 8 : PAD - 8
            return <text key={`yl${v}`} x={labelX} y={sy + 3} textAnchor="end" fontSize="9" className="fill-tx-subtle">{v}</text>
          })}

          {/* Function curves */}
          {segments.map((seg, i) => (
            <polyline key={i} points={seg.join(' ')} fill="none" stroke="hsl(var(--color-primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          ))}

          {points.length === 0 && (
            <text x={W / 2} y={H / 2} textAnchor="middle" fontSize="12" className="fill-tx-subtle">
              Presiona Graficar para ver la función
            </text>
          )}
        </svg>
      </div>
      <p className="text-xs text-tx-subtle font-mono text-center">f(x) = {expression}</p>
    </div>
  )
}

// ── Main Form ────────────────────────────────────────────────────
export function MathSolverForm() {
  const [type, setType] = useState('equation')
  const [expression, setExpression] = useState('')
  const [variable, setVariable] = useState('x')
  const [point, setPoint] = useState('0')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [showPlot, setShowPlot] = useState(false)

  const currentType = TYPES.find((t) => t.value === type)!
  const canPlot = PLOTTABLE.includes(type) && expression.trim()

  async function solve() {
    if (!expression.trim()) return
    setLoading(true)
    setResult(null)
    setError('')
    setShowPlot(false)

    const body: any = { type, variable }

    if (type === 'system') {
      const lines = expression.split('\n').map((l) => l.trim()).filter(Boolean)
      body.equations = lines
      body.variables = ['x', 'y', 'z'].slice(0, lines.length)
    } else {
      body.expression = expression
    }

    if (type === 'limit') body.point = point
    if (type === 'derivative') body.order = 1

    const res = await fetch('/api/solver', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) setError(data.error ?? 'Error desconocido.')
    else setResult(data)
  }

  function loadExample() {
    const ex = EXAMPLES[type]
    setExpression(ex.expression)
    if (ex.variable) setVariable(ex.variable)
    if (ex.point) setPoint(ex.point)
  }

  function switchType(t: string) {
    setType(t)
    setExpression('')
    setResult(null)
    setError('')
    setShowPlot(false)
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Input */}
      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium text-tx mb-3 block">Tipo de operación</label>
          <div className="grid grid-cols-4 gap-2">
            {TYPES.map((t) => (
              <button key={t.value} onClick={() => switchType(t.value)}
                className={`px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  type === t.value
                    ? 'bg-primary/15 text-primary border border-primary/30'
                    : 'bg-bg-elevated text-tx-muted border border-bg-border hover:border-primary/20 hover:text-tx'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-tx">{currentType.desc}</label>
            <button onClick={loadExample} className="text-xs text-primary hover:text-primary-hover transition-colors">Cargar ejemplo</button>
          </div>
          <textarea
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            rows={type === 'system' ? 3 : 2}
            placeholder={currentType.placeholder}
            className="w-full bg-bg-elevated border border-bg-border rounded-xl px-4 py-3 text-tx placeholder-tx-subtle text-sm font-mono focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {['equation', 'derivative', 'integral', 'limit'].includes(type) && (
            <div>
              <label className="text-xs text-tx-muted mb-1.5 block">Variable</label>
              <input value={variable} onChange={(e) => setVariable(e.target.value)}
                className="w-full bg-bg-elevated border border-bg-border rounded-lg px-3 py-2.5 text-tx text-sm font-mono focus:outline-none focus:border-primary/50 transition-colors" />
            </div>
          )}
          {type === 'limit' && (
            <div>
              <label className="text-xs text-tx-muted mb-1.5 block">Punto (x→)</label>
              <input value={point} onChange={(e) => setPoint(e.target.value)}
                className="w-full bg-bg-elevated border border-bg-border rounded-lg px-3 py-2.5 text-tx text-sm font-mono focus:outline-none focus:border-primary/50 transition-colors" />
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={solve} disabled={loading || !expression.trim()}
            className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-xl py-3.5 font-semibold transition-colors shadow-glow-sm">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Sigma size={18} />}
            {loading ? 'Calculando…' : 'Resolver'}
          </button>
          {canPlot && (
            <button onClick={() => setShowPlot(!showPlot)}
              className={`flex items-center gap-1.5 px-4 rounded-xl font-semibold text-sm transition-colors border ${
                showPlot
                  ? 'bg-primary/15 text-primary border-primary/30'
                  : 'bg-bg-elevated text-tx-muted border-bg-border hover:text-tx hover:border-primary/20'
              }`}>
              <BarChart2 size={16} />
              Graficar
            </button>
          )}
        </div>

        <div className="bg-bg-elevated border border-bg-border rounded-xl p-4 text-xs text-tx-muted space-y-1">
          <div className="font-medium text-tx text-xs mb-2">Sintaxis</div>
          <div><code className="text-primary font-mono">x**2</code> → x²</div>
          <div><code className="text-primary font-mono">sqrt(x)</code> → √x</div>
          <div><code className="text-primary font-mono">sin(x), cos(x), exp(x), log(x)</code></div>
          <div><code className="text-primary font-mono">pi, E</code> → π, e</div>
        </div>
      </div>

      {/* Result */}
      <div>
        {!result && !error && !loading && !showPlot && (
          <div className="bg-bg-surface border border-bg-border rounded-2xl p-8 h-full flex flex-col items-center justify-center text-center">
            <Sigma size={40} className="text-bg-border mb-4" />
            <p className="text-tx-muted text-sm">El resultado aparecerá aquí</p>
          </div>
        )}

        {loading && (
          <div className="bg-bg-surface border border-bg-border rounded-2xl p-8 h-full flex items-center justify-center">
            <Loader2 size={28} className="text-primary animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-danger/5 border border-danger/20 rounded-2xl p-6">
            <p className="text-danger text-sm font-medium mb-1">Error</p>
            <p className="text-tx-muted text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-bg-surface border border-bg-border rounded-2xl p-6 space-y-4">
            <div className="text-xs text-tx-muted font-medium uppercase tracking-wider">Resultado</div>

            {result.result !== undefined && (
              <div className="bg-bg-elevated border border-bg-border rounded-xl p-4">
                <div className="text-lg text-tx font-mono">{String(result.result)}</div>
              </div>
            )}

            {result.solutions && (
              <div>
                <div className="text-sm text-tx-muted mb-2">Soluciones:</div>
                <div className="space-y-2">
                  {(result.solutions as string[]).map((s, i) => (
                    <div key={i} className="bg-bg-elevated border border-bg-border rounded-lg px-4 py-2.5 font-mono text-primary">{s}</div>
                  ))}
                </div>
              </div>
            )}

            {result.steps && result.steps.length > 0 && (
              <div>
                <div className="text-sm text-tx-muted mb-3">Pasos:</div>
                <div className="space-y-2">
                  {(result.steps as string[]).map((s, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      <span className="text-tx-muted font-mono">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showPlot && canPlot && expression.trim() && (
              <div className="border-t border-bg-border pt-4">
                <FunctionPlot expression={expression} variable={variable} />
              </div>
            )}
          </div>
        )}

        {showPlot && !result && canPlot && expression.trim() && (
          <div className="bg-bg-surface border border-bg-border rounded-2xl p-6">
            <FunctionPlot expression={expression} variable={variable} />
          </div>
        )}
      </div>
    </div>
  )
}
