import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="flex items-center gap-2.5 mb-10 group">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-bold shadow-glow-sm group-hover:shadow-glow transition-shadow">VX</div>
        <span className="font-semibold text-tx text-lg">Vértice</span>
      </Link>
      {children}
    </div>
  )
}
