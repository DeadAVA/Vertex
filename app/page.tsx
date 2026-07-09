import Link from 'next/link'
import { ArrowRight, Check, BookOpen, Calculator, Trophy, Zap } from 'lucide-react'

const FREE_FEATURES = [
  'Cursos básicos: Álgebra, Aritmética, Geometría, HTML',
  'Calculadoras científica, cuadrática y de porcentajes',
  'Problemas con pistas',
  'Seguimiento de progreso básico',
]

const PREMIUM_FEATURES = [
  'Todo lo del plan gratuito',
  'Mecánica Clásica y Cálculo Diferencial',
  'Motor matemático (derivadas, integrales, límites)',
  'Soluciones ocultas con rúbrica',
  'Progreso detallado por unidad',
  'Nuevos cursos cada mes',
]

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-bg/80 backdrop-blur-md border-b border-bg-border">
        <div className="max-w-6xl mx-auto px-6 h-[58px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-tx text-[15px] tracking-tight">Vertex Academic</span>
            <span className="text-[9px] font-mono font-semibold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded uppercase tracking-[0.08em]">Beta</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-tx-muted hover:text-tx text-sm transition-colors px-3 py-1.5 rounded-md hover:bg-bg-elevated">
              Iniciar sesión
            </Link>
            <Link href="/register" className="text-sm bg-primary hover:bg-primary-hover text-white px-4 py-1.5 rounded-md transition-colors font-semibold">
              Empezar gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-28 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 text-[11px] text-primary bg-primary/10 border border-primary/20 rounded-full px-3 py-1.5 mb-8 font-semibold tracking-wide uppercase">
            <Zap size={11} />
            Plataforma académica
          </div>
          <h1 className="font-display text-5xl md:text-[68px] font-bold text-tx mb-6 leading-[1.05] tracking-tight">
            Aprende paso a paso,<br />
            <span className="text-primary">entiende de verdad.</span>
          </h1>
          <p className="text-tx-muted text-lg max-w-2xl mb-10 leading-relaxed">
            Matemáticas, física y programación con problemas detallados, explicaciones claras y herramientas de práctica. Desde nivel básico hasta avanzado.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-md font-semibold text-sm transition-colors">
              Crear cuenta gratis
              <ArrowRight size={16} />
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-bg-elevated hover:bg-bg-border text-tx px-6 py-3 rounded-md font-semibold text-sm transition-colors border border-bg-border">
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t border-bg-border">
        <div className="max-w-6xl mx-auto">
          <div className="mb-14">
            <h2 className="font-display text-3xl font-bold text-tx tracking-tight mb-3">Todo lo que necesitas para aprender</h2>
            <p className="text-tx-muted max-w-xl">Sin distracciones, sin pasos ocultos. Cada problema resuelto con el "por qué" incluido.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: BookOpen, title: 'Cursos con estructura', desc: 'Álgebra, geometría, física y programación organizados por unidades con contenido explicado y problemas graduales.' },
              { icon: Calculator, title: 'Calculadoras académicas', desc: 'Científica, cuadrática, porcentajes y física rápida. Con resultado y explicación del proceso.' },
              { icon: Trophy, title: 'Seguimiento de progreso', desc: 'Ve exactamente en qué unidades has avanzado, cuáles tienes pendientes y cuál es tu puntaje.' },
            ].map((f) => (
              <div key={f.title} className="bg-bg-surface border border-bg-border rounded-lg p-6 hover:border-primary/25 transition-colors">
                <div className="w-9 h-9 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                  <f.icon size={17} className="text-primary" />
                </div>
                <h3 className="font-display font-semibold text-tx mb-2 text-[15px] tracking-tight">{f.title}</h3>
                <p className="text-tx-muted text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precios" className="py-20 px-6 border-t border-bg-border">
        <div className="max-w-4xl mx-auto">
          <div className="mb-14">
            <h2 className="font-display text-3xl font-bold text-tx tracking-tight mb-3">Planes simples y transparentes</h2>
            <p className="text-tx-muted">Empieza gratis, sube a premium cuando lo necesites.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Free */}
            <div className="bg-bg-surface border border-bg-border rounded-lg p-7 flex flex-col">
              <div className="text-[11px] font-semibold text-tx-muted uppercase tracking-[0.08em] mb-4">Gratuito</div>
              <div className="flex items-end gap-1 mb-1">
                <span className="font-display text-4xl font-bold text-tx tracking-tight">$0</span>
              </div>
              <div className="text-tx-subtle text-xs mb-6">Para siempre</div>
              <ul className="space-y-3 mb-8 flex-1">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-tx-muted">
                    <Check size={13} className="text-success mt-0.5 shrink-0" strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block text-center bg-bg-elevated hover:bg-bg-border text-tx rounded-md py-2.5 font-semibold text-sm transition-colors border border-bg-border">
                Empezar gratis
              </Link>
            </div>

            {/* Premium */}
            <div className="bg-bg-surface border border-bg-border rounded-lg overflow-hidden flex flex-col">
              <div className="h-[3px] bg-primary" />
              <div className="p-7 flex flex-col flex-1">
                <div className="text-[11px] font-semibold text-primary uppercase tracking-[0.08em] mb-4">Premium</div>
                <div className="flex items-end gap-1 mb-1">
                  <span className="font-display text-4xl font-bold text-tx tracking-tight">$149</span>
                  <span className="text-tx-muted text-sm mb-1">MXN</span>
                </div>
                <div className="text-tx-subtle text-xs mb-6">por mes</div>
                <ul className="space-y-3 mb-8 flex-1">
                  {PREMIUM_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-tx-muted">
                      <Check size={13} className="text-primary mt-0.5 shrink-0" strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="block text-center bg-primary hover:bg-primary-hover text-white rounded-md py-2.5 font-semibold text-sm transition-colors">
                  Empezar con Premium
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-bg-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-tx text-sm tracking-tight">Vertex Academic</span>
          </div>
          <p className="text-tx-subtle text-xs">© 2025 Vertex Academic. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
