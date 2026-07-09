import type { Metadata } from 'next'
import { AISolverForm } from '@/components/solver/AISolverForm'
import { MathSolverForm } from '@/components/solver/MathSolverForm'

export const metadata: Metadata = { title: 'Solver' }

export default function SolverPage() {
  return (
    <div>
      {/* AI Solver — main feature */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-tx">Solver IA</h1>
          <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-medium">Powered by Claude</span>
        </div>
        <p className="text-tx-muted mb-6">
          Escribe cualquier problema matemático, físico o de palabra — o sube una foto de tu tarea, examen o pizarrón.
        </p>
        <AISolverForm />
      </div>

      {/* Math engine — secondary */}
      <div className="border-t border-bg-border pt-10">
        <h2 className="text-xl font-bold text-tx mb-1">Motor simbólico</h2>
        <p className="text-tx-muted text-sm mb-6">Derivadas, integrales, límites, factorización y graficación de funciones.</p>
        <MathSolverForm />
      </div>
    </div>
  )
}
