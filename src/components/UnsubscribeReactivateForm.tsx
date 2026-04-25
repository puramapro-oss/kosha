'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function UnsubscribeReactivateForm({
  token,
  initialSubscribed,
}: {
  token: string
  initialSubscribed: boolean
}) {
  const [subscribed, setSubscribed] = useState(initialSubscribed)
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  function flip() {
    setErr(null)
    setDone(false)
    startTransition(async () => {
      try {
        if (subscribed) {
          // Unsubscribe → use the public unsubscribe endpoint with token (no auth)
          const res = await fetch(`/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`, { method: 'POST' })
          if (!res.ok) {
            const data = await res.json().catch(() => ({}))
            setErr(data.reason ?? 'Une erreur est survenue.')
            return
          }
          setSubscribed(false)
          setDone(true)
        } else {
          // Reactivate → besoin d'auth (POST /api/newsletter/subscribe). Sinon on redirige vers login.
          const res = await fetch('/api/newsletter/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscribed: true }),
          })
          if (res.status === 401) {
            // Pas connecté → on l'envoie sur login avec next vers /settings/newsletter
            window.location.href = `/login?next=/settings/newsletter`
            return
          }
          if (!res.ok) {
            const data = await res.json().catch(() => ({}))
            setErr(data.error ?? 'Réabonnement impossible.')
            return
          }
          setSubscribed(true)
          setDone(true)
        }
      } catch {
        setErr('Pas de connexion.')
      }
    })
  }

  return (
    <div className="space-y-3">
      <button
        onClick={flip}
        disabled={isPending}
        className={`w-full px-5 py-3 rounded-xl font-medium text-sm transition-all disabled:opacity-50 ${
          subscribed
            ? 'bg-white/[0.04] border border-white/15 text-white/85 hover:bg-white/[0.08]'
            : 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white hover:opacity-90'
        }`}
      >
        {isPending
          ? 'En cours...'
          : subscribed
          ? 'Me désabonner en 1 clic'
          : 'Me ré-abonner'}
      </button>

      <AnimatePresence>
        {(done || err) && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`text-sm ${err ? 'text-red-300' : 'text-emerald-200'}`}
          >
            {err ?? (subscribed ? 'C\'est bon, tu reçois à nouveau.' : 'C\'est fait. Plus aucun email.')}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
