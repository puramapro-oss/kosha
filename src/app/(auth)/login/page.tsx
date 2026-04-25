'use client'

import { useState, useTransition, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { APP_NAME } from '@/lib/constants'

const ERROR_MESSAGES: Record<string, string> = {
  auth_failed: "Connexion impossible. Réessaie ou utilise un autre moyen.",
  invalid_credentials: 'Email ou mot de passe incorrect.',
  email_not_confirmed: "Vérifie ton email pour confirmer ton compte.",
  too_many_requests: 'Trop de tentatives. Réessaie dans quelques minutes.',
  network: "Pas de connexion. Vérifie ton réseau.",
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/dashboard'
  const initialError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(initialError ? (ERROR_MESSAGES[initialError] ?? null) : null)
  const [isPending, startTransition] = useTransition()
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleEmailLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        const supabase = createClient()
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) {
          const code = signInError.message.toLowerCase().includes('invalid')
            ? 'invalid_credentials'
            : signInError.message.toLowerCase().includes('not confirmed')
            ? 'email_not_confirmed'
            : signInError.message.toLowerCase().includes('rate')
            ? 'too_many_requests'
            : 'auth_failed'
          setError(ERROR_MESSAGES[code] ?? signInError.message)
          return
        }
        router.push(next)
        router.refresh()
      } catch {
        setError(ERROR_MESSAGES.network ?? 'Erreur réseau')
      }
    })
  }

  async function handleGoogleLogin() {
    setError(null)
    setGoogleLoading(true)
    try {
      const supabase = createClient()
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, queryParams: { access_type: 'offline', prompt: 'consent' } },
      })
      if (oauthError) {
        setError(ERROR_MESSAGES.auth_failed ?? oauthError.message)
        setGoogleLoading(false)
      }
    } catch {
      setError(ERROR_MESSAGES.network ?? 'Erreur réseau')
      setGoogleLoading(false)
    }
  }

  const submitting = isPending || googleLoading

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="glass rounded-2xl p-8 shadow-2xl shadow-violet-500/10">
        <h1 className="text-3xl font-display font-bold mb-2 gradient-text-kosha">{APP_NAME}</h1>
        <p className="text-white/60 text-sm mb-8">Reconnecte-toi à ton univers.</p>

        {error && (
          <div role="alert" className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-3 mb-4 px-4 py-3 rounded-xl bg-white text-black font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {googleLoading ? 'Connexion…' : 'Continuer avec Google'}
        </button>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-white/40 uppercase tracking-wider">ou</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <label className="block">
            <span className="block text-sm text-white/70 mb-1.5">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={submitting}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.07] transition-colors"
              placeholder="ton@email.com"
            />
          </label>

          <label className="block">
            <span className="block text-sm text-white/70 mb-1.5">Mot de passe</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="current-password"
              disabled={submitting}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.07] transition-colors"
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            disabled={submitting || !email || !password}
            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold hover:from-violet-500 hover:to-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20"
          >
            {isPending ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm">
          <Link href="/forgot-password" className="text-white/50 hover:text-white/80 transition-colors">
            Mot de passe oublié ?
          </Link>
          <Link href="/signup" className="text-violet-400 hover:text-violet-300 transition-colors font-medium">
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-white/40">Chargement…</div>}>
      <LoginForm />
    </Suspense>
  )
}
