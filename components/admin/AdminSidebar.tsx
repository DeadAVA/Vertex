'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Zap, CreditCard, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/admin', icon: LayoutDashboard, label: 'Panel' },
  { href: '/admin/usuarios', icon: Users, label: 'Usuarios' },
  { href: '/admin/tokens', icon: Zap, label: 'Uso IA' },
  { href: '/admin/planes', icon: CreditCard, label: 'Planes & Precios' },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-56 bg-bg-surface border-r border-bg-border flex flex-col z-40">
      {/* Brand */}
      <div className="h-[58px] px-5 flex items-center gap-3 border-b border-bg-border shrink-0">
        <div className="flex-1 min-w-0">
          <div className="font-display font-bold text-tx text-[14px] tracking-tight leading-none">Vertex Academic</div>
          <div className="text-[9px] font-semibold text-warning bg-warning/10 border border-warning/20 px-1.5 py-0.5 rounded uppercase tracking-[0.08em] inline-block mt-1">
            Admin
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-tx-subtle uppercase tracking-[0.1em] px-3 mb-3">
          Administración
        </p>
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/admin' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 py-2 rounded-md text-[13px] font-medium transition-all border-l-2',
                active
                  ? 'border-l-warning text-tx bg-bg-elevated pl-[10px] pr-3'
                  : 'border-l-transparent text-tx-muted hover:text-tx hover:bg-bg-elevated/50 pl-[10px] pr-3'
              )}
            >
              <Icon size={14} strokeWidth={active ? 2.5 : 1.75} className="shrink-0" />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Back to platform */}
      <div className="border-t border-bg-border p-2 shrink-0">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-tx-muted hover:text-tx hover:bg-bg-elevated transition-colors text-[13px] font-medium"
        >
          <ArrowLeft size={14} className="shrink-0" />
          Volver a la plataforma
        </Link>
      </div>
    </aside>
  )
}
