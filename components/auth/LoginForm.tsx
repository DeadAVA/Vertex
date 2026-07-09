'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError('Correo o contraseña incorrectos.')
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <h1 className="font-display text-[26px] font-bold text-tx tracking-tight leading-tight mb-1.5">
          Bienvenido de nuevo
        </h1>
        <p className="text-tx-muted text-sm">Inicia sesión en tu cuenta de Vertex Academic.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="••••••••"
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
          {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
        </button>
      </form>

      <p className="text-center text-tx-muted text-sm mt-6">
        ¿No tienes cuenta?{' '}
        <Link href="/register" className="text-primary hover:text-primary-hover font-medium transition-colors">
          Crear cuenta gratis
        </Link>
      </p>
    </div>
  )
}
