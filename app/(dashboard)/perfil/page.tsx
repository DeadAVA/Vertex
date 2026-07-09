import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Crown, BookOpen, Trophy } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { ManageButton } from '@/components/pricing/ManageButton'

export const metadata: Metadata = { title: 'Perfil' }

export default async function PerfilPage() {
  const session = await getServerSession(authOptions)!
  const isPremium = session!.user.plan === 'PREMIUM'

  const [sub, progressData] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId: session!.user.id } }),
    prisma.progress.findMany({
      where: { userId: session!.user.id },
      include: { course: { select: { title: true, emoji: true } }, unit: { select: { title: true } } },
      orderBy: { lastSeen: 'desc' },
    }),
  ])

  const completedCount = progressData.filter((p) => p.completed && p.unitId).length
  const coursesVisited = new Set(progressData.map((p) => p.courseId)).size

  return (
    <div>
      <h1 className="text-3xl font-bold text-tx mb-8">Mi perfil</h1>

      {/* User card */}
      <div className="bg-bg-surface border border-bg-border rounded-2xl p-7 mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center text-2xl font-bold text-primary">
          {session!.user.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="text-xl font-bold text-tx">{session!.user.name}</div>
          <div className="text-tx-muted text-sm mt-0.5">{session!.user.email}</div>
          <div className="flex items-center gap-2 mt-2">
            {isPremium ? (
              <span className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full font-medium">
                <Crown size={11} /> Premium
              </span>
            ) : (
              <span className="text-xs bg-bg-elevated text-tx-muted border border-bg-border px-2.5 py-1 rounded-full">
                Plan gratuito
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-bg-surface border border-bg-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-tx-muted text-sm mb-2"><BookOpen size={15} />Cursos visitados</div>
          <div className="text-3xl font-bold text-tx">{coursesVisited}</div>
        </div>
        <div className="bg-bg-surface border border-bg-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-tx-muted text-sm mb-2"><Trophy size={15} />Unidades completadas</div>
          <div className="text-3xl font-bold text-tx">{completedCount}</div>
        </div>
      </div>

      {/* Subscription info */}
      {sub && (
        <div className="bg-bg-surface border border-bg-border rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-tx mb-4">Suscripción</h2>
          <div className="space-y-2 text-sm mb-5">
            <div className="flex justify-between"><span className="text-tx-muted">Plan</span><span className="text-tx font-medium">{sub.plan}</span></div>
            <div className="flex justify-between"><span className="text-tx-muted">Estado</span><span className={`font-medium ${sub.status === 'ACTIVE' ? 'text-success' : 'text-warning'}`}>{sub.status}</span></div>
            {sub.currentPeriodEnd && (
              <div className="flex justify-between"><span className="text-tx-muted">Próximo cobro</span><span className="text-tx">{formatDate(sub.currentPeriodEnd)}</span></div>
            )}
          </div>
          {isPremium && <ManageButton />}
        </div>
      )}

      {/* Progress history */}
      {progressData.length > 0 && (
        <div className="bg-bg-surface border border-bg-border rounded-2xl p-6">
          <h2 className="font-semibold text-tx mb-4">Historial de actividad</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {progressData.map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-2.5 border-b border-bg-border last:border-0">
                <span className="text-xl">{p.course.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-tx truncate">{p.course.title}</div>
                  {p.unit && <div className="text-xs text-tx-muted truncate">{p.unit.title}</div>}
                </div>
                {p.completed && (
                  <span className="text-xs bg-success/10 text-success border border-success/20 px-2 py-0.5 rounded-full shrink-0">Completado</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
