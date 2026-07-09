import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Lock, ArrowRight } from 'lucide-react'

export const metadata = { title: 'Cursos' }

export default async function CursosPage() {
  const session = await getServerSession(authOptions)
  const isPremium = session?.user?.plan === 'PREMIUM'

  const courses = await prisma.course.findMany({
    orderBy: { order: 'asc' },
    include: { _count: { select: { units: true } } },
  })

  const areas = Array.from(new Set(courses.map((c) => c.area)))

  return (
    <div>
      <h1 className="text-3xl font-bold text-tx mb-2">Cursos</h1>
      <p className="text-tx-muted mb-8">Elige un curso y avanza unidad por unidad.</p>

      {areas.map((area) => (
        <div key={area} className="mb-10">
          <h2 className="text-lg font-semibold text-tx mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-primary rounded-full inline-block" />
            {area}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {courses.filter((c) => c.area === area).map((course) => {
              const locked = course.isPremium && !isPremium
              return (
                <Link
                  key={course.id}
                  href={locked ? '/precios' : `/cursos/${course.slug}`}
                  className={`relative flex items-start gap-4 bg-bg-surface border rounded-lg p-6 transition-all group ${
                    locked ? 'border-bg-border opacity-70 cursor-pointer' : 'border-bg-border hover:border-primary/30'
                  }`}
                >
                  {locked && (
                    <div className="absolute top-4 right-4">
                      <Lock size={15} className="text-tx-subtle" />
                    </div>
                  )}
                  <div className="text-3xl mt-0.5">{course.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-tx group-hover:text-primary transition-colors">{course.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        course.isPremium ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-success/10 text-success border border-success/20'
                      }`}>
                        {course.isPremium ? 'Premium' : 'Gratis'}
                      </span>
                    </div>
                    <p className="text-tx-muted text-sm mt-1.5 leading-relaxed line-clamp-2">{course.description}</p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-tx-subtle">
                      <span>{course._count.units} unidades</span>
                      <span>·</span>
                      <span>{course.level}</span>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-tx-subtle group-hover:text-primary transition-colors shrink-0 mt-1" />
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
