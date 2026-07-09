'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'

export function RegisterForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Error al crear la cuenta.')
      setLoading(false)
      return
    }

    await signIn('credentials', { email, password, redirect: false })
    router.push('/dashboard')
    router.refresh()
  }

  const pwStrong = password.length >= 8

  return (
    <div className="w-full max-w-md">
      <div className="bg-bg-surface border border-bg-border rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-tx mb-1">Crea tu cuenta</h1>
        <p className="text-tx-muted text-sm mb-8">Empieza gratis, sin tarjeta de crédito.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-tx mb-1.5">Nombre completo</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              placeholder="Tu nombre"
              className="w-full bg-bg-elevated border border-bg-border rounded-xl px-4 py-3 text-tx placeholder-tx-subtle text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-tx mb-1.5">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu@correo.com"
              className="w-full bg-bg-elevated border border-bg-border rounded-xl px-4 py-3 text-tx placeholder-tx-subtle text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-tx mb-1.5">Contraseña</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Mínimo 8 caracteres"
                className="w-full bg-bg-elevated border border-bg-border rounded-xl px-4 py-3 pr-11 text-tx placeholder-tx-subtle text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-tx-subtle hover:text-tx-muted transition-colors">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {password && (
              <div className={`flex items-center gap-1.5 mt-2 text-xs ${pwStrong ? 'text-success' : 'text-warning'}`}>
                <CheckCircle2 size={12} />
                {pwStrong ? 'Contraseña segura' : 'Mínimo 8 caracteres'}
              </div>
            )}
          </div>

          {error && (
            <div className="text-danger text-sm bg-danger/10 border border-danger/20 rounded-lg px-4 py-3">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-xl py-3 font-semibold text-sm transition-colors shadow-glow-sm"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Creando cuenta…' : 'Crear cuenta gratis'}
          </button>
        </form>

        <p className="text-center text-tx-muted text-sm mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-primary hover:text-primary-hover font-medium transition-colors">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
