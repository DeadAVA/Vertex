'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { Home, BookOpen, Sigma, Wrench, CreditCard, User, LogOut, Crown } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard', icon: Home, label: 'Inicio' },
  { href: '/cursos', icon: BookOpen, label: 'Cursos' },
  { href: '/solver', icon: Sigma, label: 'Solver' },
  { href: '/herramientas', icon: Wrench, label: 'Herramientas' },
  { href: '/precios', icon: CreditCard, label: 'Premium' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isPremium = session?.user?.plan === 'PREMIUM'

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-bg-surface border-r border-bg-border flex flex-col z-40">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-bg-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm shadow-glow-sm">VX</div>
          <div>
            <div className="font-semibold text-tx text-sm">Vértice</div>
            <div className="text-tx-subtle text-xs">Academia</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-primary/15 text-primary border border-primary/20'
                  : 'text-tx-muted hover:bg-bg-elevated hover:text-tx'
              )}
            >
              <Icon size={17} />
              {label}
              {href === '/precios' && !isPremium && (
                <span className="ml-auto text-xs bg-warning/15 text-warning px-1.5 py-0.5 rounded-md font-medium">Upgrade</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="border-t border-bg-border p-3 space-y-1">
        {isPremium && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 mb-2">
            <Crown size={14} className="text-primary" />
            <span className="text-xs text-primary font-medium">Plan Premium</span>
          </div>
        )}
        <Link
          href="/perfil"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-tx-muted hover:bg-bg-elevated hover:text-tx transition-all"
        >
          <User size={17} />
          <div className="flex-1 min-w-0">
            <div className="truncate font-medium text-tx text-xs">{session?.user?.name ?? 'Usuario'}</div>
            <div className="truncate text-tx-subtle text-xs">{session?.user?.email}</div>
          </div>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-tx-muted hover:bg-danger/10 hover:text-danger transition-all"
        >
          <LogOut size={17} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
