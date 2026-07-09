'use client'
import { useState } from 'react'
import { Loader2, Sigma, BarChart2 } from 'lucide-react'
import { MathRenderer } from './MathRenderer'
import { GraphPlot } from './GraphPlot'

const TYPES = [
  { value: 'equation',   label: 'Ecuación',    placeholder: 'x^2 - 5x + 6 = 0',         desc: 'Resuelve para x' },
  { value: 'derivative', label: 'Derivada',     placeholder: 'x^3 + 2x^2 - x',            desc: "Calcula f'(x)" },
  { value: 'integral',   label: 'Integral',     placeholder: 'x^2 + sin(x)',               desc: 'Integral numérica' },
  { value: 'simplify',   label: 'Simplificar',  placeholder: '(x^2 - 1) / (x - 1)',        desc: 'Simplifica la expresión' },
  { value: 'factor',     label: 'Factorizar',   placeholder: 'x^2 - 5x + 6',               desc: 'Factoriza el polinomio' },
  { value: 'expand',     label: 'Expandir',     placeholder: '(x + 1)(x - 2)(x + 3)',       desc: 'Expande el producto' },
  { value: 'limit',      label: 'Límite',       placeholder: 'sin(x) / x',                 desc: 'lim cuando x → punto' },
  { value: 'system',     label: 'Sistema',      placeholder: 'x + y = 5\n2x - y = 1',      desc: 'Sistema (una ecuación por línea)' },
]

const EXAMPLES: Record<string, { expression: string; variable?: string; point?: string }> = {
  equation:   { expression: 'x^2 - 5x + 6 = 0' },
  derivative: { expression: 'x^3 + 2x^2 - x + 1' },
  integral:   { expression: 'x^2 + sin(x)' },
  simplify:   { expression: '(x^2 - 1) / (x - 1)' },
  factor:     { expression: 'x^2 - 5x + 6' },
  expand:     { expression: '(x + 1)(x - 2)(x + 3)' },
  limit:      { expression: 'sin(x) / x', variable: 'x', point: '0' },
  system:     { expression: 'x + y = 5\n2x - y = 1' },
}

const PLOTTABLE = new Set(['equation', 'derivative', 'simplify', 'factor', 'expand', 'integral'])

export function MathSolverForm() {
  const [type, setType] = useState('equation')
  const [expression, setExpression] = useState('')
  const [variable, setVariable] = useState('x')
  const [point, setPoint] = useState('0')
  const [lowerBound, setLowerBound] = useState('-5')
  const [upperBound, setUpperBound] = useState('5')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [showGraph, setShowGraph] = useState(false)

  const currentType = TYPES.find(t => t.value === type)!
  const canPlot = PLOTTABLE.has(type) && expression.trim()

  // Expression to graph (for equations, graph both sides)
  const plotExpr = (() => {
    if (type === 'equation') {
      const parts = expression.split('=')
      return parts[0]?.trim() || expression
    }
    return expression
  })()

  async function solve() {
    if (!expression.trim()) return
    setLoading(true); setResult(null); setError('')

    const body: any = { type, variable }
    if (type === 'system') {
      const lines = expression.split('\n').map(l => l.trim()).filter(Boolean)
      body.equations = lines
      body.variables = ['x', 'y', 'z'].slice(0, lines.length)
    } else {
      body.expression = expression
    }
    if (type === 'limit')    { body.point = point }
    if (type === 'integral') { body.lowerBound = lowerBound; body.upperBound = upperBound }

    const res = await fetch('/api/solver', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) setError(data.error ?? 'Error desconocido.')
    else { setResult(data); if (canPlot) setShowGraph(true) }
  }

  function loadExample() {
    const ex = EXAMPLES[type]
    setExpression(ex.expression)
    if (ex.variable) setVariable(ex.variable)
    if (ex.point)    setPoint(ex.point)
    setResult(null); setError('')
  }

  function switchType(t: string) {
    setType(t); setExpression(''); setResult(null); setError(''); setShowGraph(false)
  }

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* ── Input panel ────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Type selector */}
          <div>
            <label className="text-sm font-medium text-tx mb-3 block">Operación</label>
            <div className="grid grid-cols-4 gap-1.5">
              {TYPES.map(t => (
                <button key={t.value} onClick={() => switchType(t.value)}
                  className={`px-2 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    type === t.value
                      ? 'bg-primary/15 text-primary border border-primary/30'
                      : 'bg-bg-elevated text-tx-muted border border-bg-border hover:border-primary/20 hover:text-tx'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Expression input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-tx">{currentType.desc}</label>
              <button onClick={loadExample} className="text-xs text-primary hover:text-primary-hover transition-colors">
                Ejemplo
              </button>
            </div>
            <textarea
              value={expression}
              onChange={e => setExpression(e.target.value)}
              rows={type === 'system' ? 3 : 2}
              placeholder={currentType.placeholder}
              className="w-full bg-bg-elevated border border-bg-border rounded-xl px-4 py-3 text-tx placeholder-tx-subtle text-sm font-mono focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors resize-none"
              onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) solve() }}
            />
          </div>

          {/* Extra fields */}
          <div className="grid grid-cols-2 gap-3">
            {['equation', 'derivative', 'integral', 'limit'].includes(type) && (
              <div>
                <label className="text-xs text-tx-muted mb-1.5 block">Variable</label>
                <input value={variable} onChange={e => setVariable(e.target.value)}
                  className="w-full bg-bg-elevated border border-bg-border rounded-lg px-3 py-2.5 text-tx text-sm font-mono focus:outline-none focus:border-primary/50 transition-colors" />
              </div>
            )}
            {type === 'limit' && (
              <div>
                <label className="text-xs text-tx-muted mb-1.5 block">x →</label>
                <input value={point} onChange={e => setPoint(e.target.value)}
                  className="w-full bg-bg-elevated border border-bg-border rounded-lg px-3 py-2.5 text-tx text-sm font-mono focus:outline-none focus:border-primary/50 transition-colors" />
              </div>
            )}
            {type === 'integral' && (<>
              <div>
                <label className="text-xs text-tx-muted mb-1.5 block">Límite inferior (a)</label>
                <input value={lowerBound} onChange={e => setLowerBound(e.target.value)}
                  className="w-full bg-bg-elevated border border-bg-border rounded-lg px-3 py-2.5 text-tx text-sm font-mono focus:outline-none focus:border-primary/50 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-tx-muted mb-1.5 block">Límite superior (b)</label>
                <input value={upperBound} onChange={e => setUpperBound(e.target.value)}
                  className="w-full bg-bg-elevated border border-bg-border rounded-lg px-3 py-2.5 text-tx text-sm font-mono focus:outline-none focus:border-primary/50 transition-colors" />
              </div>
            </>)}
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button onClick={solve} disabled={loading || !expression.trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-xl py-3.5 font-semibold transition-colors shadow-glow-sm">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Sigma size={18} />}
              {loading ? 'Calculando…' : 'Resolver'}
            </button>
            {canPlot && (
              <button onClick={() => setShowGraph(!showGraph)}
                className={`flex items-center gap-1.5 px-4 rounded-xl font-semibold text-sm border transition-colors ${
                  showGraph
                    ? 'bg-primary/15 text-primary border-primary/30'
                    : 'bg-bg-elevated text-tx-muted border-bg-border hover:text-tx hover:border-primary/20'
                }`}>
                <BarChart2 size={16} /> Graficar
              </button>
            )}
          </div>

          {/* Syntax hint */}
          <div className="bg-bg-elevated border border-bg-border rounded-xl p-4 text-xs text-tx-muted space-y-1">
            <div className="font-medium text-tx text-xs mb-2">Sintaxis aceptada</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <div><code className="text-primary">x^2</code> → x²</div>
              <div><code className="text-primary">sqrt(x)</code> → √x</div>
              <div><code className="text-primary">2x</code> → 2·x</div>
              <div><code className="text-primary">sin cos tan</code></div>
              <div><code className="text-primary">ln(x) log(x)</code></div>
              <div><code className="text-primary">pi, e</code></div>
              <div><code className="text-primary">(x+1)(x-1)</code></div>
              <div><code className="text-primary">abs ceil floor</code></div>
            </div>
          </div>
        </div>

        {/* ── Result panel ───────────────────────────────────────── */}
        <div>
          {!result && !error && !loading && (
            <div className="bg-bg-surface border border-bg-border rounded-2xl p-8 h-full flex flex-col items-center justify-center text-center gap-3">
              <Sigma size={40} className="text-bg-border" />
              <p className="text-tx-muted text-sm">El resultado aparecerá aquí</p>
              <p className="text-tx-subtle text-xs">Ctrl+Enter para calcular rápido</p>
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
              <p className="text-tx-muted text-sm font-mono">{error}</p>
            </div>
          )}

          {result && (
            <div className="bg-bg-surface border border-bg-border rounded-2xl overflow-hidden">
              {/* Main result */}
              {(result.latex || result.result) && (
                <div className="px-6 py-5 border-b border-bg-border">
                  <div className="text-xs text-tx-muted font-medium uppercase tracking-wider mb-3">Resultado</div>
                  <div className="bg-bg-elevated border border-bg-border rounded-xl px-5 py-4 text-center overflow-x-auto">
                    <span className="text-xl">
                      <MathRenderer text={result.latex ? `$$${result.latex}$$` : String(result.result)} />
                    </span>
                  </div>
                </div>
              )}

              {/* Solutions (equations/systems) */}
              {result.solutionLatex && result.solutionLatex.length > 0 && (
                <div className="px-6 py-5 border-b border-bg-border">
                  <div className="text-xs text-tx-muted font-medium uppercase tracking-wider mb-3">Soluciones</div>
                  <div className="flex flex-wrap gap-2">
                    {(result.solutionLatex as string[]).map((s, i) => (
                      <div key={i} className="bg-primary/10 border border-primary/25 rounded-xl px-4 py-2.5 font-mono text-primary">
                        <MathRenderer text={`$${s}$`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Steps */}
              {result.steps && result.steps.length > 0 && (
                <div className="px-6 py-5">
                  <div className="text-xs text-tx-muted font-medium uppercase tracking-wider mb-3">Pasos</div>
                  <div className="space-y-3">
                    {(result.steps as Array<{ label: string; latex: string }>).map((s, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-tx-subtle mb-1">{s.label}</div>
                          <div className="bg-bg-elevated rounded-lg px-3 py-2 overflow-x-auto text-sm">
                            <MathRenderer text={`$${s.latex}$`} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Interactive Graph ──────────────────────────────────────── */}
      {(showGraph && canPlot) && (
        <div className="bg-bg-surface border border-bg-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-tx flex items-center gap-2">
              <BarChart2 size={16} className="text-primary" />
              Gráfica interactiva
            </div>
            <code className="text-xs text-tx-muted font-mono">{plotExpr}</code>
          </div>
          <GraphPlot initialExpression={plotExpr} height={380} />
        </div>
      )}
    </div>
  )
}
