'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function PremiereActionPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function trigger() {
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/actions/premiere', { method: 'POST' })
        if (!res.ok) {
          const { error: msg } = await res.json().catch(() => ({ error: null }))
          setError(msg ?? 'Impossible. Réessaie.')
          return
        }
        setDone(true)
        // Redirige après 2.5s pour laisser voir l'animation
        setTimeout(() => {
          router.push('/dashboard')
          router.refresh()
        }, 2500)
      } catch {
        setError("Pas de connexion. Vérifie ton réseau.")
      }
    })
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 relative">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 30%, rgba(124,58,237,0.12), transparent 60%), radial-gradient(ellipse 50% 40% at 80% 80%, rgba(6,182,212,0.08), transparent 60%), #0A0A0F',
        }}
      />

      <div className="w-full max-w-md">
        {!done ? (
          <div className="glass rounded-3xl p-8 text-center">
            <p className="text-white/40 text-xs uppercase tracking-[0.3em] mb-3">Action de 30 secondes</p>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-white mb-4">
              Pose un choix conscient.
            </h1>
            <p className="text-white/65 text-sm leading-relaxed mb-6">
              Une seule chose. Tu cliques en bas. Cette action va devenir le point d&apos;origine de ton Fil de Vie.
              Pas de formulaire. Pas d&apos;effort. Juste une intention.
            </p>

            {error && (
              <div role="alert" className="mb-4 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={trigger}
              disabled={isPending}
              className="w-full px-5 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold hover:from-violet-500 hover:to-cyan-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20 glow-violet"
            >
              {isPending ? 'En train…' : "Je fais ce choix"}
            </button>

            <Link
              href="/dashboard"
              className="block mt-4 text-white/40 hover:text-white/70 text-xs transition-colors"
            >
              Plus tard
            </Link>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="glass rounded-3xl p-10 text-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 220, damping: 14 }}
              className="text-6xl mb-4"
              aria-hidden
            >
              ✦
            </motion.div>
            <h1 className="text-2xl font-display font-bold gradient-text-kosha mb-2">
              Premier point d&apos;origine
            </h1>
            <p className="text-white/65 text-sm leading-relaxed">
              C&apos;est gravé dans ton Fil de Vie. Personne ne pourra l&apos;effacer.
            </p>
            <p className="text-white/35 text-xs mt-6">Retour au dashboard…</p>
          </motion.div>
        )}
      </div>
    </main>
  )
}
