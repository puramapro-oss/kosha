import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 relative">
      {/* Cosmic background — subtil, jamais agressif (BRIEF règle sacrée #4) */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(124,58,237,0.10), transparent 60%), radial-gradient(ellipse 60% 50% at 80% 100%, rgba(6,182,212,0.07), transparent 60%), #0A0A0F',
        }}
      />
      {children}
    </main>
  )
}
