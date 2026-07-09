import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left: brand panel */}
      <div className="hidden lg:flex flex-col w-[420px] shrink-0 bg-bg-surface border-r border-bg-border relative overflow-hidden">
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, #1e1e28 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            opacity: 0.6,
          }}
        />
        {/* Gradient fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-surface via-transparent to-transparent" />

        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="font-display font-bold text-tx text-lg tracking-tight">Vertex Academic</span>
            <span className="text-[9px] font-mono font-semibold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded uppercase tracking-[0.08em]">
              Beta
            </span>
          </Link>

          {/* Math formulas */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="space-y-8">
              <div className="space-y-4 font-mono text-sm leading-relaxed">
                <div className="text-tx-subtle">
                  <span className="text-primary font-medium">∫</span> f(x) dx = F(b) − F(a)
                </div>
                <div className="text-tx-subtle">
                  <span className="text-primary font-medium">lim</span>
                  <sub className="text-[11px]">x→∞</sub> (1 + 1/x)ˣ = e
                </div>
                <div className="text-tx-subtle">
                  <span className="text-primary font-medium">∑</span>
                  <sub className="text-[11px]">i=1</sub>
                  <sup className="text-[11px]">n</sup> i = n(n+1)/2
                </div>
                <div className="text-tx-subtle">
                  x = (−b ± <span className="text-primary font-medium">√</span>(b²−4ac)) / 2a
                </div>
              </div>

              <div className="w-8 h-px bg-bg-border" />

              <div>
                <h2 className="font-display font-bold text-tx text-[22px] leading-tight mb-3">
                  Aprende matemáticas con claridad.
                </h2>
                <p className="text-tx-muted text-sm leading-relaxed">
                  Cursos estructurados, herramientas de cálculo y resolución paso a paso. Todo en un solo lugar.
                </p>
              </div>
            </div>
          </div>

          <p className="text-tx-subtle text-xs">© 2025 Vertex Academic</p>
        </div>
      </div>

      {/* Right: form area */}
      <div className="flex-1 flex flex-col px-6 py-8">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-auto pb-8">
          <div className="lg:hidden flex items-center gap-2">
            <span className="font-display font-bold text-tx text-[15px] tracking-tight">Vertex Academic</span>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-tx-muted hover:text-tx text-xs font-medium transition-colors ml-auto"
          >
            <ArrowLeft size={13} />
            Volver al inicio
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center">
          {children}
        </div>
      </div>
    </div>
  )
}
