import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })
  }

  const sub = await prisma.subscription.findUnique({ where: { userId: session.user.id } })

  if (!sub?.stripeCustomerId) {
    return NextResponse.json({ error: 'No tienes una suscripción activa.' }, { status: 400 })
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${process.env.NEXTAUTH_URL}/perfil`,
  })

  return NextResponse.json({ url: portal.url })
}
