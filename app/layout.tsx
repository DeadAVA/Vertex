import type { Metadata } from 'next'
import './globals.css'
import 'katex/dist/katex.min.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: { default: 'Vértice — Plataforma Académica', template: '%s · Vértice' },
  description: 'Aprende matemáticas, física y programación con explicaciones paso a paso y suscripción premium.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="gradient-mesh min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
