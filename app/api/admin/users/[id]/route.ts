import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin'
import { prisma } from '@/lib/db'
import { stripe } from '@/lib/stripe'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  const { id } = params

  // Prevent admin from changing their own role
  if (body.role && id === session.user.id) {
    return NextResponse.json({ error: 'No puedes modificar tu propio rol.' }, { status: 400 })
  }

  if (body.role) {
    if (!['STUDENT', 'ADMIN'].includes(body.role)) {
      return NextResponse.json({ error: 'Rol inválido.' }, { status: 400 })
    }
    await prisma.user.update({ where: { id }, data: { role: body.role } })
    return NextResponse.json({ ok: true })
  }

  if (body.plan) {
    if (!['FREE', 'PREMIUM'].includes(body.plan)) {
      return NextResponse.json({ error: 'Plan inválido.' }, { status: 400 })
    }

    // If downgrading to FREE, cancel any active Stripe subscription
    if (body.plan === 'FREE') {
      const sub = await prisma.subscription.findUnique({ where: { userId: id } })
      if (sub?.stripeSubscriptionId) {
        try {
          await stripe.subscriptions.cancel(sub.stripeSubscriptionId)
        } catch (e: any) {
          // If already cancelled in Stripe that's fine
          if (!e.message?.includes('No such subscription')) throw e
        }
      }
    }

    await prisma.subscription.upsert({
      where: { userId: id },
      update: { plan: body.plan, status: body.plan === 'PREMIUM' ? 'ACTIVE' : 'CANCELED' },
      create: { userId: id, plan: body.plan, status: body.plan === 'PREMIUM' ? 'ACTIVE' : 'ACTIVE' },
    })

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Nada que actualizar.' }, { status: 400 })
}
