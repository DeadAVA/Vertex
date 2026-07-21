'use client'

import { useMemo, useState } from 'react'
import {
  BookOpenCheck,
  Bot,
  CheckCircle2,
  FilePlus2,
  FunctionSquare,
  Loader2,
  PenLine,
  Send,
  Sigma,
  Sparkles,
  WandSparkles,
  X,
} from 'lucide-react'
import katex from 'katex'
import * as math from 'mathjs'
import { MathRenderer } from '@/components/solver/MathRenderer'
import { GraphPlot } from '@/components/solver/GraphPlot'

type Tab = 'ai' | 'solver' | 'equation' | 'graph'
type SolverType = 'equation' | 'derivative' | 'integral' | 'simplify' | 'factor' | 'expand' | 'limit'

type SolverStep = { label: string; latex: string }
type SolverResult = {
  result?: string
  latex?: string
  solutions?: string[]
  solutionLatex?: string[]
  steps?: SolverStep[]
}

type Props = {
  selectedText: string
  documentText: string
  onInsertHtml: (html: string) => void
  onReplaceSelection: (html: string) => void
  onClose: () => void
}

const solverTypes: Array<{ value: SolverType; label: string; placeholder: string }> = [
  { value: 'equation', label: 'Resolver ecuación', placeholder: 'x^2 + 3x - 4 = 0' },
  { value: 'derivative', label: 'Derivar', placeholder: 'sin(x) * x^2' },
  { value: 'integral', label: 'Integrar', placeholder: 'x^2 + 2x' },
  { value: 'simplify', label: 'Simplificar', placeholder: '(x^2 - 1) / (x - 1)' },
  { value: 'factor', label: 'Factorizar', placeholder: 'x^2 + 5x + 6' },
  { value: 'expand', label: 'Expandir', placeholder: '(x + 2)(x - 3)' },
  { value: 'limit', label: 'Calcular límite', placeholder: 'sin(x) / x' },
]

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function renderLatex(latex: string, displayMode = true) {
  const source = latex.replace(/^\$\$?|\$\$?$/g, '').trim()
  return katex.renderToString(source, { displayMode, throwOnError: false, strict: false, trust: false })
}

function mathBlock(latex: string, label = 'Ecuación') {
  return `<div class="docs-academic-block docs-equation-block" data-vertex-block="equation" data-latex="${escapeHtml(latex)}" contenteditable="false"><div class="docs-block-label">Vertex · ${escapeHtml(label)}</div><div class="docs-block-math">${renderLatex(latex)}</div></div><p><br></p>`
}

function solutionBlock(expression: string, result: SolverResult) {
  const main = result.latex || result.result || result.solutionLatex?.join(', ') || result.solutions?.join(', ') || ''
  const steps = result.steps?.map((step, index) => `<div class="docs-solver-step"><span>${index + 1}</span><div><strong>${escapeHtml(step.label)}</strong><div>${renderLatex(step.latex)}</div></div></div>`).join('') ?? ''
  return `<div class="docs-academic-block docs-solver-block" data-vertex-block="solution" contenteditable="false"><div class="docs-block-label">Vertex Solver · Solución paso a paso</div><div class="docs-problem">${escapeHtml(expression)}</div>${main ? `<div class="docs-block-math">${renderLatex(main)}</div>` : ''}${steps ? `<div class="docs-solver-steps">${steps}</div>` : ''}</div><p><br></p>`
}

function textWithMath(value: string) {
  const mathParts: string[] = []
  let text = escapeHtml(value)
    .replace(/\$\$([\s\S]*?)\$\$/g, (_match, latex) => {
      const index = mathParts.push(`<div class="docs-ai-math">${renderLatex(latex)}</div>`) - 1
      return `@@MATH${index}@@`
    })
    .replace(/\$([^$\n]+?)\$/g, (_match, latex) => {
      const index = mathParts.push(renderLatex(latex, false)) - 1
      return `@@MATH${index}@@`
    })

  const lines = text.split(/\r?\n/)
  const html: string[] = []
  let list: 'ul' | 'ol' | null = null
  for (const rawLine of lines) {
    const line = rawLine.trim()
    const bullet = line.match(/^[-*]\s+(.+)/)
    const numbered = line.match(/^\d+[.)]\s+(.+)/)
    if (bullet || numbered) {
      const nextList = bullet ? 'ul' : 'ol'
      if (list !== nextList) {
        if (list) html.push(`</${list}>`)
        html.push(`<${nextList}>`)
        list = nextList
      }
      html.push(`<li>${bullet?.[1] ?? numbered?.[1]}</li>`)
      continue
    }
    if (list) { html.push(`</${list}>`); list = null }
    if (line.startsWith('### ')) html.push(`<h3>${line.slice(4)}</h3>`)
    else if (line.startsWith('## ')) html.push(`<h2>${line.slice(3)}</h2>`)
    else if (line.startsWith('# ')) html.push(`<h1>${line.slice(2)}</h1>`)
    else if (line) html.push(`<p>${line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p>`)
  }
  if (list) html.push(`</${list}>`)
  text = html.join('').replace(/@@MATH(\d+)@@/g, (_match, index) => mathParts[Number(index)] ?? '')
  return `<div class="docs-ai-insert">${text}</div><p><br></p>`
}

function normalizeExpression(value: string) {
  return value
    .replace(/\^/g, '**')
    .replace(/(\d)\s*([a-zA-Z(])/g, '$1*$2')
    .replace(/\)\s*\(/g, ')*(')
    .replace(/\)\s*([a-zA-Z])/g, ')*$1')
}

function graphBlock(expression: string) {
  const width = 620
  const height = 310
  const padding = 28
  const xMin = -10
  const xMax = 10
  const yMin = -10
  const yMax = 10
  const compiled = math.compile(normalizeExpression(expression))
  const sx = (x: number) => padding + ((x - xMin) / (xMax - xMin)) * (width - padding * 2)
  const sy = (y: number) => height - padding - ((y - yMin) / (yMax - yMin)) * (height - padding * 2)
  const segments: string[] = []
  let current: string[] = []
  for (let index = 0; index <= 500; index++) {
    const x = xMin + ((xMax - xMin) * index) / 500
    let y = Number.NaN
    try { y = Number(compiled.evaluate({ x, pi: Math.PI, e: Math.E })) } catch {}
    if (Number.isFinite(y) && y >= yMin - 2 && y <= yMax + 2) current.push(`${sx(x).toFixed(1)},${sy(y).toFixed(1)}`)
    else if (current.length) { segments.push(current.join(' ')); current = [] }
  }
  if (current.length) segments.push(current.join(' '))
  const grid = Array.from({ length: 11 }, (_, index) => {
    const x = padding + index * ((width - padding * 2) / 10)
    const y = padding + index * ((height - padding * 2) / 10)
    return `<line x1="${x}" y1="${padding}" x2="${x}" y2="${height - padding}"/><line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}"/>`
  }).join('')
  const paths = segments.map((points) => `<polyline points="${points}" fill="none" stroke="#e56517" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`).join('')
  return `<div class="docs-academic-block docs-graph-block" data-vertex-block="graph" data-expression="${escapeHtml(expression)}" contenteditable="false"><div class="docs-block-label">Vertex Gráficas · f(x) = ${escapeHtml(expression)}</div><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Gráfica de ${escapeHtml(expression)}"><rect width="${width}" height="${height}" rx="8" fill="#0d0f16"/><g stroke="rgba(255,255,255,.09)" stroke-width="1">${grid}</g><g stroke="rgba(255,255,255,.5)" stroke-width="1.4"><line x1="${sx(0)}" y1="${padding}" x2="${sx(0)}" y2="${height - padding}"/><line x1="${padding}" y1="${sy(0)}" x2="${width - padding}" y2="${sy(0)}"/></g>${paths}</svg></div><p><br></p>`
}

export function AcademicPanel({ selectedText, documentText, onInsertHtml, onReplaceSelection, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('ai')
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiResult, setAiResult] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [solverType, setSolverType] = useState<SolverType>('equation')
  const [expression, setExpression] = useState('')
  const [variable, setVariable] = useState('x')
  const [point, setPoint] = useState('0')
  const [lowerBound, setLowerBound] = useState('-5')
  const [upperBound, setUpperBound] = useState('5')
  const [solverResult, setSolverResult] = useState<SolverResult | null>(null)
  const [solverLoading, setSolverLoading] = useState(false)
  const [solverError, setSolverError] = useState('')
  const [latex, setLatex] = useState('x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}')
  const [graphExpression, setGraphExpression] = useState('sin(x)')
  const [graphError, setGraphError] = useState('')

  const contextLabel = selectedText ? `${selectedText.trim().split(/\s+/).length} palabras seleccionadas` : 'Usará el documento como contexto'
  const currentSolver = useMemo(() => solverTypes.find((item) => item.value === solverType)!, [solverType])

  async function askAi(instruction?: string) {
    const finalInstruction = instruction || aiPrompt.trim()
    if (!finalInstruction) return
    setAiLoading(true)
    setAiError('')
    setAiResult('')
    try {
      const response = await fetch('/api/docs/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction: finalInstruction, selection: selectedText, document: documentText.slice(0, 30_000) }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No se pudo consultar la IA')
      setAiResult(data.content)
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'No se pudo consultar la IA')
    } finally {
      setAiLoading(false)
    }
  }

  async function solve() {
    if (!expression.trim()) return
    setSolverLoading(true)
    setSolverError('')
    setSolverResult(null)
    try {
      const body: Record<string, unknown> = { type: solverType, expression, variable }
      if (solverType === 'limit') body.point = point
      if (solverType === 'integral') { body.lowerBound = lowerBound; body.upperBound = upperBound }
      const response = await fetch('/api/solver', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No se pudo resolver')
      setSolverResult(data)
    } catch (error) {
      setSolverError(error instanceof Error ? error.message : 'No se pudo resolver')
    } finally {
      setSolverLoading(false)
    }
  }

  function insertGraph() {
    setGraphError('')
    try { onInsertHtml(graphBlock(graphExpression)) } catch { setGraphError('La expresión no se puede graficar.') }
  }

  return (
    <aside className="vertex-docs-ai-panel flex h-full w-[370px] shrink-0 flex-col border-l border-[#292933] bg-[#0e0e13] text-[#f1f5f9] shadow-[-12px_0_35px_rgba(0,0,0,.25)]">
      <div className="flex items-center justify-between border-b border-[#e8eaed] px-4 py-3">
        <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[#e56517] to-[#f59e0b] text-white"><Sparkles size={17} /></span><div><div className="text-sm font-semibold">Vertex Academic</div><div className="text-[11px] text-[#5f6368]">Herramientas inteligentes</div></div></div>
        <button onClick={onClose} className="rounded-full p-2 text-[#5f6368] hover:bg-[#f1f3f4]"><X size={18} /></button>
      </div>

      <div className="grid grid-cols-4 border-b border-[#e8eaed] px-2 pt-2">
        <PanelTab active={tab === 'ai'} icon={Bot} label="IA" onClick={() => setTab('ai')} />
        <PanelTab active={tab === 'solver'} icon={Sigma} label="Solver" onClick={() => setTab('solver')} />
        <PanelTab active={tab === 'equation'} icon={FunctionSquare} label="Ecuación" onClick={() => setTab('equation')} />
        <PanelTab active={tab === 'graph'} icon={PenLine} label="Gráfica" onClick={() => setTab('graph')} />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'ai' && (
          <div className="space-y-4">
            <div><h2 className="font-sans text-base font-semibold tracking-normal">Asistente del documento</h2><p className="mt-1 text-xs leading-relaxed text-[#5f6368]">Pregunta, mejora o genera contenido usando el contexto actual.</p></div>
            <div className={`rounded-lg border px-3 py-2 text-xs ${selectedText ? 'border-[#e56517]/50 bg-[#e56517]/10 text-[#f28a4a]' : 'border-[#292933] bg-[#141419] text-[#8b95a7]'}`}><BookOpenCheck size={14} className="mr-2 inline" />{contextLabel}</div>
            <div className="grid grid-cols-2 gap-2">
              <QuickAction icon={WandSparkles} label="Mejorar redacción" onClick={() => askAi('Mejora la redacción, claridad y estructura del contenido. Conserva el significado y las fórmulas.')} />
              <QuickAction icon={BookOpenCheck} label="Explicar" onClick={() => askAi('Explica este contenido de forma didáctica, clara y paso a paso para un estudiante.')} />
              <QuickAction icon={FilePlus2} label="Continuar" onClick={() => askAi('Continúa el documento de forma coherente con uno o dos párrafos útiles.')} />
              <QuickAction icon={Sigma} label="Resolver" onClick={() => askAi('Identifica y resuelve el problema matemático del contenido, mostrando pasos y verificación.')} />
            </div>
            <textarea value={aiPrompt} onChange={(event) => setAiPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) askAi() }} rows={4} placeholder="Pídele algo a Vertex IA…" className="w-full resize-none rounded-lg border border-[#dadce0] px-3 py-2.5 text-sm outline-none focus:border-[#e56517] focus:ring-1 focus:ring-[#e56517]/30" />
            <button onClick={() => askAi()} disabled={aiLoading || !aiPrompt.trim()} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#e56517] py-2.5 text-sm font-semibold text-white hover:bg-[#cc5813] disabled:opacity-50">{aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}{aiLoading ? 'Pensando…' : 'Preguntar a Vertex'}</button>
            {aiError && <ErrorBox message={aiError} />}
            {aiResult && (
              <div className="rounded-xl border border-[#292933] bg-[#141419] p-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#e56517]"><Sparkles size={14} />Respuesta</div>
                <div className="max-h-80 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed"><MathRenderer text={aiResult} /></div>
                <div className="mt-3 flex gap-2"><button onClick={() => onInsertHtml(textWithMath(aiResult))} className="flex-1 rounded-lg bg-[#202124] px-3 py-2 text-xs font-semibold text-white">Insertar debajo</button>{selectedText && <button onClick={() => onReplaceSelection(textWithMath(aiResult))} className="flex-1 rounded-lg border border-[#dadce0] bg-white px-3 py-2 text-xs font-semibold">Reemplazar selección</button>}</div>
              </div>
            )}
          </div>
        )}

        {tab === 'solver' && (
          <div className="space-y-4">
            <div><h2 className="font-sans text-base font-semibold tracking-normal">Solver matemático</h2><p className="mt-1 text-xs text-[#5f6368]">Calcula con el motor de Vertex e inserta el procedimiento.</p></div>
            <label className="block text-xs font-medium">Operación<select value={solverType} onChange={(event) => { setSolverType(event.target.value as SolverType); setSolverResult(null) }} className="mt-1.5 w-full rounded-lg border border-[#dadce0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#e56517]">{solverTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label>
            <label className="block text-xs font-medium">Expresión<textarea value={expression} onChange={(event) => setExpression(event.target.value)} rows={3} placeholder={currentSolver.placeholder} className="mt-1.5 w-full resize-none rounded-lg border border-[#dadce0] px-3 py-2.5 font-mono text-sm outline-none focus:border-[#e56517]" /></label>
            <div className="grid grid-cols-3 gap-2"><MiniField label="Variable" value={variable} onChange={setVariable} />{solverType === 'limit' && <MiniField label="Punto" value={point} onChange={setPoint} />}{solverType === 'integral' && <><MiniField label="Desde" value={lowerBound} onChange={setLowerBound} /><MiniField label="Hasta" value={upperBound} onChange={setUpperBound} /></>}</div>
            <button onClick={solve} disabled={solverLoading || !expression.trim()} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#e56517] py-2.5 text-sm font-semibold text-white hover:bg-[#cc5813] disabled:opacity-50">{solverLoading ? <Loader2 size={16} className="animate-spin" /> : <Sigma size={16} />}{solverLoading ? 'Calculando…' : 'Resolver'}</button>
            {solverError && <ErrorBox message={solverError} />}
            {solverResult && <SolverResultCard result={solverResult} onInsert={() => onInsertHtml(solutionBlock(expression, solverResult))} />}
          </div>
        )}

        {tab === 'equation' && (
          <div className="space-y-4">
            <div><h2 className="font-sans text-base font-semibold tracking-normal">Editor de ecuaciones</h2><p className="mt-1 text-xs text-[#5f6368]">Escribe LaTeX y obtén una fórmula profesional.</p></div>
            <div className="flex flex-wrap gap-1.5">{['\\frac{a}{b}', '\\sqrt{x}', 'x^{2}', '\\int_{a}^{b}', '\\sum_{i=1}^{n}', '\\lim_{x \\to 0}', '\\pi', '\\theta'].map((snippet) => <button key={snippet} onClick={() => setLatex((value) => `${value} ${snippet}`)} className="rounded border border-[#dadce0] bg-[#f8f9fa] px-2 py-1.5 text-xs hover:border-[#e56517]"><MathRenderer text={`$${snippet}$`} /></button>)}</div>
            <textarea value={latex} onChange={(event) => setLatex(event.target.value)} rows={4} className="w-full resize-none rounded-lg border border-[#dadce0] px-3 py-2.5 font-mono text-sm outline-none focus:border-[#e56517]" />
            <div className="min-h-24 overflow-x-auto rounded-xl border border-[#292933] bg-[#141419] p-4 text-center text-lg"><MathRenderer text={latex} block /></div>
            <button onClick={() => onInsertHtml(mathBlock(latex))} disabled={!latex.trim()} className="w-full rounded-lg bg-[#202124] py-2.5 text-sm font-semibold text-white disabled:opacity-50">Insertar ecuación</button>
          </div>
        )}

        {tab === 'graph' && (
          <div className="space-y-4">
            <div><h2 className="font-sans text-base font-semibold tracking-normal">Graficador</h2><p className="mt-1 text-xs text-[#5f6368]">Explora una función e inserta una gráfica estática.</p></div>
            <label className="block text-xs font-medium">f(x)<input value={graphExpression} onChange={(event) => setGraphExpression(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#dadce0] px-3 py-2.5 font-mono text-sm outline-none focus:border-[#e56517]" placeholder="sin(x), x^2, sqrt(x)" /></label>
            <div className="overflow-hidden rounded-xl border border-[#dadce0] bg-[#0d0f16] p-2"><GraphPlot initialExpression={graphExpression} height={250} /></div>
            {graphError && <ErrorBox message={graphError} />}
            <button onClick={insertGraph} disabled={!graphExpression.trim()} className="w-full rounded-lg bg-[#202124] py-2.5 text-sm font-semibold text-white disabled:opacity-50">Insertar gráfica</button>
          </div>
        )}
      </div>
    </aside>
  )
}

function PanelTab({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof Bot; label: string; onClick: () => void }) {
  return <button onClick={onClick} className={`flex flex-col items-center gap-1 border-b-2 px-1 py-2 text-[11px] ${active ? 'border-[#e56517] bg-[#e56517]/5 font-semibold text-[#f28a4a]' : 'border-transparent text-[#687285] hover:bg-[#141419] hover:text-[#a8b0bf]'}`}><Icon size={16} />{label}</button>
}

function QuickAction({ icon: Icon, label, onClick }: { icon: typeof Bot; label: string; onClick: () => void }) {
  return <button onClick={onClick} className="flex min-h-16 flex-col items-start justify-between rounded-lg border border-[#292933] bg-[#141419] p-2.5 text-left text-xs font-medium text-[#cbd2dd] hover:border-[#e56517]/50 hover:bg-[#1a1a21]"><Icon size={16} className="text-[#e56517]" />{label}</button>
}

function MiniField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block text-[11px] font-medium">{label}<input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-md border border-[#dadce0] px-2 py-2 font-mono text-xs outline-none focus:border-[#e56517]" /></label>
}

function ErrorBox({ message }: { message: string }) {
  return <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{message}</div>
}

function SolverResultCard({ result, onInsert }: { result: SolverResult; onInsert: () => void }) {
  const main = result.latex || result.result
  return <div className="rounded-xl border border-[#292933] bg-[#141419] p-3"><div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[#4ade80]"><CheckCircle2 size={15} />Resultado</div>{main && <div className="overflow-x-auto rounded-lg bg-[#0e0e13] p-3 text-center"><MathRenderer text={main} block /></div>}{result.solutionLatex && <div className="mt-2 space-y-1">{result.solutionLatex.map((solution) => <div key={solution} className="rounded bg-[#0e0e13] p-2 text-center"><MathRenderer text={`$${solution}$`} /></div>)}</div>}{result.steps && <div className="mt-3 space-y-2">{result.steps.map((step, index) => <div key={`${step.label}-${index}`} className="flex gap-2 text-xs"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#e56517]/15 font-semibold text-[#f28a4a]">{index + 1}</span><div><div className="font-medium">{step.label}</div><MathRenderer text={`$${step.latex}$`} /></div></div>)}</div>}<button onClick={onInsert} className="mt-3 w-full rounded-lg bg-[#e56517] py-2 text-xs font-semibold text-white hover:bg-[#cc5813]">Insertar solución completa</button></div>
}
