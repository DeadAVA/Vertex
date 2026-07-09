import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import * as math from 'mathjs'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })

  const { expression, variable = 'x', xMin = -10, xMax = 10 } = await req.json()
  if (!expression) return NextResponse.json({ error: 'Falta expresión.' }, { status: 400 })

  const points: { x: number; y: number }[] = []
  const steps = 300

  for (let i = 0; i <= steps; i++) {
    const x = xMin + ((xMax - xMin) * i) / steps
    try {
      const y = math.evaluate(expression, { [variable]: x }) as number
      if (isFinite(y) && !isNaN(y) && Math.abs(y) < 1e6) {
        points.push({ x: Math.round(x * 1e4) / 1e4, y: Math.round(y * 1e4) / 1e4 })
      } else {
        points.push({ x: Math.round(x * 1e4) / 1e4, y: NaN })
      }
    } catch {
      points.push({ x: Math.round(x * 1e4) / 1e4, y: NaN })
    }
  }

  return NextResponse.json({ points, xMin, xMax })
}
