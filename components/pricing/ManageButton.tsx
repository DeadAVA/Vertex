'use client'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

export function ManageButton() {
  const [loading, setLoading] = useState(false)

  async function open() {
    setLoading(true)
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setLoading(false)
  }

  return (
    <button
      onClick={open}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 bg-bg-elevated hover:bg-bg-border text-tx-muted rounded-xl py-2.5 text-sm font-medium transition-colors border border-bg-border"
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {loading ? 'Abriendo portal…' : 'Gestionar suscripción'}
    </button>
  )
}
