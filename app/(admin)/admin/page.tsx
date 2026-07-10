import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin'
import { prisma } from '@/lib/db'
import { Users, Zap, Crown, BookOpen } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Admin — Panel' }

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
}

function getLast14Days(): string[] {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    return d.toISOString().slice(0, 10)
  })
}

function BarChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-1 h-20">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-end gap-1.5 min-w-0">
          <div
            className={`w-full ${color} rounded-sm`}
            style={{ height: `${Math.max((d.value / max) * 100, d.value > 0 ? 5 : 0)}%` }}
            title={`${d.label}: ${d.value}`}
          />
          {(i === 0 || i === data.length - 1 || i === Math.floor(data.length / 2)) && (
            <span className="text-[8px] text-tx-subtle w-full text-center truncate">{d.label}</span>
          )}
        </div>
      ))}
    </div>
  )
}

export default async function AdminOverviewPage() {
  await requireAdmin()

  const today = new Date().toISOString().slice(0, 10)
  const last7 = getLast7Days()
  const last14 = getLast14Days()
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

  const [
    totalUsers,
    premiumCount,
    todayAI,
    weekAI,
    aiByDay,
    newUsersRaw,
    recentUsers,
    totalAttempts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.count({ where: { plan: 'PREMIUM', status: 'ACTIVE' } }),
    prisma.aiUsage.aggregate({ where: { date: today }, _sum: { requests: true } }),
    prisma.aiUsage.aggregate({ where: { date: { in: last7 } }, _sum: { requests: true } }),
    prisma.aiUsage.findMany({ where: { date: { in: last7 } }, select: { date: true, requests: true } }),
    prisma.user.findMany({ where: { createdAt: { gte: twoWeeksAgo } }, select: { createdAt: true } }),
    prisma.user.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { subscription: { select: { plan: true } } },
    }),
    prisma.problemAttempt.count(),
  ])

  const aiMap = new Map<string, number>()
  aiByDay.forEach(r => aiMap.set(r.date, (aiMap.get(r.date) ?? 0) + r.requests))
  const aiChart = last7.map(d => ({
    label: new Date(d + 'T12:00:00Z').toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }),
    value: aiMap.get(d) ?? 0,
  }))

  const userMap = new Map<string, number>()
  newUsersRaw.forEach(u => {
    const k = u.createdAt.toISOString().slice(0, 10)
    userMap.set(k, (userMap.get(k) ?? 0) + 1)
  })
  const userChart = last14.map(d => ({
    label: new Date(d + 'T12:00:00Z').toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }),
    value: userMap.get(d) ?? 0,
  }))

  const conversion = totalUsers > 0 ? Math.round((premiumCount / totalUsers) * 100) : 0

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-[26px] font-bold text-tx tracking-tight">Panel de Administración</h1>
        <p className="text-tx-muted text-sm mt-1">Vista general de Vertex Academic.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { icon: Users, label: 'Total usuarios', value: totalUsers.toLocaleString(), sub: `${totalUsers - premiumCount} gratuitos` },
          { icon: Crown, label: 'Premium activos', value: premiumCount.toLocaleString(), sub: `${conversion}% conversión` },
          { icon: Zap, label: 'Uso IA hoy', value: (todayAI._sum.requests ?? 0).toLocaleString(), sub: 'requests' },
          { icon: BookOpen, label: 'Intentos totales', value: totalAttempts.toLocaleString(), sub: 'ejercicios resueltos' },
        ].map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className="bg-bg-surface border border-bg-border rounded-lg p-5">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-tx-muted uppercase tracking-[0.08em] mb-3">
              <Icon size={11} />
              {label}
            </div>
            <div className="font-display text-3xl font-bold text-tx">{value}</div>
            <div className="text-tx-subtle text-xs mt-1">{sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-bg-surface border border-bg-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-tx-muted uppercase tracking-[0.08em]">Uso IA — últimos 7 días</span>
            <span className="text-tx font-display font-bold text-sm">{(weekAI._sum.requests ?? 0).toLocaleString()}</span>
          </div>
          <div className="text-tx-subtle text-xs mb-4">requests totales esta semana</div>
          <BarChart data={aiChart} color="bg-primary/70" />
        </div>
        <div className="bg-bg-surface border border-bg-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-tx-muted uppercase tracking-[0.08em]">Nuevos usuarios — 14 días</span>
            <span className="text-tx font-display font-bold text-sm">{newUsersRaw.length}</span>
          </div>
          <div className="text-tx-subtle text-xs mb-4">registros en las últimas 2 semanas</div>
          <BarChart data={userChart} color="bg-success/70" />
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { href: '/admin/usuarios', label: 'Gestionar usuarios', desc: 'Cambiar planes y roles' },
          { href: '/admin/tokens', label: 'Analítica de IA', desc: 'Uso por usuario y día' },
          { href: '/admin/planes', label: 'Planes & Precios', desc: 'Crear y activar precios en Stripe' },
        ].map(({ href, label, desc }) => (
          <Link key={href} href={href} className="bg-bg-surface border border-bg-border hover:border-warning/30 rounded-lg p-4 transition-colors group">
            <div className="font-display font-semibold text-tx text-sm tracking-tight group-hover:text-warning transition-colors">{label}</div>
            <div className="text-tx-muted text-xs mt-1">{desc}</div>
          </Link>
        ))}
      </div>

      {/* Recent users table */}
      <div className="bg-bg-surface border border-bg-border rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 border-b border-bg-border flex items-center justify-between">
          <span className="font-display font-semibold text-tx text-sm tracking-tight">Últimos registros</span>
          <Link href="/admin/usuarios" className="text-xs text-tx-muted hover:text-tx transition-colors">Ver todos →</Link>
        </div>
        <div className="divide-y divide-bg-border">
          {recentUsers.map(u => (
            <div key={u.id} className="px-5 py-3 flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-bg-elevated border border-bg-border flex items-center justify-center shrink-0">
                <span className="text-tx-muted text-[10px] font-bold font-display">
                  {u.name?.charAt(0).toUpperCase() ?? '?'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-tx font-medium truncate">{u.name}</div>
                <div className="text-xs text-tx-muted truncate">{u.email}</div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                u.subscription?.plan === 'PREMIUM'
                  ? 'bg-primary/15 text-primary'
                  : 'bg-bg-elevated text-tx-subtle border border-bg-border'
              }`}>
                {u.subscription?.plan ?? 'FREE'}
              </span>
              <span className="text-tx-subtle text-xs shrink-0">
                {new Date(u.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
