'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const TABS = ['Científica', 'Cuadrática', 'Porcentajes', 'Física']

// ── Scientific Calculator ────────────────────────────────────────
function ScientificCalc() {
  const [display, setDisplay] = useState('0')
  const [history, setHistory] = useState('')

  const keys = [
    ['C', '(', ')', '%'],
    ['sin', 'cos', 'tan', '√'],
    ['7', '8', '9', '÷'],
    ['4', '5', '6', '×'],
    ['1', '2', '3', '-'],
    ['0', '.', '=', '+'],
  ]

  function press(k: string) {
    if (k === 'C') { setDisplay('0'); setHistory(''); return }
    if (k === '=') {
      try {
        let expr = display
          .replace(/÷/g, '/')
          .replace(/×/g, '*')
          .replace(/√\(/g, 'Math.sqrt(')
          .replace(/sin\(/g, 'Math.sin(')
          .replace(/cos\(/g, 'Math.cos(')
          .replace(/tan\(/g, 'Math.tan(')
          .replace(/π/g, 'Math.PI')
        const result = Function(`"use strict"; return (${expr})`)()
        setHistory(display + ' =')
        setDisplay(String(Math.round(result * 1e10) / 1e10))
      } catch {
        setDisplay('Error')
      }
      return
    }

    const map: Record<string, string> = {
      sin: 'sin(', cos: 'cos(', tan: 'tan(', '√': '√(',
    }
    const val = map[k] ?? k
    setDisplay((prev) => (prev === '0' && !['(', '.'].includes(val) ? val : prev + val))
  }

  return (
    <div className="max-w-xs">
      <div className="bg-bg-elevated border border-bg-border rounded-md p-4 mb-3">
        <div className="text-tx-subtle text-xs h-4 mb-1">{history}</div>
        <div className="text-tx text-2xl font-mono text-right truncate">{display}</div>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {keys.flat().map((k, i) => (
          <button
            key={i}
            onClick={() => press(k)}
            className={cn(
              'h-11 rounded-md text-sm font-medium transition-colors',
              k === '='
                ? 'bg-primary hover:bg-primary-hover text-white'
                : k === 'C'
                ? 'bg-danger/15 hover:bg-danger/25 text-danger'
                : ['sin', 'cos', 'tan', '√', '(', ')', '%'].includes(k)
                ? 'bg-primary/10 hover:bg-primary/20 text-primary'
                : ['÷', '×', '-', '+'].includes(k)
                ? 'bg-bg-border hover:bg-bg-border/80 text-warning'
                : 'bg-bg-elevated hover:bg-bg-border text-tx'
            )}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Quadratic Solver ─────────────────────────────────────────────
function QuadraticSolver() {
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [c, setC] = useState('')
  const [result, setResult] = useState<null | { discriminant: number; solutions: string[]; steps: string[] }>(null)

  function solve() {
    const av = parseFloat(a)
    const bv = parseFloat(b)
    const cv = parseFloat(c)
    if (isNaN(av) || isNaN(bv) || isNaN(cv) || av === 0) return

    const d = bv * bv - 4 * av * cv
    const steps = [
      `Ecuación: ${av}x² + ${bv}x + ${cv} = 0`,
      `Discriminante: b² - 4ac = ${bv}² - 4(${av})(${cv}) = ${d}`,
    ]
    let solutions: string[]

    if (d < 0) {
      solutions = ['Sin solución real (discriminante negativo)']
      steps.push('Como Δ < 0, no hay raíces reales.')
    } else if (d === 0) {
      const x = -bv / (2 * av)
      solutions = [`x = ${x}`]
      steps.push(`Δ = 0 → raíz doble: x = -b / (2a) = ${x}`)
    } else {
      const sqrtD = Math.sqrt(d)
      const x1 = (-bv + sqrtD) / (2 * av)
      const x2 = (-bv - sqrtD) / (2 * av)
      solutions = [`x₁ = ${Math.round(x1 * 1e6) / 1e6}`, `x₂ = ${Math.round(x2 * 1e6) / 1e6}`]
      steps.push(`√Δ = √${d} ≈ ${Math.round(sqrtD * 1000) / 1000}`)
      steps.push(`x = (-b ± √Δ) / (2a)`)
      steps.push(`x₁ = (${-bv} + ${Math.round(sqrtD * 1000) / 1000}) / ${2 * av} = ${solutions[0].split('= ')[1]}`)
      steps.push(`x₂ = (${-bv} - ${Math.round(sqrtD * 1000) / 1000}) / ${2 * av} = ${solutions[1].split('= ')[1]}`)
    }

    setResult({ discriminant: d, solutions, steps })
  }

  return (
    <div className="max-w-md">
      <p className="text-tx-muted text-sm mb-5">Resuelve <strong className="text-tx">ax² + bx + c = 0</strong></p>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[['a', a, setA], ['b', b, setB], ['c', c, setC]].map(([label, val, setter]) => (
          <div key={label as string}>
            <label className="text-xs text-tx-muted mb-1 block">{label as string}</label>
            <input
              type="number"
              value={val as string}
              onChange={(e) => (setter as any)(e.target.value)}
              placeholder="0"
              className="w-full bg-bg-elevated border border-bg-border rounded-md px-3 py-2.5 text-tx text-center font-mono text-lg focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        ))}
      </div>
      <button onClick={solve} className="w-full bg-primary hover:bg-primary-hover text-white rounded-md py-2.5 font-semibold text-sm transition-colors mb-5">
        Resolver
      </button>
      {result && (
        <div className="space-y-4">
          <div className="bg-primary/10 border border-primary/20 rounded-md p-4">
            <div className="text-xs text-primary font-medium mb-2">Soluciones</div>
            {result.solutions.map((s, i) => (
              <div key={i} className="text-tx font-mono text-lg">{s}</div>
            ))}
          </div>
          <div className="bg-bg-elevated border border-bg-border rounded-md p-4">
            <div className="text-xs text-tx-muted font-medium mb-3">Proceso</div>
            {result.steps.map((s, i) => (
              <div key={i} className="flex items-start gap-2 mb-2 text-sm">
                <span className="text-primary text-xs mt-0.5">{i + 1}.</span>
                <span className="text-tx-muted font-mono">{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Percentage Calc ──────────────────────────────────────────────
function PercentageCalc() {
  const [mode, setMode] = useState<'of' | 'is' | 'change'>('of')
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [result, setResult] = useState<{ value: string; steps: string[] } | null>(null)

  function calc() {
    const av = parseFloat(a), bv = parseFloat(b)
    if (isNaN(av) || isNaN(bv)) return

    if (mode === 'of') {
      const val = (av / 100) * bv
      setResult({ value: `${Math.round(val * 100) / 100}`, steps: [`${av}% de ${bv}`, `= (${av} ÷ 100) × ${bv}`, `= ${av / 100} × ${bv}`, `= ${Math.round(val * 100) / 100}`] })
    } else if (mode === 'is') {
      const val = (av / bv) * 100
      setResult({ value: `${Math.round(val * 100) / 100}%`, steps: [`¿Qué % es ${av} de ${bv}?`, `= (${av} ÷ ${bv}) × 100`, `= ${Math.round(val * 100) / 100}%`] })
    } else {
      const val = ((bv - av) / av) * 100
      const sign = val >= 0 ? '+' : ''
      setResult({ value: `${sign}${Math.round(val * 100) / 100}%`, steps: [`Cambio de ${av} a ${bv}`, `= ((${bv} - ${av}) / ${av}) × 100`, `= (${bv - av} / ${av}) × 100`, `= ${sign}${Math.round(val * 100) / 100}%`] })
    }
  }

  const labels: Record<string, [string, string, string]> = {
    of: ['Porcentaje (%)', 'Del número', '% de'],
    is: ['Número A', 'Número B (total)', 'A es __% de B'],
    change: ['Valor inicial', 'Valor final', 'Cambio %'],
  }

  return (
    <div className="max-w-md">
      <div className="flex gap-2 mb-5">
        {['of', 'is', 'change'].map((m) => (
          <button key={m} onClick={() => { setMode(m as any); setResult(null) }}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${mode === m ? 'bg-primary text-white' : 'bg-bg-elevated text-tx-muted hover:text-tx border border-bg-border'}`}>
            {m === 'of' ? '% de un número' : m === 'is' ? '¿Qué %?' : 'Cambio %'}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[0, 1].map((i) => (
          <div key={i}>
            <label className="text-xs text-tx-muted mb-1 block">{labels[mode][i]}</label>
            <input
              type="number"
              value={i === 0 ? a : b}
              onChange={(e) => i === 0 ? setA(e.target.value) : setB(e.target.value)}
              className="w-full bg-bg-elevated border border-bg-border rounded-md px-3 py-2.5 text-tx font-mono focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        ))}
      </div>
      <button onClick={calc} className="w-full bg-primary hover:bg-primary-hover text-white rounded-md py-2.5 font-semibold text-sm transition-colors mb-5">
        Calcular
      </button>
      {result && (
        <div className="bg-bg-elevated border border-bg-border rounded-md p-4">
          <div className="text-3xl font-bold text-primary mb-3">{result.value}</div>
          <div className="space-y-1">
            {result.steps.map((s, i) => (
              <div key={i} className="text-sm text-tx-muted font-mono">{s}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Physics Calc ─────────────────────────────────────────────────
function PhysicsCalc() {
  const formulas = [
    {
      name: 'Velocidad final (MRUA)',
      formula: 'v = v₀ + at',
      fields: ['v₀ (m/s)', 'a (m/s²)', 't (s)'],
      calc: ([v0, a, t]: number[]) => ({ result: `v = ${v0 + a * t} m/s`, steps: [`v = v₀ + at`, `v = ${v0} + ${a} × ${t}`, `v = ${v0 + a * t} m/s`] }),
    },
    {
      name: 'Segunda Ley de Newton',
      formula: 'F = ma',
      fields: ['m (kg)', 'a (m/s²)'],
      calc: ([m, a]: number[]) => ({ result: `F = ${m * a} N`, steps: [`F = ma`, `F = ${m} × ${a}`, `F = ${m * a} N`] }),
    },
    {
      name: 'Energía cinética',
      formula: 'Ec = ½mv²',
      fields: ['m (kg)', 'v (m/s)'],
      calc: ([m, v]: number[]) => ({ result: `Ec = ${0.5 * m * v * v} J`, steps: [`Ec = ½mv²`, `Ec = 0.5 × ${m} × ${v}²`, `Ec = 0.5 × ${m} × ${v * v}`, `Ec = ${0.5 * m * v * v} J`] }),
    },
    {
      name: 'Peso',
      formula: 'P = mg',
      fields: ['m (kg)', 'g (m/s²)'],
      calc: ([m, g]: number[]) => ({ result: `P = ${m * g} N`, steps: [`P = mg`, `P = ${m} × ${g}`, `P = ${m * g} N`] }),
    },
  ]

  const [selected, setSelected] = useState(0)
  const [values, setValues] = useState<string[]>(['', '', ''])
  const [result, setResult] = useState<{ result: string; steps: string[] } | null>(null)

  const formula = formulas[selected]

  function calcPhysics() {
    const nums = values.slice(0, formula.fields.length).map(parseFloat)
    if (nums.some(isNaN)) return
    setResult(formula.calc(nums))
  }

  return (
    <div className="max-w-md">
      <div className="flex flex-wrap gap-2 mb-5">
        {formulas.map((f, i) => (
          <button key={i} onClick={() => { setSelected(i); setValues(['', '', '']); setResult(null) }}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${selected === i ? 'bg-primary text-white' : 'bg-bg-elevated text-tx-muted border border-bg-border hover:text-tx'}`}>
            {f.name}
          </button>
        ))}
      </div>
      <div className="bg-bg-elevated border border-bg-border rounded-md px-4 py-3 mb-4 font-mono text-primary text-lg">{formula.formula}</div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {formula.fields.map((label, i) => (
          <div key={i}>
            <label className="text-xs text-tx-muted mb-1 block">{label}</label>
            <input
              type="number"
              value={values[i]}
              onChange={(e) => { const v = [...values]; v[i] = e.target.value; setValues(v) }}
              className="w-full bg-bg-elevated border border-bg-border rounded-md px-3 py-2.5 text-tx font-mono focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        ))}
      </div>
      <button onClick={calcPhysics} className="w-full bg-primary hover:bg-primary-hover text-white rounded-md py-2.5 font-semibold text-sm transition-colors mb-4">
        Calcular
      </button>
      {result && (
        <div className="bg-bg-elevated border border-bg-border rounded-md p-4">
          <div className="text-2xl font-bold text-primary mb-3">{result.result}</div>
          {result.steps.map((s, i) => <div key={i} className="text-sm text-tx-muted font-mono">{s}</div>)}
        </div>
      )}
    </div>
  )
}

// ── Main Panel ───────────────────────────────────────────────────
export function ToolsPanel() {
  const [tab, setTab] = useState(0)

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-6">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={cn(
              'px-4 py-2 rounded-md text-[13px] font-medium transition-all',
              tab === i
                ? 'bg-primary text-white'
                : 'bg-bg-surface border border-bg-border text-tx-muted hover:text-tx hover:border-bg-border/80'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bg-bg-surface border border-bg-border rounded-lg p-8">
        {tab === 0 && <ScientificCalc />}
        {tab === 1 && <QuadraticSolver />}
        {tab === 2 && <PercentageCalc />}
        {tab === 3 && <PhysicsCalc />}
      </div>
    </div>
  )
}
