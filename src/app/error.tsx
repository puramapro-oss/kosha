'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[KOSHA error]', error)
  }, [error])

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="glass rounded-2xl p-8 max-w-md text-center">
        <h1 className="text-2xl font-display font-bold mb-3 gradient-text-kosha">Petit détour</h1>
        <p className="text-white/70 text-sm mb-6">
          Quelque chose n&apos;a pas marché. On est sur le coup. Tu peux réessayer ou revenir à l&apos;accueil.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-medium hover:from-violet-500 hover:to-cyan-400 transition-all"
          >
            Réessayer
          </button>
          <Link
            href="/"
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/[0.08] transition-colors"
          >
            Accueil
          </Link>
        </div>
        {error.digest && (
          <p className="mt-6 text-xs text-white/30 font-mono break-all">code: {error.digest}</p>
        )}
      </div>
    </main>
  )
}
