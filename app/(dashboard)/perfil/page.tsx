import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatDate } from '@/lib/utils'
import { Crown, BookOpen, Trophy, Zap, Calendar, CreditCard, BarChart2, CheckCircle2, Star } from 'lucide-react'
import { UsageBar } from '@/components/perfil/UsageBar'
import { BillingSection } from '@/components/perfil/BillingSection'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Mi Perfil' }

const DAILY_LIMIT = { FREE: 10, PREMIUM: 100 }

export default async function PerfilPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth/login')

  const plan = (session.user.plan ?? 'FREE') as 'FREE' | 'PREMIUM'
  const isPremium = plan === 'PREMIUM'
  const today = new Date().toISOString().slice(0, 10)

  const [sub, progressData, usageRecord] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId: session.user.id } }),
    prisma.progress.findMany({
      where: { userId: session.user.id },
      include: {
        course: { select: { title: true, emoji: true } },
        unit: { select: { title: true } },
      },
      orderBy: { lastSeen: 'desc' },
      take: 20,
    }),
    prisma.aiUsage.findUnique({
      where: { userId_date: { userId: session.user.id, date: today } },
    }),
  ])

  const completedCount = progressData.filter(p => p.completed && p.unitId).length
  const coursesVisited = new Set(progressData.map(p => p.courseId)).size
  const aiUsed = usageRecord?.requests ?? 0
  const aiLimit = DAILY_LIMIT[plan]

  // Days since joined
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { createdAt: true } })
  const daysSince = user ? Math.floor((Date.now() - user.createdAt.getTime()) / 86400000) : 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-tx">Mi perfil</h1>
        {!isPremium && (
          <a href="/precios" className="flex items-center gap-1.5 text-xs bg-primary/10 hover:bg-primary/15 text-primary border border-primary/25 px-3 py-1.5 rounded-lg font-medium transition-colors">
            <Crown size={12} /> Upgrade a Premium
          </a>
        )}
      </div>

      {/* ── User card ──────────────────────────────────────────── */}
      <div className="bg-bg-surface border border-bg-border rounded-lg p-7">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/25 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
            {session.user.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl font-bold text-tx">{session.user.name}</span>
              {isPremium ? (
                <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/25 px-2.5 py-0.5 rounded-full font-semibold">
                  <Crown size={10} /> Premium
                </span>
              ) : (
                <span className="text-xs bg-bg-elevated text-tx-subtle border border-bg-border px-2.5 py-0.5 rounded-full">
                  Gratuito
                </span>
              )}
            </div>
            <div className="text-tx-muted text-sm mt-0.5">{session.user.email}</div>
            <div className="flex items-center gap-1 mt-1.5 text-xs text-tx-subtle">
              <Calendar size={11} />
              Miembro desde {user ? formatDate(user.createdAt) : '—'} · {daysSince} días
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: BookOpen, label: 'Cursos visitados', value: coursesVisited, color: 'text-primary' },
          { icon: Trophy, label: 'Unidades completadas', value: completedCount, color: 'text-success' },
          { icon: Zap, label: 'Consultas IA hoy', value: aiUsed, color: 'text-warning' },
          { icon: BarChart2, label: 'Días activo', value: daysSince, color: 'text-purple-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-bg-surface border border-bg-border rounded-md p-4">
            <div className={`flex items-center gap-1.5 text-xs text-tx-muted mb-2`}>
              <Icon size={12} className={color} />{label}
            </div>
            <div className="text-2xl font-bold text-tx">{value}</div>
          </div>
        ))}
      </div>

      {/* ── AI Solver Usage ────────────────────────────────────── */}
      <div className="bg-bg-surface border border-bg-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-tx flex items-center gap-2">
            <Zap size={16} className="text-warning" /> Solver IA — uso diario
          </h2>
          <span className="text-xs text-tx-subtle">Restablece a medianoche UTC</span>
        </div>
        <UsageBar used={aiUsed} limit={aiLimit} plan={plan} />
        {!isPremium && (
          <div className="mt-4 p-3 bg-primary/5 border border-primary/15 rounded-md flex items-center gap-3">
            <Star size={14} className="text-primary shrink-0" />
            <span className="text-xs text-tx-muted">
              <span className="text-tx font-medium">Premium:</span> 100 consultas/día, acceso a modelos más potentes
            </span>
            <a href="/precios" className="ml-auto text-xs text-primary hover:underline shrink-0">Ver planes</a>
          </div>
        )}
      </div>

      {/* ── Plan & Billing ─────────────────────────────────────── */}
      <BillingSection
        plan={plan}
        sub={sub ? {
          status: sub.status,
          stripePriceId: sub.stripePriceId,
          currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
          stripeCustomerId: sub.stripeCustomerId ?? null,
        } : null}
      />

      {/* ── Plan comparison ────────────────────────────────────── */}
      {!isPremium && (
        <div className="bg-bg-surface border border-bg-border rounded-lg p-6">
          <h2 className="font-semibold text-tx mb-4 flex items-center gap-2">
            <Crown size={16} className="text-primary" /> Planes
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Free */}
            <div className="border border-bg-border rounded-md p-5 space-y-3">
              <div className="font-semibold text-tx">Gratuito</div>
              <div className="text-2xl font-bold text-tx">$0 <span className="text-sm font-normal text-tx-muted">/mes</span></div>
              <ul className="space-y-2">
                {['10 consultas IA/día', 'Motor simbólico completo', 'Gráficas interactivas', 'Cursos básicos'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-tx-muted">
                    <CheckCircle2 size={14} className="text-success shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <div className="text-xs text-tx-subtle border border-bg-border rounded-lg px-3 py-2 bg-bg-elevated">Plan actual</div>
            </div>
            {/* Premium */}
            <div className="border border-primary/30 rounded-md p-5 space-y-3 bg-primary/3 relative overflow-hidden">
              <div className="absolute top-3 right-3">
                <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full font-semibold">Recomendado</span>
              </div>
              <div className="font-semibold text-primary flex items-center gap-1.5"><Crown size={14} /> Premium</div>
              <div className="text-2xl font-bold text-tx">$149 <span className="text-sm font-normal text-tx-muted">/mes MXN</span></div>
              <ul className="space-y-2">
                {['100 consultas IA/día', 'Sin límites en motor simbólico', 'Cursos avanzados', 'Soporte prioritario', 'Nuevas funciones primero'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-tx-muted">
                    <CheckCircle2 size={14} className="text-primary shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <a href="/precios" className="block w-full text-center bg-primary hover:bg-primary-hover text-white rounded-md py-2.5 font-semibold text-sm transition-colors">
                Mejorar plan
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── Activity history ───────────────────────────────────── */}
      {progressData.length > 0 && (
        <div className="bg-bg-surface border border-bg-border rounded-lg p-6">
          <h2 className="font-semibold text-tx mb-4 flex items-center gap-2">
            <BarChart2 size={16} className="text-tx-muted" /> Actividad reciente
          </h2>
          <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
            {progressData.map(p => (
              <div key={p.id} className="flex items-center gap-3 py-2.5 border-b border-bg-border last:border-0">
                <span className="text-xl shrink-0">{p.course.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-tx truncate">{p.course.title}</div>
                  {p.unit && <div className="text-xs text-tx-muted truncate">{p.unit.title}</div>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {p.completed && (
                    <span className="text-xs bg-success/10 text-success border border-success/20 px-2 py-0.5 rounded-full">
                      Completado
                    </span>
                  )}
                  <span className="text-xs text-tx-subtle hidden sm:block">
                    {new Date(p.lastSeen).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
