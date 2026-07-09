import Link from 'next/link'
import { ArrowRight, CheckCircle2, Zap, BookOpen, Calculator, Trophy } from 'lucide-react'

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
      <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-bg-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm shadow-glow-sm">VX</div>
            <span className="font-semibold text-tx">Vértice</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-tx-muted hover:text-tx text-sm transition-colors px-4 py-2 rounded-lg hover:bg-bg-elevated">
              Iniciar sesión
            </Link>
            <Link href="/register" className="text-sm bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-glow-sm">
              Empezar gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-36 pb-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-accent/5 blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 text-xs text-primary bg-primary/10 border border-primary/20 rounded-full px-3 py-1.5 mb-6 font-medium">
            <Zap size={12} />
            Plataforma académica con suscripción
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-tx mb-6 leading-tight tracking-tight">
            Aprende paso a paso,<br />
            <span className="text-gradient">entiende de verdad.</span>
          </h1>
          <p className="text-tx-muted text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Matemáticas, física y programación con problemas detallados, explicaciones claras y herramientas de práctica.
            Desde nivel básico hasta avanzado.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-8 py-4 rounded-xl font-semibold text-base transition-all shadow-glow hover:shadow-glow-lg">
              Crear cuenta gratis
              <ArrowRight size={18} />
            </Link>
            <Link href="/login" className="flex items-center justify-center gap-2 bg-bg-elevated hover:bg-bg-border text-tx px-8 py-4 rounded-xl font-semibold text-base transition-colors border border-bg-border">
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-tx mb-4">Todo lo que necesitas para aprender</h2>
          <p className="text-tx-muted text-center mb-14 max-w-xl mx-auto">Sin distracciones, sin pasos ocultos. Cada problema resuelto con el "por qué" incluido.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: BookOpen, title: 'Cursos con estructura', desc: 'Álgebra, geometría, física y programación organizados por unidades con contenido explicado y problemas graduales.' },
              { icon: Calculator, title: 'Calculadoras académicas', desc: 'Científica, cuadrática, porcentajes, conversores y física rápida. Con resultado y explicación del proceso.' },
              { icon: Trophy, title: 'Seguimiento de progreso', desc: 'Ve exactamente en qué unidades has avanzado, cuáles tienes pendientes y cuál es tu puntaje.' },
            ].map((f) => (
              <div key={f.title} className="bg-bg-surface border border-bg-border rounded-2xl p-6 hover:border-primary/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                  <f.icon size={20} className="text-primary" />
                </div>
                <h3 className="font-semibold text-tx mb-2">{f.title}</h3>
                <p className="text-tx-muted text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precios" className="py-20 px-6 bg-bg-surface">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-tx mb-4">Planes simples y transparentes</h2>
          <p className="text-tx-muted text-center mb-14">Empieza gratis, sube a premium cuando lo necesites.</p>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Free */}
            <div className="bg-bg-elevated border border-bg-border rounded-2xl p-8">
              <div className="text-sm font-medium text-tx-muted mb-2">Gratuito</div>
              <div className="text-4xl font-bold text-tx mb-1">$0</div>
              <div className="text-tx-muted text-sm mb-6">Para siempre</div>
              <ul className="space-y-3 mb-8">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-tx-muted">
                    <CheckCircle2 size={16} className="text-success mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block text-center bg-bg-border hover:bg-bg-border/80 text-tx rounded-xl py-3 font-medium transition-colors">
                Empezar gratis
              </Link>
            </div>

            {/* Premium */}
            <div className="bg-bg-elevated border border-primary/40 rounded-2xl p-8 relative overflow-hidden border-glow">
              <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg">PREMIUM</div>
              <div className="text-sm font-medium text-primary mb-2">Premium</div>
              <div className="text-4xl font-bold text-tx mb-1">$149</div>
              <div className="text-tx-muted text-sm mb-6">por mes (MXN)</div>
              <ul className="space-y-3 mb-8">
                {PREMIUM_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-tx-muted">
                    <CheckCircle2 size={16} className="text-primary mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block text-center bg-primary hover:bg-primary-hover text-white rounded-xl py-3 font-medium transition-colors shadow-glow-sm">
                Empezar con Premium
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-bg-border text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">VX</div>
          <span className="text-tx-muted text-sm">Vértice Académico</span>
        </div>
        <p className="text-tx-subtle text-xs">© 2025 Vértice. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}
