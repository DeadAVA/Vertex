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
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <h1 className="font-display text-[26px] font-bold text-tx tracking-tight leading-tight mb-1.5">
          Crea tu cuenta
        </h1>
        <p className="text-tx-muted text-sm">Empieza gratis, sin tarjeta de crédito.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] font-semibold text-tx-muted uppercase tracking-[0.08em] mb-2">
            Nombre completo
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            placeholder="Tu nombre"
            className="w-full bg-bg-elevated border border-bg-border rounded-md px-4 py-2.5 text-tx placeholder:text-tx-subtle text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-tx-muted uppercase tracking-[0.08em] mb-2">
            Correo electrónico
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="tu@correo.com"
            className="w-full bg-bg-elevated border border-bg-border rounded-md px-4 py-2.5 text-tx placeholder:text-tx-subtle text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-tx-muted uppercase tracking-[0.08em] mb-2">
            Contraseña
          </label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              className="w-full bg-bg-elevated border border-bg-border rounded-md px-4 py-2.5 pr-10 text-tx placeholder:text-tx-subtle text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-tx-subtle hover:text-tx-muted transition-colors"
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {password && (
            <div className={`flex items-center gap-1.5 mt-2 text-xs ${pwStrong ? 'text-success' : 'text-warning'}`}>
              <CheckCircle2 size={11} />
              {pwStrong ? 'Contraseña segura' : 'Mínimo 8 caracteres'}
            </div>
          )}
        </div>

        {error && (
          <div className="text-danger text-sm bg-danger/10 border border-danger/15 rounded-md px-4 py-2.5">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-md py-2.5 font-semibold text-sm transition-colors mt-1"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
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
  )
}
