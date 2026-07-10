import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

/** Use in server components/pages — redirects to dashboard if not admin */
export async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/dashboard')
  return session
}

/** Use in API routes — returns null if not admin (caller handles 403) */
export async function getAdminSession() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') return null
  return session
}
