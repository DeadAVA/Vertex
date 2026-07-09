import type { Metadata } from 'next'
import './globals.css'
import 'katex/dist/katex.min.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: { default: 'Vertex Academic', template: '%s · Vertex Academic' },
  description: 'Aprende matemáticas, física y programación con explicaciones paso a paso. Cursos estructurados, herramientas de cálculo y resolución de problemas.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
