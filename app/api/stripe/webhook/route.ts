import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db'
import Stripe from 'stripe'

// Stripe may return current_period_start/end or null depending on subscription state
function safeDate(ts: number | null | undefined): Date | null {
  if (!ts || ts === 0) return null
  return new Date(ts * 1000)
}

// In newer Stripe API versions, subscription ID on invoice may be object or string
function getSubId(val: string | Stripe.Subscription | null | undefined): string | null {
  if (!val) return null
  if (typeof val === 'string') return val
  return val.id ?? null
}

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('[Webhook] STRIPE_WEBHOOK_SECRET is not configured')
    return NextResponse.json({ error: 'Webhook no configurado.' }, { status: 500 })
  }

  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err: any) {
    console.error('[Webhook] Signature verification failed:', err.message)
    return NextResponse.json({ error: 'Firma inválida.' }, { status: 400 })
  }

  console.log('[Webhook] Event received:', event.type, event.id)

  try {
    switch (event.type) {

      // ── Checkout completed — most reliable for initial subscription ──
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const subscriptionId = getSubId(session.subscription as any)

        console.log('[Webhook] checkout.session.completed', { userId, subscriptionId })

        if (!userId || !subscriptionId) break

        // Fetch full subscription to get period dates
        const sub = await stripe.subscriptions.retrieve(subscriptionId)

        await prisma.subscription.upsert({
          where: { userId },
          update: {
            plan: 'PREMIUM',
            status: 'ACTIVE',
            stripeCustomerId: (sub.customer as string) ?? null,
            stripeSubscriptionId: sub.id,
            stripePriceId: sub.items.data[0]?.price.id ?? null,
            currentPeriodStart: safeDate((sub as any).current_period_start),
            currentPeriodEnd: safeDate((sub as any).current_period_end),
          },
          create: {
            userId,
            plan: 'PREMIUM',
            status: 'ACTIVE',
            stripeCustomerId: (sub.customer as string) ?? null,
            stripeSubscriptionId: sub.id,
            stripePriceId: sub.items.data[0]?.price.id ?? null,
            currentPeriodStart: safeDate((sub as any).current_period_start),
            currentPeriodEnd: safeDate((sub as any).current_period_end),
          },
        })

        console.log('[Webhook] User upgraded to PREMIUM:', userId)
        break
      }

      // ── Subscription created / updated ───────────────────────────
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.userId

        console.log('[Webhook]', event.type, { userId, status: sub.status })

        if (!userId) break

        const newPlan = sub.status === 'active' || sub.status === 'trialing' ? 'PREMIUM' : 'FREE'

        await prisma.subscription.upsert({
          where: { userId },
          update: {
            plan: newPlan,
            status: mapStatus(sub.status),
            stripeCustomerId: (sub.customer as string) ?? null,
            stripeSubscriptionId: sub.id,
            stripePriceId: sub.items.data[0]?.price.id ?? null,
            currentPeriodStart: safeDate((sub as any).current_period_start),
            currentPeriodEnd: safeDate((sub as any).current_period_end),
          },
          create: {
            userId,
            plan: newPlan,
            status: mapStatus(sub.status),
            stripeCustomerId: (sub.customer as string) ?? null,
            stripeSubscriptionId: sub.id,
            stripePriceId: sub.items.data[0]?.price.id ?? null,
            currentPeriodStart: safeDate((sub as any).current_period_start),
            currentPeriodEnd: safeDate((sub as any).current_period_end),
          },
        })
        break
      }

      // ── Subscription cancelled ───────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.userId

        console.log('[Webhook] subscription.deleted', { userId })
        if (!userId) break

        await prisma.subscription.updateMany({
          where: { userId },
          data: { plan: 'FREE', status: 'CANCELED' },
        })
        break
      }

      // ── Payment succeeded — ensure plan is ACTIVE ────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subId = getSubId((invoice as any).subscription ?? (invoice as any).subscription_id)

        console.log('[Webhook] invoice.payment_succeeded', { subId })
        if (!subId) break

        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subId },
          data: { plan: 'PREMIUM', status: 'ACTIVE' },
        })
        break
      }

      // ── Payment failed ───────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subId = getSubId((invoice as any).subscription ?? (invoice as any).subscription_id)

        console.log('[Webhook] invoice.payment_failed', { subId })
        if (!subId) break

        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subId },
          data: { status: 'PAST_DUE' },
        })
        break
      }

      default:
        console.log('[Webhook] Unhandled event:', event.type)
    }
  } catch (err: any) {
    console.error('[Webhook] Handler error for', event.type, ':', err.message, err.stack)
    return NextResponse.json({ error: 'Internal error: ' + err.message }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

function mapStatus(status: string): 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'INCOMPLETE' {
  const map: Record<string, 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'INCOMPLETE'> = {
    active: 'ACTIVE',
    canceled: 'CANCELED',
    past_due: 'PAST_DUE',
    incomplete: 'INCOMPLETE',
    incomplete_expired: 'CANCELED',
    unpaid: 'PAST_DUE',
    trialing: 'ACTIVE',
    paused: 'INCOMPLETE',
  }
  return map[status] ?? 'INCOMPLETE'
}
