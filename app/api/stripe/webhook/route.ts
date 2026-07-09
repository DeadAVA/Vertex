import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.userId

      if (!userId) break

      await prisma.subscription.upsert({
        where: { userId },
        update: {
          plan: sub.status === 'active' ? 'PREMIUM' : 'FREE',
          status: mapStatus(sub.status),
          stripeSubscriptionId: sub.id,
          stripePriceId: sub.items.data[0]?.price.id,
          currentPeriodStart: new Date(sub.current_period_start * 1000),
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
        },
        create: {
          userId,
          plan: sub.status === 'active' ? 'PREMIUM' : 'FREE',
          status: mapStatus(sub.status),
          stripeSubscriptionId: sub.id,
          stripePriceId: sub.items.data[0]?.price.id,
          currentPeriodStart: new Date(sub.current_period_start * 1000),
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
        },
      })
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.userId
      if (!userId) break

      await prisma.subscription.update({
        where: { userId },
        data: { plan: 'FREE', status: 'CANCELED' },
      })
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const subId = invoice.subscription as string
      if (!subId) break

      const dbSub = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: subId },
      })
      if (dbSub) {
        await prisma.subscription.update({
          where: { id: dbSub.id },
          data: { status: 'PAST_DUE' },
        })
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}

function mapStatus(status: string): 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'INCOMPLETE' {
  const map: Record<string, 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'INCOMPLETE'> = {
    active: 'ACTIVE',
    canceled: 'CANCELED',
    past_due: 'PAST_DUE',
    incomplete: 'INCOMPLETE',
    trialing: 'ACTIVE',
  }
  return map[status] ?? 'INCOMPLETE'
}
