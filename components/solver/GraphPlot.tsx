'use client'
import { useRef, useEffect, useState, useCallback } from 'react'
import { Plus, X, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import * as math from 'mathjs'

const CURVE_COLORS = ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#22d3ee']

// mathjs compile returns an object with .evaluate() — use minimal interface for compat
type Compiled = { evaluate: (scope?: Record<string, unknown>) => unknown }

interface FuncEntry {
  id: number
  raw: string
  compiled: Compiled | null
  color: string
  error: string
}

interface View { cx: number; cy: number; ppu: number }

function normalizeExpr(s: string): string {
  return s
    .replace(/\^/g, '**')
    .replace(/(\d)\s*([a-zA-Z(])/g, '$1*$2')
    .replace(/\)\s*\(/g, ')*(')
    .replace(/\)\s*([a-zA-Z])/g, ')*$1')
}

function tryCompile(expr: string): Compiled | null {
  if (!expr.trim()) return null
  try {
    const c = math.compile(normalizeExpr(expr))
    // mathjs may return EvalFunction or EvalFunction[] depending on overload
    const node = Array.isArray(c) ? c[0] : c
    return node as Compiled
  } catch { return null }
}

function evalCompiled(compiled: Compiled, x: number): number {
  try {
    const v = compiled.evaluate({ x, pi: Math.PI, e: Math.E })
    return typeof v === 'number' ? v : NaN
  } catch { return NaN }
}

function w2s(wx: number, wy: number, W: number, H: number, v: View) {
  return [W / 2 + (wx - v.cx) * v.ppu, H / 2 - (wy - v.cy) * v.ppu] as const
}
function s2w(sx: number, sy: number, W: number, H: number, v: View) {
  return [v.cx + (sx - W / 2) / v.ppu, v.cy - (sy - H / 2) / v.ppu] as const
}

function niceStep(ppu: number): number {
  const minPx = 60
  const raw = minPx / ppu
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  for (const m of [1, 2, 5, 10]) {
    if (mag * m >= raw) return mag * m
  }
  return mag * 10
}

function fmtLabel(n: number): string {
  const r = Math.round(n * 1e9) / 1e9
  if (Math.abs(r) >= 1e6) return r.toExponential(1)
  const s = String(r)
  return s.length > 6 ? parseFloat(r.toPrecision(4)).toString() : s
}

interface Props {
  initialExpression?: string
  height?: number
}

export function GraphPlot({ initialExpression = '', height = 380 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<View>({ cx: 0, cy: 0, ppu: 60 })
  const dragRef = useRef<{ ox: number; oy: number; cx0: number; cy0: number } | null>(null)
  const hoverRef = useRef<{ sx: number; sy: number } | null>(null)
  const rafRef = useRef(0)
  const [W, setW] = useState(600)
  const [funcs, setFuncs] = useState<FuncEntry[]>(() => [{
    id: 1, raw: initialExpression,
    compiled: tryCompile(initialExpression),
    color: CURVE_COLORS[0], error: '',
  }])
  const [inputs, setInputs] = useState<Record<number, string>>({ 1: initialExpression })
  const [nextId, setNextId] = useState(2)

  // Sync initialExpression changes (e.g. when user solves then clicks graph)
  useEffect(() => {
    if (!initialExpression) return
    setFuncs(fs => {
      if (fs.length === 1 && fs[0].raw === '') {
        return [{ ...fs[0], raw: initialExpression, compiled: tryCompile(initialExpression), error: '' }]
      }
      return fs
    })
    setInputs(v => (v[1] === '' ? { ...v, 1: initialExpression } : v))
  }, [initialExpression])

  // Resize observer
  useEffect(() => {
    const obs = new ResizeObserver(e => {
      const w = e[0]?.contentRect.width
      if (w) setW(Math.floor(w))
    })
    if (containerRef.current) obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [])

  // Render function (reads from refs, no state)
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const v = viewRef.current
    const H = height
    const dpr = window.devicePixelRatio || 1
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = W + 'px'
    canvas.style.height = H + 'px'
    ctx.scale(dpr, dpr)

    // Background
    ctx.fillStyle = '#0d0f16'
    ctx.fillRect(0, 0, W, H)

    const step = niceStep(v.ppu)
    const [wxL] = s2w(0, 0, W, H, v)
    const [wxR] = s2w(W, 0, W, H, v)
    const [, wyT] = s2w(0, 0, W, H, v)
    const [, wyB] = s2w(0, H, W, H, v)

    // Minor grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    ctx.lineWidth = 0.5
    const startX = Math.floor(wxL / step) * step
    const startY = Math.floor(wyB / step) * step
    for (let gx = startX; gx <= wxR + step; gx += step) {
      const [sx] = w2s(gx, 0, W, H, v)
      ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, H); ctx.stroke()
    }
    for (let gy = startY; gy <= wyT + step; gy += step) {
      const [, sy] = w2s(0, gy, W, H, v)
      ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(W, sy); ctx.stroke()
    }

    // Major grid (every 5 minor steps)
    const step5 = step * 5
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'
    ctx.lineWidth = 0.5
    const startX5 = Math.floor(wxL / step5) * step5
    const startY5 = Math.floor(wyB / step5) * step5
    for (let gx = startX5; gx <= wxR + step5; gx += step5) {
      const [sx] = w2s(gx, 0, W, H, v)
      ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, H); ctx.stroke()
    }
    for (let gy = startY5; gy <= wyT + step5; gy += step5) {
      const [, sy] = w2s(0, gy, W, H, v)
      ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(W, sy); ctx.stroke()
    }

    // Axes
    const [axSx] = w2s(0, 0, W, H, v)
    const [, axSy] = w2s(0, 0, W, H, v)
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'
    ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(0, axSy); ctx.lineTo(W, axSy); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(axSx, 0); ctx.lineTo(axSx, H); ctx.stroke()

    // Axis arrows
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.beginPath(); ctx.moveTo(W - 6, axSy - 4); ctx.lineTo(W, axSy); ctx.lineTo(W - 6, axSy + 4); ctx.fill()
    ctx.beginPath(); ctx.moveTo(axSx - 4, 6); ctx.lineTo(axSx, 0); ctx.lineTo(axSx + 4, 6); ctx.fill()

    // Tick labels
    const fs = Math.max(9, Math.min(12, v.ppu / 6))
    ctx.font = `${fs}px monospace`
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    const labelStep = step5
    const labelStartX = Math.floor(wxL / labelStep) * labelStep
    ctx.textAlign = 'center'
    for (let lx = labelStartX; lx <= wxR + labelStep; lx += labelStep) {
      if (Math.abs(lx) < labelStep * 0.01) continue
      const [sx] = w2s(lx, 0, W, H, v)
      const ly = Math.min(Math.max(axSy + 14, 14), H - 6)
      ctx.fillText(fmtLabel(lx), sx, ly)
      // Tick mark
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(sx, axSy - 3); ctx.lineTo(sx, axSy + 3); ctx.stroke()
    }
    const labelStartY = Math.floor(wyB / labelStep) * labelStep
    ctx.textAlign = 'right'
    for (let ly = labelStartY; ly <= wyT + labelStep; ly += labelStep) {
      if (Math.abs(ly) < labelStep * 0.01) continue
      const [, sy] = w2s(0, ly, W, H, v)
      const lx = Math.min(Math.max(axSx - 8, 4), W - 4)
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      ctx.fillText(fmtLabel(ly), lx, sy + fs * 0.35)
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(axSx - 3, sy); ctx.lineTo(axSx + 3, sy); ctx.stroke()
    }

    // Axis labels
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = 'bold 12px monospace'
    ctx.textAlign = 'left'
    ctx.fillText('x', W - 18, Math.min(Math.max(axSy - 8, 6), H - 6))
    ctx.textAlign = 'center'
    ctx.fillText('y', Math.min(Math.max(axSx + 10, 14), W - 6), 14)

    // Function curves
    const N = Math.ceil(W * 2.5)
    for (const fn of funcs) {
      if (!fn.compiled) continue
      ctx.strokeStyle = fn.color
      ctx.lineWidth = 2.5
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'

      let prevWy = NaN
      let path = new Path2D()
      let penDown = false

      for (let i = 0; i <= N; i++) {
        const sx = (i / N) * W
        const [wx] = s2w(sx, 0, W, H, v)
        const wy = evalCompiled(fn.compiled, wx)
        const [, sy] = w2s(wx, wy, W, H, v)
        const valid = isFinite(wy) && !isNaN(wy)
        const jump = Math.abs(wy - prevWy) > (wyT - wyB) * 8
        if (valid && !jump && sy > -H * 3 && sy < H * 4) {
          if (!penDown) { path.moveTo(sx, sy); penDown = true }
          else path.lineTo(sx, sy)
        } else {
          penDown = false
        }
        prevWy = wy
      }
      ctx.stroke(path)
    }

    // Crosshair
    if (hoverRef.current) {
      const { sx: mx, sy: my } = hoverRef.current
      const [wx, wy] = s2w(mx, my, W, H, v)

      ctx.strokeStyle = 'rgba(255,255,255,0.15)'
      ctx.lineWidth = 1
      ctx.setLineDash([5, 5])
      ctx.beginPath(); ctx.moveTo(mx, 0); ctx.lineTo(mx, H); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, my); ctx.lineTo(W, my); ctx.stroke()
      ctx.setLineDash([])

      // Dot on each curve at x = wx
      for (const fn of funcs) {
        if (!fn.compiled) continue
        const fy = evalCompiled(fn.compiled, wx)
        if (!isFinite(fy)) continue
        const [, fsy] = w2s(wx, fy, W, H, v)
        if (fsy < -10 || fsy > H + 10) continue
        ctx.fillStyle = fn.color
        ctx.beginPath(); ctx.arc(mx, fsy, 4.5, 0, Math.PI * 2); ctx.fill()
        ctx.strokeStyle = '#0d0f16'
        ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.arc(mx, fsy, 4.5, 0, Math.PI * 2); ctx.stroke()
      }

      // Coordinate badge
      const label = `(${fmtLabel(wx)},  ${fmtLabel(wy)})`
      ctx.font = '11px monospace'
      const tw = ctx.measureText(label).width + 16
      let tx = mx + 14
      let ty = my - 32
      if (tx + tw > W - 4) tx = mx - tw - 14
      if (ty < 4) ty = my + 14
      ctx.fillStyle = 'rgba(13,15,22,0.9)'
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'
      ctx.lineWidth = 1
      ctx.beginPath()
      if (ctx.roundRect) ctx.roundRect(tx, ty, tw, 22, 5)
      else ctx.rect(tx, ty, tw, 22)
      ctx.fill(); ctx.stroke()
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.textAlign = 'left'
      ctx.fillText(label, tx + 8, ty + 15)
    }
  }, [W, height, funcs])

  // Schedule render
  useEffect(() => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(draw)
  }, [draw])

  // Non-passive wheel handler (must be imperative)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      const v = viewRef.current
      const [wx, wy] = s2w(mx, my, W, height, v)
      const factor = e.deltaY < 0 ? 1.2 : 1 / 1.2
      v.ppu = Math.max(4, Math.min(3000, v.ppu * factor))
      // Keep the world point under cursor fixed
      const [nsx, nsy] = w2s(wx, wy, W, height, v)
      v.cx -= (nsx - mx) / v.ppu
      v.cy += (nsy - my) / v.ppu
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(draw)
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', onWheel)
  }, [W, height, draw])

  function onMouseDown(e: React.MouseEvent) {
    const rect = canvasRef.current!.getBoundingClientRect()
    const v = viewRef.current
    dragRef.current = { ox: e.clientX - rect.left, oy: e.clientY - rect.top, cx0: v.cx, cy0: v.cy }
  }

  function onMouseMove(e: React.MouseEvent) {
    const rect = canvasRef.current!.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    hoverRef.current = { sx: mx, sy: my }
    const v = viewRef.current
    if (dragRef.current) {
      const dx = mx - dragRef.current.ox
      const dy = my - dragRef.current.oy
      v.cx = dragRef.current.cx0 - dx / v.ppu
      v.cy = dragRef.current.cy0 + dy / v.ppu
    }
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(draw)
  }

  function onMouseLeave() {
    hoverRef.current = null
    dragRef.current = null
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(draw)
  }

  function onMouseUp() { dragRef.current = null }

  function zoomIn() {
    viewRef.current.ppu = Math.min(3000, viewRef.current.ppu * 1.4)
    cancelAnimationFrame(rafRef.current); rafRef.current = requestAnimationFrame(draw)
  }
  function zoomOut() {
    viewRef.current.ppu = Math.max(4, viewRef.current.ppu / 1.4)
    cancelAnimationFrame(rafRef.current); rafRef.current = requestAnimationFrame(draw)
  }
  function resetView() {
    viewRef.current = { cx: 0, cy: 0, ppu: 60 }
    cancelAnimationFrame(rafRef.current); rafRef.current = requestAnimationFrame(draw)
  }

  function addFunc() {
    const id = nextId
    setNextId(id + 1)
    setFuncs(fs => [...fs, { id, raw: '', compiled: null, color: CURVE_COLORS[fs.length % CURVE_COLORS.length], error: '' }])
    setInputs(v => ({ ...v, [id]: '' }))
  }

  function removeFunc(id: number) {
    setFuncs(fs => fs.filter(f => f.id !== id))
    setInputs(v => { const n = { ...v }; delete n[id]; return n })
  }

  function updateFunc(id: number, raw: string) {
    setInputs(v => ({ ...v, [id]: raw }))
    const compiled = tryCompile(raw)
    const error = raw.trim() && !compiled ? 'Expresión inválida' : ''
    setFuncs(fs => fs.map(f => f.id === id ? { ...f, raw, compiled, error } : f))
  }

  return (
    <div className="space-y-3">
      {/* Function list */}
      <div className="space-y-2">
        {funcs.map((fn, idx) => (
          <div key={fn.id} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0 mt-0.5" style={{ background: fn.color }} />
            <span className="text-xs text-tx-subtle font-mono w-10 shrink-0 select-none">
              {String.fromCharCode(102 + idx)}(x)=
            </span>
            <div className="flex-1 relative">
              <input
                value={inputs[fn.id] ?? ''}
                onChange={e => updateFunc(fn.id, e.target.value)}
                placeholder="x^2,  sin(x),  sqrt(x)..."
                className="w-full bg-bg-elevated border border-bg-border rounded-lg px-3 py-1.5 text-tx text-sm font-mono focus:outline-none focus:border-primary/50 transition-colors"
              />
              {fn.error && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-danger text-xs">{fn.error}</span>}
            </div>
            {funcs.length > 1 && (
              <button onClick={() => removeFunc(fn.id)} className="text-tx-subtle hover:text-danger p-1 rounded transition-colors shrink-0">
                <X size={14} />
              </button>
            )}
          </div>
        ))}
        <div className="flex items-center justify-between">
          <button onClick={addFunc} className="flex items-center gap-1.5 text-xs text-primary hover:text-primary-hover transition-colors">
            <Plus size={12} /> Agregar función
          </button>
          <div className="flex items-center gap-1">
            <button onClick={zoomIn} title="Zoom +" className="p-1.5 rounded-lg text-tx-subtle hover:text-tx hover:bg-bg-elevated transition-colors"><ZoomIn size={14} /></button>
            <button onClick={zoomOut} title="Zoom -" className="p-1.5 rounded-lg text-tx-subtle hover:text-tx hover:bg-bg-elevated transition-colors"><ZoomOut size={14} /></button>
            <button onClick={resetView} title="Restablecer" className="p-1.5 rounded-lg text-tx-subtle hover:text-tx hover:bg-bg-elevated transition-colors"><RotateCcw size={14} /></button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="w-full rounded-xl overflow-hidden border border-bg-border"
        style={{ height }}
      >
        <canvas
          ref={canvasRef}
          className="cursor-crosshair select-none"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
        />
      </div>
      <p className="text-xs text-tx-subtle text-center select-none">
        Scroll para zoom · Arrastrar para mover · Hover para coordenadas
      </p>
    </div>
  )
}
