import type { Metadata } from 'next'
import { ToolsPanel } from '@/components/tools/ToolsPanel'

export const metadata: Metadata = { title: 'Herramientas' }

export default function HerramientasPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-[28px] font-bold text-tx tracking-tight mb-1.5">Herramientas</h1>
        <p className="text-tx-muted text-sm">Calculadoras y utilidades. Resultado inmediato con el proceso explicado.</p>
      </div>
      <ToolsPanel />
    </div>
  )
}
