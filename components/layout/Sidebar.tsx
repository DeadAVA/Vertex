'use client'

import type { Session } from 'next-auth'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Sigma,
  Wrench,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { href: '/cursos', icon: BookOpen, label: 'Cursos' },
  { href: '/docs', icon: FileText, label: 'Docs' },
  { href: '/solver', icon: Sigma, label: 'Solver' },
  { href: '/herramientas', icon: Wrench, label: 'Herramientas' },
  { href: '/precios', icon: Zap, label: 'Premium' },
]

type Props = {
  initialSession: Session
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ initialSession, collapsed, onToggle }: Props) {
  const pathname = usePathname()
  const { data: clientSession } = useSession()
  const session = clientSession ?? initialSession
  const isPremium = session.user.plan === 'PREMIUM'
  const isAdmin = session.user.role === 'ADMIN'
  const initials = session.user.name
    ?.split(' ')
    .filter(Boolean)
    .map((name) => name[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || session.user.email?.[0]?.toUpperCase() || 'U'

  return (
    <aside className={cn('fixed inset-y-0 left-0 z-40 flex flex-col border-r border-bg-border bg-bg-surface transition-[width] duration-200 ease-out', collapsed ? 'w-16' : 'w-56')}>
      <div className={cn('flex h-[58px] shrink-0 items-center border-b border-bg-border', collapsed ? 'justify-center px-2' : 'justify-between px-4')}>
        <Link href="/dashboard" title="Vertex Academic" className="flex min-w-0 items-center gap-2.5">
          {collapsed ? (
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-primary/25 bg-primary/10 font-display text-sm font-bold text-primary">V</span>
          ) : (
            <>
              <span className="truncate font-display text-[15px] font-bold tracking-tight text-tx">Vertex Academic</span>
              <span className="rounded border border-primary/20 bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-primary">Beta</span>
            </>
          )}
        </Link>
        {!collapsed && <button onClick={onToggle} title="Contraer menú" aria-label="Contraer menú lateral" className="ml-2 rounded-md p-1.5 text-tx-muted hover:bg-bg-elevated hover:text-tx"><ChevronLeft size={15} /></button>}
      </div>

      {collapsed && (
        <button onClick={onToggle} title="Desplegar menú" aria-label="Desplegar menú lateral" className="absolute -right-3 top-[70px] grid h-6 w-6 place-items-center rounded-full border border-bg-border bg-bg-surface text-tx-muted shadow-md hover:border-primary/40 hover:text-primary">
          <ChevronRight size={13} />
        </button>
      )}

      <nav className={cn('flex-1 space-y-0.5 overflow-y-auto py-4', collapsed ? 'px-2' : 'px-2')}>
        {!collapsed && <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-tx-subtle">Plataforma</p>}
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              aria-label={label}
              className={cn(
                'flex h-10 items-center rounded-md border-l-2 text-[13px] font-medium transition-all',
                collapsed ? 'justify-center px-0' : 'gap-2.5 pl-[10px] pr-3',
                active ? 'border-l-primary bg-bg-elevated text-tx' : 'border-l-transparent text-tx-muted hover:bg-bg-elevated/50 hover:text-tx'
              )}
            >
              <Icon size={collapsed ? 17 : 14} strokeWidth={active ? 2.5 : 1.75} className="shrink-0" />
              {!collapsed && <span className="flex-1">{label}</span>}
              {!collapsed && href === '/precios' && !isPremium && <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.06em] text-primary">Pro</span>}
              {collapsed && href === '/precios' && !isPremium && <span className="absolute ml-5 mt-[-18px] h-1.5 w-1.5 rounded-full bg-primary" />}
            </Link>
          )
        })}
      </nav>

      <div className="shrink-0 space-y-1 border-t border-bg-border p-2">
        {isPremium && (
          <div title="Premium activo" className={cn('flex items-center rounded-md bg-primary/10 text-primary', collapsed ? 'justify-center px-2 py-2.5' : 'gap-2 px-3 py-2')}>
            <Zap size={12} className="shrink-0 fill-primary" />
            {!collapsed && <span className="text-[11px] font-semibold tracking-wide">Premium activo</span>}
          </div>
        )}

        <Link href="/perfil" title={collapsed ? (session.user.name || session.user.email || 'Perfil') : undefined} className={cn('group flex items-center rounded-md hover:bg-bg-elevated', collapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-2')}>
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-primary/30 bg-primary/20">
            <span className="font-display text-[10px] font-bold text-primary">{initials}</span>
          </div>
          {!collapsed && <div className="min-w-0 flex-1"><div className="truncate text-[12px] font-medium text-tx">{session.user.name || 'Sin nombre'}</div><div className="truncate text-[10px] text-tx-subtle">{session.user.email}</div></div>}
        </Link>

        {isAdmin && (
          <Link href="/admin" title={collapsed ? 'Panel Admin' : undefined} className={cn('flex items-center rounded-md text-warning/80 transition-colors hover:bg-warning/8 hover:text-warning', collapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2')}>
            <ShieldCheck size={14} />{!collapsed && <span className="text-[12px] font-semibold">Panel Admin</span>}
          </Link>
        )}
        <button onClick={() => signOut({ callbackUrl: '/' })} title={collapsed ? 'Cerrar sesión' : undefined} className={cn('flex w-full items-center rounded-md text-tx-subtle transition-all hover:bg-danger/8 hover:text-danger', collapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2')}>
          <LogOut size={14} />{!collapsed && <span className="text-[12px]">Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  )
}
