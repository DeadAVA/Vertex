'use client'
import { useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronUp, Lock, Lightbulb, Eye, EyeOff } from 'lucide-react'
import type { ProblemStep } from '@/types'

interface Problem {
  id: string
  title: string
  statement: string
  difficulty: string
  isPremium: boolean
  steps: ProblemStep[]
  answer: string
  hints: string[] | null
}

interface Unit {
  id: string
  slug: string
  title: string
  content: string
  problems: Problem[]
  course: { slug: string; title: string; id: string }
}

interface Props {
  unit: Unit
  courseSlug: string
  userId: string
  isPremium: boolean
}

function difficultyStyle(d: string) {
  if (d === 'easy') return 'bg-success/10 text-success border-success/20'
  if (d === 'medium') return 'bg-warning/10 text-warning border-warning/20'
  return 'bg-danger/10 text-danger border-danger/20'
}
function difficultyLabel(d: string) {
  return { easy: 'Fácil', medium: 'Medio', hard: 'Difícil' }[d] ?? d
}

function renderContent(md: string) {
  const lines = md.split('\n')
  const elements: JSX.Element[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-xl font-semibold text-tx mt-6 mb-3 pb-2 border-b border-bg-border">{line.slice(3)}</h2>)
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-lg font-medium text-tx mt-4 mb-2">{line.slice(4)}</h3>)
    } else if (line.startsWith('| ')) {
      // Table
      const rows: string[][] = []
      let j = i
      while (j < lines.length && lines[j].startsWith('|')) {
        if (!lines[j].includes('---')) rows.push(lines[j].split('|').slice(1, -1).map(c => c.trim()))
        j++
      }
      elements.push(
        <div key={i} className="overflow-x-auto my-4">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>{rows[0]?.map((h, hi) => <th key={hi} className="border border-bg-border bg-bg-elevated px-3 py-2 text-left text-tx font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.slice(1).map((row, ri) => (
                <tr key={ri}>{row.map((cell, ci) => <td key={ci} className="border border-bg-border px-3 py-2 text-tx-muted">{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      i = j - 1
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(<li key={i} className="text-tx/80 ml-4 list-disc">{line.slice(2)}</li>)
    } else if (line.startsWith('```')) {
      const lang = line.slice(3)
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) { codeLines.push(lines[i]); i++ }
      elements.push(
        <pre key={i} className="bg-bg-elevated border border-bg-border rounded-lg p-4 overflow-x-auto text-sm my-4 font-mono">
          <code>{codeLines.join('\n')}</code>
        </pre>
      )
    } else if (line.match(/^\*\*(.+)\*\*/)) {
      elements.push(<p key={i} className="mb-3 text-tx/90 leading-relaxed" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, '<strong class="text-tx font-semibold">$1</strong>') }} />)
    } else if (line.trim()) {
      elements.push(<p key={i} className="mb-3 text-tx/80 leading-relaxed" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, '<strong class="text-tx font-semibold">$1</strong>').replace(/`(.+?)`/g, '<code class="bg-bg-elevated text-primary-500 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>') }} />)
    }
    i++
  }
  return elements
}

function ProblemCard({ problem, isPremium }: { problem: Problem; isPremium: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const [showHints, setShowHints] = useState(false)
  const [userAnswer, setUserAnswer] = useState('')
  const [checked, setChecked] = useState<boolean | null>(null)

  const locked = problem.isPremium && !isPremium

  function checkAnswer() {
    const clean = (s: string) => s.toLowerCase().replace(/\s/g, '').replace(/[×x*]/g, '*')
    setChecked(clean(userAnswer) === clean(problem.answer))
  }

  return (
    <div className={`border rounded-md overflow-hidden transition-all ${locked ? 'border-bg-border opacity-60' : 'border-bg-border hover:border-primary/20'}`}>
      <button
        className="w-full flex items-center gap-3 p-5 text-left"
        onClick={() => !locked && setExpanded(!expanded)}
        disabled={locked}
      >
        <div className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium border ${difficultyStyle(problem.difficulty)}`}>
          {difficultyLabel(problem.difficulty)}
        </div>
        <span className="font-medium text-tx flex-1">{problem.title}</span>
        {locked ? <Lock size={16} className="text-tx-subtle shrink-0" /> : (
          expanded ? <ChevronUp size={16} className="text-tx-subtle shrink-0" /> : <ChevronDown size={16} className="text-tx-subtle shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-bg-border">
          {/* Statement */}
          <div className="bg-bg-elevated rounded-lg p-4 mt-4 mb-5">
            <pre className="text-tx text-sm whitespace-pre-wrap font-sans leading-relaxed">{problem.statement}</pre>
          </div>

          {/* User input */}
          <div className="mb-5">
            <label className="text-sm text-tx-muted mb-2 block">Tu respuesta</label>
            <div className="flex gap-2">
              <input
                value={userAnswer}
                onChange={(e) => { setUserAnswer(e.target.value); setChecked(null) }}
                placeholder="Escribe tu respuesta..."
                className="flex-1 bg-bg-elevated border border-bg-border rounded-lg px-3 py-2.5 text-tx text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 font-mono"
              />
              <button onClick={checkAnswer} className="bg-primary hover:bg-primary-hover text-white text-sm px-4 py-2.5 rounded-lg font-medium transition-colors">
                Verificar
              </button>
            </div>
            {checked !== null && (
              <div className={`mt-2 text-sm flex items-center gap-1.5 ${checked ? 'text-success' : 'text-danger'}`}>
                <CheckCircle2 size={14} />
                {checked ? '¡Correcto!' : `Incorrecto. Revisa los pasos.`}
              </div>
            )}
          </div>

          {/* Hints */}
          {problem.hints && problem.hints.length > 0 && (
            <div className="mb-5">
              <button onClick={() => setShowHints(!showHints)} className="flex items-center gap-1.5 text-warning text-sm hover:text-warning/80 transition-colors">
                <Lightbulb size={14} />
                {showHints ? 'Ocultar pistas' : 'Ver pistas'}
              </button>
              {showHints && (
                <ul className="mt-2 space-y-1.5">
                  {(problem.hints as string[]).map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-tx-muted">
                      <span className="text-warning text-xs mt-0.5">💡</span>{h}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Steps */}
          <div className="mb-5">
            <h4 className="text-sm font-semibold text-tx mb-3">Solución paso a paso</h4>
            <div className="space-y-4">
              {(problem.steps as ProblemStep[]).map((step) => (
                <div key={step.step} className="flex gap-4">
                  <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-bold flex items-center justify-center shrink-0">{step.step}</div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-tx-muted text-sm mb-1.5">{step.explanation}</p>
                    <div className="bg-bg-elevated border border-bg-border rounded-lg px-3 py-2 font-mono text-sm">
                      <span className="text-tx-muted">{step.expression}</span>
                      {step.result && step.result !== step.expression && (
                        <span className="text-primary ml-2">→ {step.result}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Answer */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAnswer(!showAnswer)}
              className="flex items-center gap-1.5 text-tx-muted text-sm hover:text-tx transition-colors"
            >
              {showAnswer ? <EyeOff size={14} /> : <Eye size={14} />}
              {showAnswer ? 'Ocultar respuesta' : 'Mostrar respuesta final'}
            </button>
            {showAnswer && (
              <span className="bg-success/10 text-success border border-success/20 text-sm px-3 py-1 rounded-lg font-mono">{problem.answer}</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function UnitContent({ unit, courseSlug, userId, isPremium }: Props) {
  const [markingDone, setMarkingDone] = useState(false)
  const [done, setDone] = useState(false)

  async function markComplete() {
    setMarkingDone(true)
    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId: unit.course.id, unitId: unit.id, completed: true }),
    })
    setMarkingDone(false)
    setDone(true)
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-tx">{unit.title}</h1>
      </div>

      {/* Theory */}
      <div className="bg-bg-surface border border-bg-border rounded-lg p-8 mb-8">
        <h2 className="text-base font-semibold text-tx-muted uppercase tracking-wider mb-5 text-xs">Contenido</h2>
        <div>{renderContent(unit.content)}</div>
      </div>

      {/* Problems */}
      {unit.problems.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-tx mb-4">Problemas ({unit.problems.length})</h2>
          <div className="space-y-3">
            {unit.problems.map((p) => (
              <ProblemCard key={p.id} problem={p} isPremium={isPremium} />
            ))}
          </div>
        </div>
      )}

      {/* Mark complete */}
      {!done ? (
        <button
          onClick={markComplete}
          disabled={markingDone}
          className="flex items-center gap-2 bg-success/10 hover:bg-success/20 text-success border border-success/20 rounded-md px-6 py-3 font-medium text-sm transition-colors"
        >
          <CheckCircle2 size={17} />
          {markingDone ? 'Guardando…' : 'Marcar unidad como completada'}
        </button>
      ) : (
        <div className="flex items-center gap-2 text-success text-sm">
          <CheckCircle2 size={17} />
          Unidad completada
        </div>
      )}
    </div>
  )
}
