'use client'
import { useEffect, useState } from 'react'
import { Plus, Check, Archive, Loader2, RefreshCw, ExternalLink } from 'lucide-react'

type PriceRow = {
  id: string
  amount: number
  currency: string
  interval: string
  intervalCount: number
  nickname: string | null
  active: boolean
  created: number
  isCurrentActive: boolean
}

type PlansData = {
  productId: string
  productName: string
  activePriceId: string
  premiumCount: number
  prices: PriceRow[]
}

type FormState = {
  amount: string
  currency: string
  interval: string
  nickname: string
}

const EMPTY_FORM: FormState = { amount: '', currency: 'MXN', interval: 'month', nickname: '' }

export default function AdminPlanesPage() {
  const [data, setData] = useState<PlansData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/plans')
      if (!res.ok) throw new Error(await res.text())
      setData(await res.json())
    } catch (e: any) {
      setError(e.message ?? 'Error al cargar planes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function createPrice(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseFloat(form.amount)
    if (!amount || amount <= 0) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: data!.productId,
          amount,
          currency: form.currency.toLowerCase(),
          interval: form.interval,
          nickname: form.nickname || undefined,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Error')
      }
      setForm(EMPTY_FORM)
      setShowForm(false)
      await load()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function activatePrice(priceId: string) {
    setActionId(priceId)
    try {
      const res = await fetch(`/api/admin/plans/${priceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activate' }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error)
      }
      await load()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setActionId(null)
    }
  }

  async function archivePrice(priceId: string, nickname: string | null) {
    if (!confirm(`¿Archivar el precio "${nickname ?? priceId}"? Los suscriptores actuales no se verán afectados.`)) return
    setActionId(priceId)
    try {
      const res = await fetch(`/api/admin/plans/${priceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'archive' }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error)
      }
      await load()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setActionId(null)
    }
  }

  function fmtAmount(amount: number, currency: string, interval: string, count: number) {
    const fmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency, minimumFractionDigits: 0 })
    const per = count === 1 ? interval : `${count} ${interval}s`
    return `${fmt.format(amount)} / ${per === 'month' ? 'mes' : per === 'year' ? 'año' : per}`
  }

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-bold text-tx tracking-tight">Planes & Precios</h1>
          <p className="text-tx-muted text-sm mt-1">
            Crea nuevos precios en Stripe y controla cuál usan los nuevos suscriptores.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={load}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium bg-bg-elevated border border-bg-border text-tx-muted hover:text-tx transition-colors"
          >
            <RefreshCw size={12} /> Actualizar
          </button>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold bg-primary hover:bg-primary-hover text-white transition-colors"
          >
            <Plus size={12} /> Nuevo precio
          </button>
        </div>
      </div>

      {/* Stats */}
      {data && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-bg-surface border border-bg-border rounded-lg p-5">
            <div className="text-[10px] font-semibold text-tx-muted uppercase tracking-[0.08em] mb-2">Producto</div>
            <div className="font-display font-bold text-tx text-lg">{data.productName}</div>
            <div className="text-tx-subtle text-xs mt-1 font-mono truncate">{data.productId}</div>
          </div>
          <div className="bg-bg-surface border border-bg-border rounded-lg p-5">
            <div className="text-[10px] font-semibold text-tx-muted uppercase tracking-[0.08em] mb-2">Suscriptores activos</div>
            <div className="font-display font-bold text-tx text-3xl">{data.premiumCount}</div>
            <div className="text-tx-subtle text-xs mt-1">plan Premium</div>
          </div>
          <div className="bg-bg-surface border border-bg-border rounded-lg p-5">
            <div className="text-[10px] font-semibold text-tx-muted uppercase tracking-[0.08em] mb-2">Precio activo</div>
            <div className="font-mono text-primary text-xs mt-1 break-all">{data.activePriceId}</div>
          </div>
        </div>
      )}

      {/* Create price form */}
      {showForm && (
        <div className="bg-bg-surface border border-bg-border rounded-lg p-6 mb-6">
          <h2 className="font-display font-semibold text-tx text-base tracking-tight mb-4">Crear nuevo precio en Stripe</h2>
          <div className="bg-warning/8 border border-warning/20 rounded-md px-4 py-3 text-xs text-warning mb-5">
            Los precios de Stripe son inmutables. Para "cambiar" un precio, crea uno nuevo y actívalo. Los suscriptores existentes mantienen su precio actual.
          </div>
          <form onSubmit={createPrice} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-tx-muted uppercase tracking-[0.08em] mb-2">Monto</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="149"
                required
                className="w-full bg-bg-elevated border border-bg-border rounded-md px-4 py-2.5 text-tx text-sm focus:outline-none focus:border-primary/50 transition-colors font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-tx-muted uppercase tracking-[0.08em] mb-2">Moneda</label>
              <select
                value={form.currency}
                onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                className="w-full bg-bg-elevated border border-bg-border rounded-md px-4 py-2.5 text-tx text-sm focus:outline-none focus:border-primary/50 transition-colors"
              >
                <option value="MXN">MXN — Peso Mexicano</option>
                <option value="USD">USD — Dólar</option>
                <option value="EUR">EUR — Euro</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-tx-muted uppercase tracking-[0.08em] mb-2">Intervalo</label>
              <select
                value={form.interval}
                onChange={e => setForm(f => ({ ...f, interval: e.target.value }))}
                className="w-full bg-bg-elevated border border-bg-border rounded-md px-4 py-2.5 text-tx text-sm focus:outline-none focus:border-primary/50 transition-colors"
              >
                <option value="month">Mensual</option>
                <option value="year">Anual</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-tx-muted uppercase tracking-[0.08em] mb-2">Etiqueta (opcional)</label>
              <input
                type="text"
                value={form.nickname}
                onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))}
                placeholder="Premium Mensual MXN"
                className="w-full bg-bg-elevated border border-bg-border rounded-md px-4 py-2.5 text-tx text-sm focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <div className="col-span-2 flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}
                className="px-4 py-2 rounded-md text-sm font-medium bg-bg-elevated border border-bg-border text-tx-muted hover:text-tx transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold bg-primary hover:bg-primary-hover disabled:opacity-50 text-white transition-colors"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                Crear precio en Stripe
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Prices table */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-tx-muted gap-2 text-sm">
          <Loader2 size={16} className="animate-spin" /> Cargando desde Stripe…
        </div>
      )}

      {error && (
        <div className="bg-danger/10 border border-danger/20 rounded-lg p-5 text-danger text-sm">{error}</div>
      )}

      {data && !loading && (
        <div className="bg-bg-surface border border-bg-border rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-bg-border flex items-center justify-between">
            <span className="font-display font-semibold text-tx text-sm tracking-tight">
              Precios — {data.productName}
            </span>
            <span className="text-tx-subtle text-xs">{data.prices.length} precio{data.prices.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="divide-y divide-bg-border">
            {data.prices.map(p => (
              <div key={p.id} className={`px-5 py-4 flex items-center gap-4 ${!p.active ? 'opacity-50' : ''}`}>
                {/* Active indicator */}
                <div className={`w-2 h-2 rounded-full shrink-0 ${p.isCurrentActive ? 'bg-success' : p.active ? 'bg-bg-border' : 'bg-danger'}`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-bold text-tx text-base tracking-tight">
                      {fmtAmount(p.amount, p.currency, p.interval, p.intervalCount)}
                    </span>
                    {p.nickname && (
                      <span className="text-xs text-tx-muted bg-bg-elevated border border-bg-border px-2 py-0.5 rounded">
                        {p.nickname}
                      </span>
                    )}
                    {p.isCurrentActive && (
                      <span className="text-[10px] font-bold bg-success/15 text-success border border-success/20 px-2 py-0.5 rounded uppercase tracking-wider">
                        Activo — nuevos suscriptores
                      </span>
                    )}
                    {!p.active && (
                      <span className="text-[10px] font-bold bg-danger/10 text-danger border border-danger/15 px-2 py-0.5 rounded uppercase tracking-wider">
                        Archivado
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-tx-muted mt-0.5 font-mono">{p.id}</div>
                  <div className="text-xs text-tx-subtle mt-0.5">
                    Creado {new Date(p.created).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {actionId === p.id
                    ? <Loader2 size={14} className="animate-spin text-tx-muted" />
                    : <>
                      {!p.isCurrentActive && p.active && (
                        <button
                          onClick={() => activatePrice(p.id)}
                          className="flex items-center gap-1.5 text-[11px] bg-success/10 hover:bg-success/20 text-success border border-success/20 px-3 py-1.5 rounded font-semibold transition-colors"
                        >
                          <Check size={10} /> Activar
                        </button>
                      )}
                      {p.active && !p.isCurrentActive && (
                        <button
                          onClick={() => archivePrice(p.id, p.nickname)}
                          className="flex items-center gap-1.5 text-[11px] bg-bg-elevated hover:bg-bg-border text-tx-muted border border-bg-border px-3 py-1.5 rounded font-semibold transition-colors"
                        >
                          <Archive size={10} /> Archivar
                        </button>
                      )}
                    </>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info box */}
      <div className="mt-6 bg-bg-surface border border-bg-border rounded-lg p-5 text-xs text-tx-muted space-y-1.5">
        <div className="font-semibold text-tx text-sm mb-2">Cómo funciona</div>
        <div><span className="text-success font-semibold">●</span> <strong className="text-tx">Verde</strong> — precio activo para nuevos checkouts (se guarda en Config, no en env)</div>
        <div><span className="text-tx-subtle">●</span> Gris — precio disponible en Stripe, pero no asignado a nuevos checkouts</div>
        <div><span className="text-danger font-semibold">●</span> Rojo — archivado en Stripe, no se puede usar para nuevas suscripciones</div>
        <div className="pt-1">Los suscriptores existentes <strong className="text-tx">siempre mantienen su precio original</strong> hasta que cancelen y vuelvan a suscribirse.</div>
      </div>
    </div>
  )
}
