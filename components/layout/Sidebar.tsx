'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { LayoutDashboard, BookOpen, Sigma, Wrench, Zap, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { href: '/cursos', icon: BookOpen, label: 'Cursos' },
  { href: '/solver', icon: Sigma, label: 'Solver' },
  { href: '/herramientas', icon: Wrench, label: 'Herramientas' },
  { href: '/precios', icon: Zap, label: 'Premium' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isPremium = session?.user?.plan === 'PREMIUM'

  const initials = session?.user?.name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? 'U'

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-56 bg-bg-surface border-r border-bg-border flex flex-col z-40">
      {/* Brand */}
      <div className="h-[58px] px-5 flex items-center border-b border-bg-border shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="font-display font-bold text-tx text-[15px] tracking-tight">Vertex Academic</span>
          <span className="text-[9px] font-mono font-semibold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded uppercase tracking-[0.08em]">
            Beta
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-tx-subtle uppercase tracking-[0.1em] px-3 mb-3">
          Plataforma
        </p>
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 py-2 rounded-md text-[13px] font-medium transition-all border-l-2',
                active
                  ? 'border-l-primary text-tx bg-bg-elevated pl-[10px] pr-3'
                  : 'border-l-transparent text-tx-muted hover:text-tx hover:bg-bg-elevated/50 pl-[10px] pr-3'
              )}
            >
              <Icon size={14} strokeWidth={active ? 2.5 : 1.75} className="shrink-0" />
              <span className="flex-1">{label}</span>
              {href === '/precios' && !isPremium && (
                <span className="text-[9px] bg-primary/15 text-primary px-1.5 py-0.5 rounded font-bold tracking-[0.06em] uppercase">
                  Pro
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="border-t border-bg-border p-2 space-y-1 shrink-0">
        {isPremium && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary/10 mb-1">
            <Zap size={11} className="text-primary fill-primary shrink-0" />
            <span className="text-[11px] text-primary font-semibold tracking-wide">Premium activo</span>
          </div>
        )}

        <Link
          href="/perfil"
          className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-bg-elevated transition-colors group"
        >
          <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
            <span className="text-primary text-[10px] font-bold font-display">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="truncate text-tx text-[12px] font-medium group-hover:text-tx transition-colors">
              {session?.user?.name ?? 'Usuario'}
            </div>
            <div className="truncate text-tx-subtle text-[10px]">{session?.user?.email}</div>
          </div>
        </Link>

        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-tx-subtle hover:text-danger hover:bg-danger/8 transition-all"
        >
          <LogOut size={13} className="shrink-0" />
          <span className="text-[12px]">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}
