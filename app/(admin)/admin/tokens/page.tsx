import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin'
import { prisma } from '@/lib/db'
import { Zap } from 'lucide-react'

export const metadata: Metadata = { title: 'Admin — Uso IA' }

function getLast30Days(): string[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return d.toISOString().slice(0, 10)
  })
}

function BarChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-0.5 h-24">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0" title={`${d.label}: ${d.value}`}>
          <div
            className={`w-full ${color} rounded-sm`}
            style={{ height: `${Math.max((d.value / max) * 100, d.value > 0 ? 4 : 0)}%` }}
          />
          {(i === 0 || i === 14 || i === 29) && (
            <span className="text-[7px] text-tx-subtle truncate w-full text-center">{d.label}</span>
          )}
        </div>
      ))}
    </div>
  )
}

export default async function AdminTokensPage() {
  await requireAdmin()

  const last30 = getLast30Days()
  const today = new Date().toISOString().slice(0, 10)
  const last7 = last30.slice(-7)

  const [topUsage, dailyRaw] = await Promise.all([
    prisma.aiUsage.groupBy({
      by: ['userId'],
      where: { date: { in: last30 } },
      _sum: { requests: true },
      orderBy: { _sum: { requests: 'desc' } },
      take: 25,
    }),
    prisma.aiUsage.findMany({
      where: { date: { in: last30 } },
      select: { date: true, requests: true },
    }),
  ])

  const userIds = topUsage.map(u => u.userId)
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true, subscription: { select: { plan: true } } },
  })
  const userMap = new Map(users.map(u => [u.id, u]))

  const topUsers = topUsage.map(u => ({
    id: u.userId,
    name: userMap.get(u.userId)?.name ?? '—',
    email: userMap.get(u.userId)?.email ?? '—',
    plan: userMap.get(u.userId)?.subscription?.plan ?? 'FREE',
    total: u._sum.requests ?? 0,
  }))

  const dayMap = new Map<string, number>()
  dailyRaw.forEach(r => dayMap.set(r.date, (dayMap.get(r.date) ?? 0) + r.requests))

  const chartData = last30.map(d => ({
    label: new Date(d + 'T12:00:00Z').toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }),
    value: dayMap.get(d) ?? 0,
  }))

  const totalToday = dayMap.get(today) ?? 0
  const totalWeek = last7.reduce((s, d) => s + (dayMap.get(d) ?? 0), 0)
  const totalMonth = dailyRaw.reduce((s, r) => s + r.requests, 0)
  const avgDay = last30.length > 0 ? Math.round(totalMonth / 30) : 0

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-[26px] font-bold text-tx tracking-tight">Uso de IA</h1>
        <p className="text-tx-muted text-sm mt-1">Analítica de requests al Solver IA.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Hoy', value: totalToday },
          { label: 'Esta semana', value: totalWeek },
          { label: 'Este mes', value: totalMonth },
          { label: 'Promedio / día', value: avgDay },
        ].map(({ label, value }) => (
          <div key={label} className="bg-bg-surface border border-bg-border rounded-lg p-5">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-tx-muted uppercase tracking-[0.08em] mb-3">
              <Zap size={10} />
              {label}
            </div>
            <div className="font-display text-3xl font-bold text-tx">{value.toLocaleString()}</div>
            <div className="text-tx-subtle text-xs mt-1">requests</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-bg-surface border border-bg-border rounded-lg p-5 mb-6">
        <div className="text-[11px] font-semibold text-tx-muted uppercase tracking-[0.08em] mb-4">Requests por día — últimos 30 días</div>
        <BarChart data={chartData} color="bg-primary/60" />
      </div>

      {/* Top users */}
      <div className="bg-bg-surface border border-bg-border rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 border-b border-bg-border">
          <span className="font-display font-semibold text-tx text-sm tracking-tight">Top usuarios — últimos 30 días</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-border bg-bg-elevated">
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-tx-muted uppercase tracking-[0.08em]">#</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-tx-muted uppercase tracking-[0.08em]">Usuario</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-tx-muted uppercase tracking-[0.08em]">Plan</th>
                <th className="text-right px-5 py-3 text-[10px] font-semibold text-tx-muted uppercase tracking-[0.08em]">Requests</th>
                <th className="text-right px-5 py-3 text-[10px] font-semibold text-tx-muted uppercase tracking-[0.08em]">% del total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bg-border">
              {topUsers.map((u, i) => (
                <tr key={u.id} className="hover:bg-bg-elevated/40 transition-colors">
                  <td className="px-5 py-3 text-tx-subtle text-xs font-mono">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-tx text-sm">{u.name}</div>
                    <div className="text-xs text-tx-muted">{u.email}</div>
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
                  <td className="px-5 py-3 text-right font-mono font-bold text-tx">{u.total.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right text-tx-muted text-xs">
                    {totalMonth > 0 ? Math.round((u.total / totalMonth) * 100) : 0}%
                  </td>
                </tr>
              ))}
              {topUsers.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-tx-muted text-xs">Sin datos en los últimos 30 días.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
