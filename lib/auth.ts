import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const email = credentials.email.toLowerCase()

        const user = await prisma.user.findUnique({
          where: { email },
          include: { subscription: true },
        })

        if (!user || !user.password) return null

        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          plan: user.subscription?.plan ?? 'FREE',
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.plan = (user as any).plan ?? 'FREE'
        token.role = (user as any).role ?? 'STUDENT'
        token.planRefreshedAt = Date.now()
      }

      const stale = !token.planRefreshedAt || (Date.now() - (token.planRefreshedAt as number)) > 300_000
      if (trigger === 'update' || stale) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            include: { subscription: true },
          })
          if (dbUser) {
            token.plan = dbUser.subscription?.plan ?? 'FREE'
            token.role = dbUser.role
            token.planRefreshedAt = Date.now()
          }
        } catch (e) {
          console.error('[JWT refresh]', e)
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.plan = token.plan as string
        session.user.role = token.role as string
      }
      return session
    },
  },
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      plan: string
      role: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    plan: string
    role: string
    planRefreshedAt: number
  }
}
