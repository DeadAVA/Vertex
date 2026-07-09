'use client'
import { useState, useRef } from 'react'
import { Loader2, Sparkles, Camera, X, CheckCircle2 } from 'lucide-react'
import { MathRenderer } from './MathRenderer'

interface Step {
  numero: number
  titulo: string
  explicacion: string
  expresion: string
}

interface SolverResult {
  tipo: string
  problema: string
  pasos: Step[]
  respuesta: string
  verificacion?: string
}

export function AISolverForm() {
  const [text, setText] = useState('')
  const [image, setImage] = useState<{ base64: string; type: string; preview: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SolverResult | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const full = e.target?.result as string
      setImage({ base64: full.split(',')[1], type: file.type, preview: full })
    }
    reader.readAsDataURL(file)
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  async function solve() {
    if (!text.trim() && !image) return
    setLoading(true)
    setResult(null)
    setError('')

    const body: any = {}
    if (text.trim()) body.text = text.trim()
    if (image) { body.image = image.base64; body.imageType = image.type }

    const res = await fetch('/api/ai-solver', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok || data.error) setError(data.error ?? 'Error desconocido.')
    else setResult(data)
  }

  function clear() {
    setText('')
    setImage(null)
    setResult(null)
    setError('')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Input */}
      <div className="bg-bg-surface border border-bg-border rounded-2xl p-6 space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"Ej: Resuelve x² + 3x - 4 = 0\nEj: Deriva f(x) = sen(x)·cos(x)\nEj: Un tren sale a 80 km/h..."}
          rows={3}
          className="w-full bg-bg-elevated border border-bg-border rounded-xl px-4 py-3 text-tx placeholder-tx-subtle text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors resize-none font-mono"
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) solve() }}
        />

        {/* Image zone */}
        {!image ? (
          <div
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-bg-border hover:border-primary/40 rounded-xl p-4 text-center cursor-pointer transition-colors group"
          >
            <Camera size={20} className="text-tx-subtle group-hover:text-primary mx-auto mb-1.5 transition-colors" />
            <p className="text-sm text-tx-muted">Sube foto de tu tarea, examen o pizarrón</p>
            <p className="text-xs text-tx-subtle mt-0.5">Requiere modelo con visión (llava, llama3.2-vision…)</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
          </div>
        ) : (
          <div className="relative">
            <img src={image.preview} alt="Problema" className="w-full max-h-48 object-contain rounded-xl border border-bg-border bg-bg-elevated" />
            <button
              onClick={() => setImage(null)}
              className="absolute top-2 right-2 w-7 h-7 bg-bg-surface border border-bg-border rounded-full flex items-center justify-center hover:bg-danger/10 hover:text-danger transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={solve}
            disabled={loading || (!text.trim() && !image)}
            className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-xl py-3 font-semibold text-sm transition-colors shadow-glow-sm"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {loading ? 'Resolviendo…' : 'Resolver'}
          </button>
          {(text || image || result) && (
            <button onClick={clear} className="px-4 rounded-xl border border-bg-border text-tx-muted hover:text-tx text-sm transition-colors">
              Limpiar
            </button>
          )}
        </div>
        <p className="text-xs text-tx-subtle text-center">Ctrl+Enter para resolver · Álgebra, cálculo, física, geometría, problemas de palabras</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-danger/5 border border-danger/20 rounded-2xl p-5">
          <p className="text-danger text-sm font-medium mb-1">Error</p>
          <p className="text-tx-muted text-sm">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-bg-surface border border-bg-border rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-bg-border bg-primary/5">
            <div className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">{result.tipo}</div>
            <div className="text-tx text-base font-mono">
              <MathRenderer text={result.problema} />
            </div>
          </div>

          {/* Steps */}
          <div className="px-6 py-5 space-y-5">
            <div className="text-xs font-semibold text-tx-muted uppercase tracking-wider">Solución paso a paso</div>

            {result.pasos.map((paso) => (
              <div key={paso.numero} className="flex gap-4">
                <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {paso.numero}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-tx text-sm mb-1">{paso.titulo}</div>
                  <div className="text-tx-muted text-sm mb-2 leading-relaxed">
                    <MathRenderer text={paso.explicacion} />
                  </div>
                  {paso.expresion && paso.expresion.trim() && (
                    <div className="bg-bg-elevated border border-bg-border rounded-xl px-4 py-3 overflow-x-auto">
                      <MathRenderer text={paso.expresion} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Answer */}
          {result.respuesta && (
            <div className="px-6 pb-5">
              <div className="bg-success/10 border border-success/30 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle2 size={20} className="text-success shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-success font-semibold uppercase tracking-wider mb-1">Respuesta</div>
                  <div className="text-tx font-semibold text-lg">
                    <MathRenderer text={result.respuesta} />
                  </div>
                </div>
              </div>
              {result.verificacion && (
                <div className="mt-3 px-1 text-sm text-tx-muted">
                  <span className="text-success mr-1">✓</span>
                  <MathRenderer text={result.verificacion} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
