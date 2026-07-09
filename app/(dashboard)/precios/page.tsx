import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CheckCircle2 } from 'lucide-react'
import { UpgradeButton } from '@/components/pricing/UpgradeButton'
import { ManageButton } from '@/components/pricing/ManageButton'

export const metadata: Metadata = { title: 'Precios' }

const FREE = [
  'Cursos básicos: Álgebra, Aritmética, Geometría, Web',
  'Calculadora científica, cuadrática y de porcentajes',
  'Calculadora de física (MRUA, Newton, Energía)',
  'Problemas con pistas incluidas',
  'Seguimiento de progreso',
]

const PREMIUM = [
  'Todo lo del plan gratuito',
  'Mecánica Clásica (cinemática, Newton, energía)',
  'Cálculo Diferencial (límites y derivadas)',
  'Motor matemático avanzado (derivadas, integrales, límites)',
  'Nuevos cursos cada mes',
  'Sin anuncios ni distracciones',
]

export default async function PreciosPage() {
  const session = await getServerSession(authOptions)
  const isPremium = session?.user?.plan === 'PREMIUM'

  return (
    <div>
      <h1 className="text-3xl font-bold text-tx mb-2">Elige tu plan</h1>
      <p className="text-tx-muted mb-10">Empieza gratis, actualiza cuando necesites más.</p>

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
        {/* Free */}
        <div className="bg-bg-surface border border-bg-border rounded-2xl p-8">
          <div className="text-sm font-medium text-tx-muted mb-2">Gratuito</div>
          <div className="text-4xl font-bold text-tx mb-1">$0</div>
          <div className="text-tx-muted text-sm mb-6">Para siempre</div>
          <ul className="space-y-3 mb-8">
            {FREE.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-tx-muted">
                <CheckCircle2 size={16} className="text-success mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <div className={`block text-center rounded-xl py-3 font-medium text-sm ${!isPremium ? 'bg-bg-border text-tx' : 'bg-bg-elevated text-tx-muted'}`}>
            {isPremium ? 'Plan anterior' : 'Tu plan actual'}
          </div>
        </div>

        {/* Premium */}
        <div className="bg-bg-surface border border-primary/40 rounded-2xl p-8 relative overflow-hidden border-glow">
          <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg">PREMIUM</div>
          <div className="text-sm font-medium text-primary mb-2">Premium</div>
          <div className="text-4xl font-bold text-tx mb-1">$149</div>
          <div className="text-tx-muted text-sm mb-6">por mes (MXN)</div>
          <ul className="space-y-3 mb-8">
            {PREMIUM.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-tx-muted">
                <CheckCircle2 size={16} className="text-primary mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {isPremium ? (
            <div className="space-y-3">
              <div className="text-center bg-primary/10 border border-primary/20 text-primary rounded-xl py-3 text-sm font-medium">
                Plan activo ✓
              </div>
              <ManageButton />
            </div>
          ) : (
            <UpgradeButton />
          )}
        </div>
      </div>

      <div className="mt-8 max-w-3xl bg-bg-surface border border-bg-border rounded-xl p-5">
        <h3 className="font-semibold text-tx mb-2 text-sm">Preguntas frecuentes</h3>
        <div className="space-y-3 text-sm text-tx-muted">
          <div><span className="text-tx font-medium">¿Puedo cancelar cuando quiera?</span> Sí, puedes cancelar en cualquier momento desde tu perfil. Mantienes el acceso hasta el fin del periodo.</div>
          <div><span className="text-tx font-medium">¿El pago es seguro?</span> Sí, los pagos se procesan a través de Stripe, el estándar de la industria.</div>
          <div><span className="text-tx font-medium">¿Hay periodo de prueba?</span> La cuenta gratuita ya te da acceso a contenido de calidad para que lo pruebes antes de decidir.</div>
        </div>
      </div>
    </div>
  )
}
