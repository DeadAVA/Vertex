import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/db'

const schema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().email().transform(e => e.toLowerCase()),
  password: z.string().min(8),
})

// Simple IP-based rate limit: 5 registrations per minute
const registerRateMap = new Map<string, { count: number; resetAt: number }>()
function checkIpRate(ip: string): boolean {
  const now = Date.now()
  const entry = registerRateMap.get(ip)
  if (!entry || now > entry.resetAt) {
    registerRateMap.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= 5) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown'
  if (!checkIpRate(ip)) {
    return NextResponse.json({ error: 'Demasiados intentos. Espera 1 minuto.' }, { status: 429 })
  }

  try {
    const body = await req.json()
    const { name, email, password } = schema.parse(body)

    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) {
      return NextResponse.json({ error: 'El correo ya está registrado.' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        subscription: { create: { plan: 'FREE' } },
      },
      select: { id: true, name: true, email: true },
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}
