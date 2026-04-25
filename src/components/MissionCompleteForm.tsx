'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

interface MissionCompleteFormProps {
  slug: string
  proofType: 'photo' | 'text' | 'gps' | 'qr' | 'auto_health' | 'none'
  rewardPoints: number
}

interface CompletionResult {
  status: 'pending_review' | 'approved' | 'rejected'
  ai_confidence: number | null
  ai_reason: string | null
  reward_points: number
  new_balance?: number
  error?: string
}

export default function MissionCompleteForm({ slug, proofType, rewardPoints }: MissionCompleteFormProps) {
  const router = useRouter()
  const [proofText, setProofText] = useState('')
  const [proofUrl, setProofUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<CompletionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const requiresText = proofType === 'text'
  const requiresPhotoUrl = proofType === 'photo'

  async function submit() {
    if (submitting) return
    setError(null)
    setResult(null)

    if (requiresText && proofText.trim().length < 5) {
      setError('Décris ton expérience en au moins 5 caractères.')
      return
    }
    if (requiresPhotoUrl && !proofUrl.trim()) {
      setError("Colle l'URL de ta photo (Imgur, Cloudinary, ton drive...). Upload natif arrive en P11.")
      return
    }

    setSubmitting(true)
    try {
      const r = await fetch(`/api/missions/${slug}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proof_text: proofText.trim() || null,
          proof_url: proofUrl.trim() || null,
        }),
      })
      const data = (await r.json()) as CompletionResult & { error?: string }
      if (!r.ok && data.error) {
        setError(data.error)
        return
      }
      setResult(data)
      // Refresh dans 4s pour montrer le nouveau solde
      if (data.status === 'approved') {
        setTimeout(() => router.refresh(), 3500)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur réseau.')
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return <ResultCard result={result} rewardPoints={rewardPoints} />
  }

  return (
    <section className="glass rounded-2xl p-6 space-y-5">
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)' }}
          aria-hidden
        >
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <h2 className="text-lg font-display font-semibold text-white">Soumets ta preuve à Aria</h2>
      </div>

      {requiresPhotoUrl && (
        <div>
          <label className="block text-xs text-white/55 mb-2">URL de ta photo</label>
          <input
            type="url"
            value={proofUrl}
            onChange={(e) => setProofUrl(e.target.value)}
            placeholder="https://i.imgur.com/abc.jpg"
            disabled={submitting}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#7C3AED]/50 transition-colors"
          />
          <p className="text-[11px] text-white/40 mt-1.5">
            Tu peux uploader ta photo sur imgur.com, ou utiliser ton Google Drive (lien public).
          </p>
        </div>
      )}

      <div>
        <label className="block text-xs text-white/55 mb-2">
          {requiresText ? 'Décris ton expérience' : 'Précisions (optionnel)'}
        </label>
        <textarea
          value={proofText}
          onChange={(e) => setProofText(e.target.value)}
          placeholder={requiresText ? 'Raconte-moi ce que tu as fait, ressenti, observé...' : "Ajoute du contexte si tu veux (lieu, ressenti, défi rencontré...)"}
          rows={4}
          disabled={submitting}
          maxLength={1000}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#7C3AED]/50 transition-colors resize-none"
        />
        <p className="text-[11px] text-white/40 mt-1.5">{proofText.length} / 1000 caractères</p>
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-200/90 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={submit}
        disabled={submitting}
        className="w-full px-4 py-3 rounded-xl text-white font-medium text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        style={{
          background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
          boxShadow: submitting ? 'none' : '0 8px 28px -8px rgba(124,58,237,0.55)',
        }}
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Aria valide ta preuve...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Soumettre à Aria
          </>
        )}
      </button>
      <p className="text-[11px] text-white/35 text-center">
        Aria répond en 2-5 secondes. Pas de jugement, juste de la bienveillance lucide.
      </p>
    </section>
  )
}

function ResultCard({ result, rewardPoints }: { result: CompletionResult; rewardPoints: number }) {
  if (result.status === 'approved') {
    return (
      <section
        className="rounded-2xl p-7 text-center space-y-4"
        style={{
          background: 'linear-gradient(180deg, rgba(16,185,129,0.10), rgba(16,185,129,0.04))',
          border: '1px solid rgba(16,185,129,0.30)',
        }}
      >
        <div
          className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 12px 32px -10px rgba(16,185,129,0.55)' }}
        >
          <CheckCircle2 className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold text-white mb-1">Bravo !</h2>
          <p className="text-emerald-200/85 text-sm">+{result.reward_points} Points crédités sur ton solde</p>
        </div>
        {result.ai_reason && (
          <div className="rounded-xl px-4 py-3 bg-white/5 border border-white/10 text-left">
            <p className="text-xs text-white/45 mb-1.5">Aria — confiance {result.ai_confidence}/100</p>
            <p className="text-white/85 text-sm leading-relaxed">{result.ai_reason}</p>
          </div>
        )}
        {result.new_balance !== undefined && (
          <p className="text-white/55 text-sm">
            Nouveau solde : <strong className="text-white">{result.new_balance.toLocaleString('fr-FR')}</strong> Points
          </p>
        )}
      </section>
    )
  }

  if (result.status === 'pending_review') {
    return (
      <section
        className="rounded-2xl p-6 text-center space-y-4"
        style={{
          background: 'linear-gradient(180deg, rgba(245,158,11,0.08), rgba(245,158,11,0.03))',
          border: '1px solid rgba(245,158,11,0.30)',
        }}
      >
        <Sparkles className="w-10 h-10 text-amber-300/70 mx-auto" />
        <h2 className="text-xl font-display font-semibold text-white">En cours de relecture</h2>
        <p className="text-amber-200/75 text-sm">Aria n&apos;est pas certaine, ta preuve part en révision humaine. Tu seras crédité sous 48h max.</p>
        {result.ai_reason && (
          <div className="rounded-xl px-4 py-3 bg-white/5 border border-white/10 text-left">
            <p className="text-xs text-white/45 mb-1.5">Aria — confiance {result.ai_confidence}/100</p>
            <p className="text-white/85 text-sm">{result.ai_reason}</p>
          </div>
        )}
      </section>
    )
  }

  // rejected
  return (
    <section
      className="rounded-2xl p-6 text-center space-y-4"
      style={{
        background: 'linear-gradient(180deg, rgba(239,68,68,0.08), rgba(239,68,68,0.03))',
        border: '1px solid rgba(239,68,68,0.30)',
      }}
    >
      <AlertCircle className="w-10 h-10 text-red-300/70 mx-auto" />
      <h2 className="text-xl font-display font-semibold text-white">Preuve refusée</h2>
      <p className="text-red-200/75 text-sm">
        Aria ne peut pas valider cette soumission cette fois-ci.
      </p>
      {result.ai_reason && (
        <div className="rounded-xl px-4 py-3 bg-white/5 border border-white/10 text-left">
          <p className="text-xs text-white/45 mb-1.5">Aria — confiance {result.ai_confidence}/100</p>
          <p className="text-white/85 text-sm">{result.ai_reason}</p>
        </div>
      )}
      <p className="text-white/45 text-xs">
        Tu peux réessayer avec une preuve plus détaillée. Pas de pénalité, juste {rewardPoints} pts à découvrir.
      </p>
    </section>
  )
}
