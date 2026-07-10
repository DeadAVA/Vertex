'use client'
import { useEffect, useState, useCallback } from 'react'
import { Search, Crown, Shield, ShieldOff, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import type { Metadata } from 'next'

type UserRow = {
  id: string
  name: string | null
  email: string | null
  role: 'STUDENT' | 'ADMIN'
  plan: 'FREE' | 'PREMIUM'
  subStatus: string | null
  aiToday: number
  lastSeen: string | null
  createdAt: string
}

type Result = { users: UserRow[]; total: number; pages: number; page: number }

const PLAN_OPTS = ['ALL', 'FREE', 'PREMIUM'] as const

export default function AdminUsuariosPage() {
  const [data, setData] = useState<Result | null>(null)
  const [q, setQ] = useState('')
  const [plan, setPlan] = useState<typeof PLAN_OPTS[number]>('ALL')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)

  const load = useCallback(async (qVal: string, planVal: string, pageVal: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ q: qVal, plan: planVal, page: String(pageVal) })
      const res = await fetch(`/api/admin/users?${params}`)
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => { load(q, plan, 1); setPage(1) }, 300)
    return () => clearTimeout(t)
  }, [q, plan, load])

  useEffect(() => { load(q, plan, page) }, [page])

  async function updateUser(id: string, body: object) {
    setUpdating(id)
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) await load(q, plan, page)
      else {
        const d = await res.json()
        alert(d.error ?? 'Error al actualizar.')
      }
    } finally {
      setUpdating(null)
    }
  }

  function confirmRole(user: UserRow) {
    const action = user.role === 'ADMIN' ? 'quitar admin de' : 'hacer admin a'
    if (!confirm(`¿Seguro que quieres ${action} ${user.name ?? user.email}?`)) return
    updateUser(user.id, { role: user.role === 'ADMIN' ? 'STUDENT' : 'ADMIN' })
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-[26px] font-bold text-tx tracking-tight">Usuarios</h1>
        <p className="text-tx-muted text-sm mt-1">{data?.total ?? '…'} usuarios registrados</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-tx-subtle" />
          <input
            type="text"
            placeholder="Buscar por nombre o email…"
            value={q}
            onChange={e => setQ(e.target.value)}
            className="w-full bg-bg-elevated border border-bg-border rounded-md pl-8 pr-4 py-2 text-sm text-tx placeholder:text-tx-subtle focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        <div className="flex gap-1.5">
          {PLAN_OPTS.map(p => (
            <button
              key={p}
              onClick={() => setPlan(p)}
              className={`px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
                plan === p ? 'bg-primary text-white' : 'bg-bg-elevated border border-bg-border text-tx-muted hover:text-tx'
              }`}
            >
              {p === 'ALL' ? 'Todos' : p}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-bg-surface border border-bg-border rounded-lg overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-border bg-bg-elevated">
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-tx-muted uppercase tracking-[0.08em]">Usuario</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-tx-muted uppercase tracking-[0.08em]">Plan</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-tx-muted uppercase tracking-[0.08em]">Rol</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-tx-muted uppercase tracking-[0.08em]">IA hoy</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-tx-muted uppercase tracking-[0.08em]">Registrado</th>
                <th className="text-right px-4 py-3 text-[10px] font-semibold text-tx-muted uppercase tracking-[0.08em]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bg-border">
              {loading && !data && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-tx-muted text-xs">Cargando…</td></tr>
              )}
              {data?.users.map(u => (
                <tr key={u.id} className="hover:bg-bg-elevated/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-bg-elevated border border-bg-border flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-tx-muted font-display">
                          {u.name?.charAt(0).toUpperCase() ?? '?'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-tx truncate max-w-[160px]">{u.name ?? '—'}</div>
                        <div className="text-xs text-tx-muted truncate max-w-[160px]">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      u.plan === 'PREMIUM'
                        ? 'bg-primary/15 text-primary'
                        : 'bg-bg-elevated text-tx-subtle border border-bg-border'
                    }`}>
                      {u.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      u.role === 'ADMIN'
                        ? 'bg-warning/15 text-warning'
                        : 'bg-bg-elevated text-tx-subtle border border-bg-border'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-tx-muted text-xs font-mono">{u.aiToday}</td>
                  <td className="px-4 py-3 text-tx-muted text-xs">
                    {new Date(u.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      {updating === u.id
                        ? <Loader2 size={14} className="animate-spin text-tx-muted" />
                        : <>
                          {/* Change plan */}
                          {u.plan === 'FREE' ? (
                            <button
                              onClick={() => updateUser(u.id, { plan: 'PREMIUM' })}
                              className="flex items-center gap-1 text-[11px] bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-2.5 py-1 rounded font-semibold transition-colors"
                            >
                              <Crown size={10} /> Premium
                            </button>
                          ) : (
                            <button
                              onClick={() => updateUser(u.id, { plan: 'FREE' })}
                              className="text-[11px] bg-bg-elevated hover:bg-bg-border text-tx-muted border border-bg-border px-2.5 py-1 rounded font-semibold transition-colors"
                            >
                              Bajar a Free
                            </button>
                          )}
                          {/* Change role */}
                          <button
                            onClick={() => confirmRole(u)}
                            className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded font-semibold transition-colors border ${
                              u.role === 'ADMIN'
                                ? 'bg-warning/10 hover:bg-warning/20 text-warning border-warning/20'
                                : 'bg-bg-elevated hover:bg-bg-border text-tx-subtle border-bg-border'
                            }`}
                          >
                            {u.role === 'ADMIN'
                              ? <><ShieldOff size={10} /> Quitar Admin</>
                              : <><Shield size={10} /> Admin</>
                            }
                          </button>
                        </>
                      }
                    </div>
                  </td>
                </tr>
              ))}
              {data?.users.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-tx-muted text-xs">Sin resultados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-tx-muted text-xs">
            Página {page} de {data.pages} · {data.total} usuarios
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-bg-elevated border border-bg-border text-tx-muted hover:text-tx disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={12} /> Anterior
            </button>
            <button
              onClick={() => setPage(p => Math.min(data.pages, p + 1))}
              disabled={page === data.pages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-bg-elevated border border-bg-border text-tx-muted hover:text-tx disabled:opacity-40 transition-colors"
            >
              Siguiente <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
