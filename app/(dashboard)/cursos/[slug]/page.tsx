import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Lock, CheckCircle2, ArrowRight, ChevronLeft } from 'lucide-react'

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props) {
  const course = await prisma.course.findUnique({ where: { slug: params.slug } })
  return { title: course?.title ?? 'Curso' }
}

export default async function CoursePage({ params }: Props) {
  const session = await getServerSession(authOptions)
  const isPremium = session?.user?.plan === 'PREMIUM'

  const [course, progress] = await Promise.all([
    prisma.course.findUnique({
      where: { slug: params.slug },
      include: {
        units: {
          orderBy: { order: 'asc' },
          include: { _count: { select: { problems: true } } },
        },
      },
    }),
    prisma.progress.findMany({
      where: { userId: session!.user.id, course: { slug: params.slug } },
    }),
  ])

  if (!course) notFound()
  if (course.isPremium && !isPremium) redirect('/precios')

  const completedUnitIds = new Set(progress.filter((p) => p.completed && p.unitId).map((p) => p.unitId))
  const completedCount = completedUnitIds.size

  return (
    <div>
      <Link href="/cursos" className="inline-flex items-center gap-1.5 text-tx-muted hover:text-tx text-sm mb-6 transition-colors">
        <ChevronLeft size={16} />
        Todos los cursos
      </Link>

      {/* Header */}
      <div className="bg-bg-surface border border-bg-border rounded-2xl p-8 mb-6">
        <div className="flex items-start gap-5">
          <div className="text-5xl">{course.emoji}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h1 className="text-2xl font-bold text-tx">{course.title}</h1>
              <span className="text-xs bg-bg-elevated text-tx-muted px-2 py-1 rounded-full">{course.area}</span>
              <span className="text-xs bg-bg-elevated text-tx-muted px-2 py-1 rounded-full">{course.level}</span>
            </div>
            <p className="text-tx-muted leading-relaxed mb-4">{course.description}</p>
            <div className="flex items-center gap-4">
              <div className="text-sm text-tx-muted">
                <span className="text-tx font-semibold">{completedCount}</span> / {course.units.length} unidades completadas
              </div>
              <div className="flex-1 max-w-xs bg-bg-elevated rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all"
                  style={{ width: `${course.units.length > 0 ? (completedCount / course.units.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Units */}
      <h2 className="text-lg font-semibold text-tx mb-4">Unidades</h2>
      <div className="space-y-3">
        {course.units.map((unit, i) => {
          const locked = unit.isPremium && !isPremium
          const done = completedUnitIds.has(unit.id)

          return (
            <Link
              key={unit.id}
              href={locked ? '/precios' : `/cursos/${course.slug}/${unit.slug}`}
              className={`flex items-center gap-4 bg-bg-surface border rounded-xl p-5 transition-all group ${
                locked ? 'border-bg-border opacity-60' : done ? 'border-success/20 hover:border-success/40' : 'border-bg-border hover:border-primary/30'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                done ? 'bg-success/15 text-success' : 'bg-bg-elevated text-tx-muted'
              }`}>
                {done ? <CheckCircle2 size={16} /> : i + 1}
              </div>
              <div className="flex-1">
                <div className="font-medium text-tx group-hover:text-primary transition-colors">{unit.title}</div>
                <div className="text-tx-subtle text-xs mt-0.5">{unit._count.problems} problemas</div>
              </div>
              {locked ? <Lock size={16} className="text-tx-subtle" /> : <ArrowRight size={16} className="text-tx-subtle group-hover:text-primary transition-colors" />}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
