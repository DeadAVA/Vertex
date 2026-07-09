'use client'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

export function UpgradeButton() {
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    const res = await fetch('/api/stripe/checkout', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setLoading(false)
  }

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-xl py-3 font-semibold text-sm transition-colors shadow-glow-sm"
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {loading ? 'Redirigiendo a Stripe…' : 'Suscribirse ahora'}
    </button>
  )
}
