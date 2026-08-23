'use client'

import { useState, useTransition, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { APP_NAME } from '@/lib/constants'
import { LegalAcceptanceNotice } from '@/lib/legal'
import { ACCEPTABLE_DOC_TYPES } from '@/lib/legal-config'

const ERROR_MESSAGES: Record<string, string> = {
  user_already_exists: 'Un compte existe déjà avec cet email. Connecte-toi.',
  weak_password: 'Mot de passe trop faible (min. 8 caractères).',
  invalid_email: 'Email invalide.',
  too_many_requests: 'Trop de tentatives. Réessaie dans quelques minutes.',
  signup_failed: "L'inscription a échoué. Réessaie ou contacte-nous.",
  network: "Pas de connexion. Vérifie ton réseau.",
}

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const refCode = searchParams.get('ref') ?? ''

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleEmailSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        const supabase = createClient()
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, ref_code: refCode || undefined },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          },
        })
        if (signUpError) {
          const code = signUpError.message.toLowerCase().includes('already')
            ? 'user_already_exists'
            : signUpError.message.toLowerCase().includes('password')
            ? 'weak_password'
            : signUpError.message.toLowerCase().includes('email')
            ? 'invalid_email'
            : signUpError.message.toLowerCase().includes('rate')
            ? 'too_many_requests'
            : 'signup_failed'
          setError(ERROR_MESSAGES[code] ?? signUpError.message)
          return
        }
        if (data.session) {
          // autoconfirm enabled VPS — go directly ; enregistre la preuve d'acceptation (fire-and-forget)
          Promise.all(
            ACCEPTABLE_DOC_TYPES.map((docType) =>
              fetch('/api/legal/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ docType }),
              })
            )
          ).catch(() => {})
          router.push('/dashboard')
          router.refresh()
        } else {
          setSuccess('Compte créé. Vérifie ton email pour confirmer.')
        }
      } catch {
        setError(ERROR_MESSAGES.network ?? 'Erreur réseau')
      }
    })
  }

  async function handleGoogleSignup() {
    setError(null)
    setGoogleLoading(true)
    try {
      const supabase = createClient()
      const redirectTo = `${window.location.origin}/auth/callback?next=/dashboard`
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, queryParams: { access_type: 'offline', prompt: 'consent' } },
      })
      if (oauthError) {
        setError(ERROR_MESSAGES.signup_failed ?? oauthError.message)
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
        <h1 className="text-3xl font-display font-bold mb-2 gradient-text-kosha">Rejoindre {APP_NAME}</h1>
        <p className="text-white/60 text-sm mb-8">Aucune pub. Aucune toxicité. Juste toi et le monde.</p>

        {refCode && (
          <div className="mb-4 px-4 py-2 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-200 text-sm">
            Tu as été parrainé(e). Tu profites de -50% le premier mois.
          </div>
        )}

        {error && (
          <div role="alert" className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div role="status" className="mb-4 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
            {success}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-3 mb-4 px-4 py-3 rounded-xl bg-white text-black font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {googleLoading ? 'Inscription…' : "S'inscrire avec Google"}
        </button>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-white/40 uppercase tracking-wider">ou</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <form onSubmit={handleEmailSignup} className="space-y-4">
          <label className="block">
            <span className="block text-sm text-white/70 mb-1.5">Prénom</span>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="given-name"
              disabled={submitting}
              maxLength={60}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.07] transition-colors"
              placeholder="Ton prénom"
            />
          </label>

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
              autoComplete="new-password"
              disabled={submitting}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.07] transition-colors"
              placeholder="Au moins 8 caractères"
            />
          </label>

          <LegalAcceptanceNotice actionLabel="Créer mon compte" />

          <button
            type="submit"
            disabled={submitting || !email || !password || !fullName}
            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold hover:from-violet-500 hover:to-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20"
          >
            {isPending ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>

        <p className="mt-6 text-xs text-white/40 leading-relaxed">16 ans minimum (DSA UE).</p>

        <div className="mt-4 text-center text-sm">
          <span className="text-white/50">Déjà un compte ? </span>
          <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors font-medium">
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="text-white/40">Chargement…</div>}>
      <SignupForm />
    </Suspense>
  )
}
