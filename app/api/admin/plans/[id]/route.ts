import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin'
import { getConfig, setConfig } from '@/lib/config'
import { stripe } from '@/lib/stripe'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { action } = await req.json()
  const priceId = params.id

  if (action === 'activate') {
    const price = await stripe.prices.retrieve(priceId)
    if (!price.active) {
      return NextResponse.json({ error: 'Este precio está archivado en Stripe.' }, { status: 400 })
    }
    await setConfig('STRIPE_ACTIVE_PRICE_ID', priceId)
    return NextResponse.json({ ok: true, activePriceId: priceId })
  }

  if (action === 'archive') {
    const current = await getConfig('STRIPE_ACTIVE_PRICE_ID') ?? process.env.STRIPE_PREMIUM_PRICE_ID
    if (priceId === current) {
      return NextResponse.json({ error: 'No puedes archivar el precio activo. Activa otro primero.' }, { status: 400 })
    }
    await stripe.prices.update(priceId, { active: false })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Acción inválida.' }, { status: 400 })
}
