import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import DocsWorkspace from '@/components/docs/DocsWorkspace'

export const dynamic = 'force-dynamic'

export default async function DocsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const documents = await prisma.document.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
  })

  return <DocsWorkspace initialDocuments={documents.map((document) => ({
    ...document,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  }))} />
}
