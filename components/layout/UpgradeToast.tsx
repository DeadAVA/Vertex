'use client'
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Crown } from 'lucide-react'

export function UpgradeToast() {
  const { update } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Force session refresh so JWT picks up new plan from DB
    update().then(() => {
      // Remove the query param without reload
      router.replace('/dashboard')
    })
  }, [update, router])

  return (
    <div className="mb-6 bg-primary/10 border border-primary/25 rounded-lg p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="w-9 h-9 rounded-md bg-primary/20 flex items-center justify-center shrink-0">
        <Crown size={16} className="text-primary" />
      </div>
      <div>
        <div className="font-semibold text-tx">¡Bienvenido a Premium!</div>
        <div className="text-sm text-tx-muted">Tu suscripción está activa. Disfruta todas las funciones.</div>
      </div>
    </div>
  )
}
