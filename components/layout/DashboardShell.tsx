'use client'

import type { Session } from 'next-auth'
import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { cn } from '@/lib/utils'

const SIDEBAR_KEY = 'vertex-sidebar-collapsed'

export function DashboardShell({ session, children }: { session: Session; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(SIDEBAR_KEY) === 'true')
  }, [])

  function toggleSidebar() {
    setCollapsed((current) => {
      const next = !current
      window.localStorage.setItem(SIDEBAR_KEY, String(next))
      return next
    })
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar initialSession={session} collapsed={collapsed} onToggle={toggleSidebar} />
      <main className={cn('w-full flex-1 p-8 transition-[margin] duration-200 ease-out', collapsed ? 'ml-16' : 'ml-56')}>
        {children}
      </main>
    </div>
  )
}
