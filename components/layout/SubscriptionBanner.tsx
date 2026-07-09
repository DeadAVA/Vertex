'use client'
import { useSession } from 'next-auth/react'
import { Crown, X } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SubscriptionBanner() {
  const { data: session } = useSession()
  const [dismissed, setDismissed] = useState(false)
  const router = useRouter()

  if (session?.user?.plan === 'PREMIUM' || dismissed) return null

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 flex items-center gap-3 mb-6">
      <Crown size={18} className="text-primary shrink-0" />
      <p className="text-sm text-tx flex-1">
        <span className="font-medium text-primary">Mejora a Premium</span> para desbloquear física, cálculo y el solver avanzado.
      </p>
      <button
        onClick={() => router.push('/precios')}
        className="text-xs bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0"
      >
        Ver planes
      </button>
      <button onClick={() => setDismissed(true)} className="text-tx-subtle hover:text-tx transition-colors shrink-0">
        <X size={16} />
      </button>
    </div>
  )
}
