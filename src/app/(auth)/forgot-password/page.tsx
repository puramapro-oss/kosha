'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { APP_NAME } from '@/lib/constants'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        const supabase = createClient()
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/settings/security`,
        })
        if (resetError) {
          setError("Impossible d'envoyer l'email. Vérifie l'adresse.")
          return
        }
        setSent(true)
      } catch {
        setError('Erreur réseau. Réessaie.')
      }
    })
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="glass rounded-2xl p-8 shadow-2xl shadow-violet-500/10">
        <h1 className="text-2xl font-display font-bold mb-2 gradient-text-kosha">Mot de passe oublié</h1>
        <p className="text-white/60 text-sm mb-6">
          Entre ton email, tu recevras un lien pour le redéfinir.
        </p>

        {error && (
          <div role="alert" className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        {sent ? (
          <div role="status" className="px-4 py-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-sm">
            Email envoyé. Vérifie ta boîte (et tes spams).
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="block text-sm text-white/70 mb-1.5">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={isPending}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 transition-colors"
                placeholder="ton@email.com"
              />
            </label>
            <button
              type="submit"
              disabled={isPending || !email}
              className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold hover:from-violet-500 hover:to-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20"
            >
              {isPending ? 'Envoi…' : 'Recevoir le lien'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm">
          <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors">
            ← Retour à la connexion
          </Link>
        </div>

        <p className="mt-4 text-center text-xs text-white/30">{APP_NAME}</p>
      </div>
    </div>
  )
}
