'use client'
import { useState } from 'react'
import { Loader2, Crown, CreditCard, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Sub {
  status: string
  stripePriceId: string | null
  currentPeriodEnd: string | null
  stripeCustomerId: string | null
}

interface Props {
  plan: 'FREE' | 'PREMIUM'
  sub: Sub | null
}

const STATUS_STYLES: Record<string, { label: string; color: string; icon: React.FC<any> }> = {
  ACTIVE:     { label: 'Activa',       color: 'text-success',  icon: CheckCircle2 },
  CANCELED:   { label: 'Cancelada',    color: 'text-danger',   icon: XCircle },
  PAST_DUE:   { label: 'Pago vencido', color: 'text-warning',  icon: AlertTriangle },
  INCOMPLETE: { label: 'Incompleta',   color: 'text-warning',  icon: AlertTriangle },
}

export function BillingSection({ plan, sub }: Props) {
  const [loading, setLoading] = useState(false)

  async function openPortal() {
    setLoading(true)
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setLoading(false)
  }

  const isPremium = plan === 'PREMIUM'
  const statusInfo = sub ? (STATUS_STYLES[sub.status] ?? STATUS_STYLES.ACTIVE) : null

  return (
    <div className="bg-bg-surface border border-bg-border rounded-lg p-6">
      <h2 className="font-semibold text-tx mb-5 flex items-center gap-2">
        <CreditCard size={16} className="text-tx-muted" /> Suscripción y pagos
      </h2>

      {/* Current plan badge */}
      <div className={`flex items-center gap-4 p-4 rounded-md border mb-5 ${
        isPremium
          ? 'bg-primary/5 border-primary/20'
          : 'bg-bg-elevated border-bg-border'
      }`}>
        <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${
          isPremium ? 'bg-primary/15' : 'bg-bg-border'
        }`}>
          <Crown size={18} className={isPremium ? 'text-primary' : 'text-tx-subtle'} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-tx">{isPremium ? 'Plan Premium' : 'Plan Gratuito'}</div>
          <div className="text-xs text-tx-muted mt-0.5">
            {isPremium ? '$149 MXN / mes' : 'Sin costo · Funciones básicas'}
          </div>
        </div>
        {statusInfo && (
          <div className={`flex items-center gap-1.5 text-xs font-medium ${statusInfo.color}`}>
            <statusInfo.icon size={13} />
            {statusInfo.label}
          </div>
        )}
      </div>

      {/* Subscription details */}
      {sub && isPremium && (
        <div className="space-y-2 mb-5">
          {sub.currentPeriodEnd && (
            <div className="flex justify-between items-center text-sm py-2 border-b border-bg-border">
              <span className="text-tx-muted">Próximo cobro</span>
              <span className="text-tx font-medium">{formatDate(sub.currentPeriodEnd)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm py-2 border-b border-bg-border">
            <span className="text-tx-muted">Método de pago</span>
            <button onClick={openPortal} className="text-primary text-xs hover:underline">
              Ver en portal
            </button>
          </div>
          <div className="flex justify-between items-center text-sm py-2">
            <span className="text-tx-muted">Historial de pagos</span>
            <button onClick={openPortal} className="text-primary text-xs hover:underline">
              Ver facturas
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      {isPremium && sub?.stripeCustomerId ? (
        <button
          onClick={openPortal}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-bg-elevated hover:bg-bg-border text-tx-muted rounded-md py-3 text-sm font-medium transition-colors border border-bg-border"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
          {loading ? 'Abriendo portal de Stripe…' : 'Gestionar suscripción y tarjetas'}
        </button>
      ) : !isPremium ? (
        <a
          href="/precios"
          className="block w-full text-center bg-primary hover:bg-primary-hover text-white rounded-md py-3 font-semibold text-sm transition-colors "
        >
          <Crown size={14} className="inline mr-1.5" />
          Actualizar a Premium — $149 MXN/mes
        </a>
      ) : null}

      {/* Past due warning */}
      {sub?.status === 'PAST_DUE' && (
        <div className="mt-4 p-3 bg-warning/5 border border-warning/25 rounded-md flex items-start gap-2.5">
          <AlertTriangle size={14} className="text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-tx-muted">
            Hay un problema con tu pago. Actualiza tu método de pago para continuar con Premium.
          </p>
        </div>
      )}
    </div>
  )
}
