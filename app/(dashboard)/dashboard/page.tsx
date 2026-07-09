import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { SubscriptionBanner } from '@/components/layout/SubscriptionBanner'
import { BookOpen, Trophy, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export const metadata = { title: 'Inicio' }

export default async function DashboardPage() {
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

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-tx">Hola, {session!.user.name?.split(' ')[0]} 👋</h1>
        <p className="text-tx-muted mt-1">Continúa donde lo dejaste.</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: BookOpen, label: 'Cursos visitados', value: new Set(progress.map((p) => p.courseId)).size },
          { icon: Trophy, label: 'Unidades completadas', value: completedUnits },
          { icon: Clock, label: 'Actividades recientes', value: totalSeen },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-bg-surface border border-bg-border rounded-2xl p-5">
            <div className="flex items-center gap-2 text-tx-muted text-sm mb-2">
              <Icon size={15} />
              {label}
            </div>
            <div className="text-3xl font-bold text-tx">{value}</div>
          </div>
        ))}
      </div>

      {recentCourse && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-tx mb-4">Continuar aprendiendo</h2>
          <Link
            href={`/cursos/${recentCourse.course.slug}${recentCourse.unit ? `/${recentCourse.unit.slug}` : ''}`}
            className="flex items-center gap-4 bg-bg-surface border border-bg-border hover:border-primary/30 rounded-2xl p-5 transition-colors group"
          >
            <div className="text-3xl">{recentCourse.course.emoji}</div>
            <div className="flex-1">
              <div className="font-semibold text-tx group-hover:text-primary transition-colors">{recentCourse.course.title}</div>
              {recentCourse.unit && <div className="text-tx-muted text-sm mt-0.5">{recentCourse.unit.title}</div>}
            </div>
            <ArrowRight size={18} className="text-tx-subtle group-hover:text-primary transition-colors" />
          </Link>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-tx">Cursos disponibles</h2>
          <Link href="/cursos" className="text-primary text-sm hover:text-primary-hover transition-colors">Ver todos</Link>
        </div>
        <div className="grid gap-4">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/cursos/${course.slug}`}
              className="flex items-center gap-4 bg-bg-surface border border-bg-border hover:border-primary/30 rounded-2xl p-5 transition-colors group"
            >
              <div className="text-3xl">{course.emoji}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-tx group-hover:text-primary transition-colors">{course.title}</span>
                  <span className="text-xs bg-bg-elevated text-tx-muted px-2 py-0.5 rounded-full">{course.area}</span>
                </div>
                <div className="text-tx-muted text-sm mt-0.5">{course._count.units} unidades</div>
              </div>
              <ArrowRight size={18} className="text-tx-subtle group-hover:text-primary transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
