import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { UnitContent } from '@/components/courses/UnitContent'

interface Props { params: { slug: string; unit: string } }

export async function generateMetadata({ params }: Props) {
  const unit = await prisma.courseUnit.findFirst({ where: { slug: params.unit, course: { slug: params.slug } } })
  return { title: unit?.title ?? 'Unidad' }
}

export default async function UnitPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  const isPremium = session?.user?.plan === 'PREMIUM'

  const unit = await prisma.courseUnit.findFirst({
    where: { slug: params.unit, course: { slug: params.slug } },
    include: {
      course: true,
      problems: { orderBy: { isPremium: 'asc' } },
    },
  })

  if (!unit) notFound()
  if (unit.isPremium && !isPremium) redirect('/precios')

  return (
    <div>
      <Link href={`/cursos/${params.slug}`} className="inline-flex items-center gap-1.5 text-tx-muted hover:text-tx text-sm mb-6 transition-colors">
        <ChevronLeft size={16} />
        {unit.course.title}
      </Link>

      <UnitContent unit={unit as any} courseSlug={params.slug} userId={session!.user.id} isPremium={isPremium} />
    </div>
  )
}
