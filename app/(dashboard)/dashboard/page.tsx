import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { SubscriptionBanner } from '@/components/layout/SubscriptionBanner'
import { BookOpen, Trophy, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { UpgradeToast } from '@/components/layout/UpgradeToast'

export const metadata = { title: 'Inicio' }

export default async function DashboardPage({ searchParams }: { searchParams: { upgraded?: string } }) {
  const session = await getServerSession(authOptions)!

  const [progress, courses] = await Promise.all([
    prisma.progress.findMany({
      where: { userId: session!.user.id },
      include: { course: true, unit: true },
      orderBy: { lastSeen: 'desc' },
      take: 5,
    }),
    prisma.course.findMany({
      where: { isPremium: false },
      orderBy: { order: 'asc' },
      take: 3,
      include: { _count: { select: { units: true } } },
    }),
  ])

  const completedUnits = progress.filter((p) => p.completed && p.unitId).length
  const totalSeen = progress.length
  const recentCourse = progress[0]

  return (
    <div>
      <SubscriptionBanner />
      {searchParams.upgraded === '1' && <UpgradeToast />}

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-[28px] font-bold text-tx tracking-tight leading-tight">
          Hola, {session!.user.name?.split(' ')[0]}.
        </h1>
        <p className="text-tx-muted mt-1 text-sm">Continúa donde lo dejaste.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { icon: BookOpen, label: 'Cursos visitados', value: new Set(progress.map((p) => p.courseId)).size },
          { icon: Trophy, label: 'Unidades completadas', value: completedUnits },
          { icon: Clock, label: 'Actividades recientes', value: totalSeen },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-bg-surface border border-bg-border rounded-lg p-5">
            <div className="flex items-center gap-2 text-tx-muted text-xs mb-3">
              <Icon size={13} />
              <span className="uppercase tracking-[0.06em] font-medium">{label}</span>
            </div>
            <div className="font-display text-3xl font-bold text-tx">{value}</div>
          </div>
        ))}
      </div>

      {/* Continue learning */}
      {recentCourse && (
        <div className="mb-8">
          <h2 className="font-display text-base font-semibold text-tx mb-3 tracking-tight">
            Continuar aprendiendo
          </h2>
          <Link
            href={`/cursos/${recentCourse.course.slug}${recentCourse.unit ? `/${recentCourse.unit.slug}` : ''}`}
            className="flex items-center gap-4 bg-bg-surface border border-bg-border hover:border-primary/30 rounded-lg p-5 transition-colors group"
          >
            <div className="text-3xl">{recentCourse.course.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="font-display font-semibold text-tx group-hover:text-primary transition-colors text-[15px] tracking-tight">
                {recentCourse.course.title}
              </div>
              {recentCourse.unit && (
                <div className="text-tx-muted text-sm mt-0.5">{recentCourse.unit.title}</div>
              )}
            </div>
            <ArrowRight size={16} className="text-tx-subtle group-hover:text-primary transition-colors shrink-0" />
          </Link>
        </div>
      )}

      {/* Courses */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-base font-semibold text-tx tracking-tight">Cursos disponibles</h2>
          <Link href="/cursos" className="text-primary text-xs font-medium hover:text-primary-hover transition-colors">
            Ver todos →
          </Link>
        </div>
        <div className="grid gap-2">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/cursos/${course.slug}`}
              className="flex items-center gap-4 bg-bg-surface border border-bg-border hover:border-primary/25 rounded-lg px-5 py-4 transition-colors group"
            >
              <div className="text-2xl shrink-0">{course.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display font-semibold text-tx group-hover:text-primary transition-colors text-[14px] tracking-tight">
                    {course.title}
                  </span>
                  <span className="text-[10px] bg-bg-elevated text-tx-muted px-2 py-0.5 rounded font-medium uppercase tracking-[0.05em]">
                    {course.area}
                  </span>
                </div>
                <div className="text-tx-muted text-xs mt-0.5">{course._count.units} unidades</div>
              </div>
              <ArrowRight size={15} className="text-tx-subtle group-hover:text-primary transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
