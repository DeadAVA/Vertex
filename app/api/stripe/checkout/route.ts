import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe, getOrCreateStripeCustomer } from '@/lib/stripe'
import { getConfig } from '@/lib/config'

async function getActivePriceId(): Promise<string> {
  const stored = await getConfig('STRIPE_ACTIVE_PRICE_ID')
  return stored ?? process.env.STRIPE_PREMIUM_PRICE_ID!
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })
  }

  if (!session.user.email) {
    return NextResponse.json({ error: 'Se necesita un correo electrónico para procesar el pago.' }, { status: 400 })
  }

  const priceId = await getActivePriceId()
  const customerId = await getOrCreateStripeCustomer(session.user.id, session.user.email)

  const checkout = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?upgraded=1`,
    cancel_url: `${process.env.NEXTAUTH_URL}/precios`,
    metadata: { userId: session.user.id },
    subscription_data: { metadata: { userId: session.user.id } },
  })

  return NextResponse.json({ url: checkout.url })
}
