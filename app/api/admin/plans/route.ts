import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin'
import { getConfig } from '@/lib/config'
import { prisma } from '@/lib/db'
import { stripe } from '@/lib/stripe'

async function getActivePriceId(): Promise<string> {
  const stored = await getConfig('STRIPE_ACTIVE_PRICE_ID')
  return stored ?? process.env.STRIPE_PREMIUM_PRICE_ID!
}

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const activePriceId = await getActivePriceId()

  const activePrice = await stripe.prices.retrieve(activePriceId, { expand: ['product'] })
  const product = activePrice.product as any
  const productId: string = typeof product === 'string' ? product : product.id
  const productName: string = typeof product === 'object' ? (product.name ?? 'Premium') : 'Premium'

  const { data: prices } = await stripe.prices.list({ product: productId, limit: 100 })

  const premiumCount = await prisma.subscription.count({ where: { plan: 'PREMIUM', status: 'ACTIVE' } })

  return NextResponse.json({
    productId,
    productName,
    activePriceId,
    premiumCount,
    prices: prices
      .sort((a, b) => b.created - a.created)
      .map(p => ({
        id: p.id,
        amount: p.unit_amount != null ? p.unit_amount / 100 : 0,
        currency: p.currency.toUpperCase(),
        interval: p.recurring?.interval ?? 'month',
        intervalCount: p.recurring?.interval_count ?? 1,
        nickname: p.nickname ?? null,
        active: p.active,
        created: p.created * 1000,
        isCurrentActive: p.id === activePriceId,
      })),
  })
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  const { productId, amount, currency = 'mxn', interval = 'month', nickname } = body

  if (!productId || !amount || amount <= 0) {
    return NextResponse.json({ error: 'productId y amount son requeridos.' }, { status: 400 })
  }

  const price = await stripe.prices.create({
    product: productId,
    unit_amount: Math.round(amount * 100),
    currency: currency.toLowerCase(),
    recurring: { interval },
    nickname: nickname || undefined,
  })

  return NextResponse.json({
    id: price.id,
    amount: price.unit_amount! / 100,
    currency: price.currency.toUpperCase(),
    interval: price.recurring?.interval,
    nickname: price.nickname,
    active: price.active,
    created: price.created * 1000,
    isCurrentActive: false,
  })
}
