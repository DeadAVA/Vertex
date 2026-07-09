import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Check } from 'lucide-react'
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
      <div className="mb-10">
        <h1 className="font-display text-[28px] font-bold text-tx tracking-tight mb-1.5">Elige tu plan</h1>
        <p className="text-tx-muted text-sm">Empieza gratis. Actualiza cuando necesites más.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 max-w-3xl">
        {/* Free */}
        <div className="bg-bg-surface border border-bg-border rounded-lg p-7 flex flex-col">
          <div>
            <div className="text-[11px] font-semibold text-tx-muted uppercase tracking-[0.08em] mb-4">Gratuito</div>
            <div className="flex items-end gap-1 mb-1">
              <span className="font-display text-4xl font-bold text-tx tracking-tight">$0</span>
            </div>
            <div className="text-tx-subtle text-xs mb-6">Para siempre</div>
          </div>

          <ul className="space-y-3 mb-8 flex-1">
            {FREE.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-tx-muted">
                <Check size={13} className="text-success mt-0.5 shrink-0" strokeWidth={2.5} />
                {f}
              </li>
            ))}
          </ul>

          <div
            className={`text-center rounded-md py-2.5 text-sm font-semibold ${
              !isPremium ? 'bg-bg-elevated text-tx border border-bg-border' : 'bg-bg-elevated/50 text-tx-muted'
            }`}
          >
            {isPremium ? 'Plan anterior' : 'Tu plan actual'}
          </div>
        </div>

        {/* Premium */}
        <div className="bg-bg-surface border border-bg-border rounded-lg overflow-hidden flex flex-col">
          {/* Top accent bar */}
          <div className="h-[3px] bg-primary" />
          <div className="p-7 flex flex-col flex-1">
            <div>
              <div className="text-[11px] font-semibold text-primary uppercase tracking-[0.08em] mb-4">Premium</div>
              <div className="flex items-end gap-1 mb-1">
                <span className="font-display text-4xl font-bold text-tx tracking-tight">$149</span>
                <span className="text-tx-muted text-sm mb-1">MXN</span>
              </div>
              <div className="text-tx-subtle text-xs mb-6">por mes</div>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {PREMIUM.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-tx-muted">
                  <Check size={13} className="text-primary mt-0.5 shrink-0" strokeWidth={2.5} />
                  {f}
                </li>
              ))}
            </ul>

            {isPremium ? (
              <div className="space-y-2">
                <div className="text-center bg-primary/10 border border-primary/20 text-primary rounded-md py-2.5 text-sm font-semibold">
                  Plan activo
                </div>
                <ManageButton />
              </div>
            ) : (
              <UpgradeButton />
            )}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-8 max-w-3xl bg-bg-surface border border-bg-border rounded-lg p-6">
        <h3 className="font-display font-semibold text-tx text-sm tracking-tight mb-4">Preguntas frecuentes</h3>
        <div className="space-y-4 text-sm text-tx-muted">
          <div>
            <span className="text-tx font-medium block mb-0.5">¿Puedo cancelar cuando quiera?</span>
            Sí, puedes cancelar en cualquier momento desde tu perfil. Mantienes el acceso hasta el fin del periodo.
          </div>
          <div>
            <span className="text-tx font-medium block mb-0.5">¿El pago es seguro?</span>
            Los pagos se procesan a través de Stripe, el estándar de la industria.
          </div>
          <div>
            <span className="text-tx font-medium block mb-0.5">¿Hay periodo de prueba?</span>
            La cuenta gratuita ya te da acceso a contenido de calidad para que lo pruebes antes de decidir.
          </div>
        </div>
      </div>
    </div>
  )
}
