import type { Metadata } from 'next'
import { ToolsPanel } from '@/components/tools/ToolsPanel'

export const metadata: Metadata = { title: 'Herramientas' }

export default function HerramientasPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-tx mb-2">Herramientas</h1>
      <p className="text-tx-muted mb-8">Calculadoras y utilidades para tus clases. Resultado inmediato con el proceso explicado.</p>
      <ToolsPanel />
    </div>
  )
}
