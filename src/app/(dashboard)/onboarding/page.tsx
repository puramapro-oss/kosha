'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { APP_NAME } from '@/lib/constants'

type Q1 = 'aider' | 'gagner' | 'apprendre' | 'rencontrer'
type Q2 = 'argent' | 'impact' | 'communaute' | 'apaisement'
type Q3 = '5min' | '15min' | '30min' | 'flow'

interface Question<T extends string> {
  prompt: string
  helper: string
  options: { value: T; label: string; description: string }[]
}

const Q1_DEF: Question<Q1> = {
  prompt: "Pourquoi tu es là ?",
  helper: "Aucune mauvaise réponse. Juste honnête.",
  options: [
    { value: 'aider', label: 'Aider', description: 'Faire quelque chose pour les autres' },
    { value: 'gagner', label: 'Gagner', description: "De l'argent réel, mesurable" },
    { value: 'apprendre', label: 'Apprendre', description: 'Découvrir, expérimenter' },
    { value: 'rencontrer', label: 'Rencontrer', description: 'Trouver des gens vrais' },
  ],
}

const Q2_DEF: Question<Q2> = {
  prompt: "Ce qui compte le plus pour toi en ce moment ?",
  helper: "On adapte tout à toi.",
  options: [
    { value: 'argent', label: "L'argent", description: 'Concret, palpable' },
    { value: 'impact', label: "L'impact", description: 'Que ça change quelque chose' },
    { value: 'communaute', label: 'La communauté', description: 'Ne plus être seul' },
    { value: 'apaisement', label: "L'apaisement", description: 'Moins de bruit' },
  ],
}

const Q3_DEF: Question<Q3> = {
  prompt: "Combien de temps par jour ?",
  helper: "Tu peux changer plus tard. Aucune pression.",
  options: [
    { value: '5min', label: '5 min', description: 'Le strict minimum, à mon rythme' },
    { value: '15min', label: '15 min', description: 'Un café, une action' },
    { value: '30min', label: '30 min', description: 'Une vraie pause' },
    { value: 'flow', label: 'En flow', description: 'Quand ça vient, sans limite' },
  ],
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [q1, setQ1] = useState<Q1 | null>(null)
  const [q2, setQ2] = useState<Q2 | null>(null)
  const [q3, setQ3] = useState<Q3 | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function next() {
    setError(null)
    if (step === 3 && q1 && q2 && q3) {
      submit()
    } else {
      setStep((step + 1) as 1 | 2 | 3)
    }
  }

  function submit() {
    if (!q1 || !q2 || !q3) return
    startTransition(async () => {
      try {
        const res = await fetch('/api/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ q1_motivation: q1, q2_priorite: q2, q3_disponibilite: q3 }),
        })
        if (!res.ok) {
          const { error: msg } = await res.json().catch(() => ({ error: null }))
          setError(msg ?? 'Impossible de sauvegarder. Réessaie.')
          return
        }
        router.push('/dashboard')
        router.refresh()
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
            'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(124,58,237,0.10), transparent 60%), radial-gradient(ellipse 50% 40% at 80% 100%, rgba(6,182,212,0.07), transparent 60%), #0A0A0F',
        }}
      />

      <div className="w-full max-w-xl">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8" aria-label={`Question ${step} sur 3`}>
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                n === step ? 'w-12 bg-gradient-to-r from-violet-500 to-cyan-400' : n < step ? 'w-8 bg-white/30' : 'w-8 bg-white/10'
              }`}
            />
          ))}
        </div>

        <div className="glass rounded-3xl p-7 md:p-9">
          {step === 1 && (
            <QuestionView
              question={Q1_DEF}
              selected={q1}
              onSelect={(v) => setQ1(v)}
            />
          )}
          {step === 2 && (
            <QuestionView
              question={Q2_DEF}
              selected={q2}
              onSelect={(v) => setQ2(v)}
            />
          )}
          {step === 3 && (
            <QuestionView
              question={Q3_DEF}
              selected={q3}
              onSelect={(v) => setQ3(v)}
            />
          )}

          {error && (
            <div role="alert" className="mt-5 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between mt-7">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((step - 1) as 1 | 2 | 3)}
                disabled={isPending}
                className="text-white/50 hover:text-white/80 text-sm transition-colors"
              >
                ← Retour
              </button>
            ) : (
              <span />
            )}

            <button
              type="button"
              onClick={next}
              disabled={
                isPending ||
                (step === 1 && !q1) ||
                (step === 2 && !q2) ||
                (step === 3 && !q3)
              }
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold hover:from-violet-500 hover:to-cyan-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20"
            >
              {isPending ? 'Bienvenue…' : step === 3 ? "C'est parti" : 'Suivant'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-white/30 mt-5">
          {APP_NAME} — 30 secondes, on n&apos;abuse jamais de ton temps.
        </p>
      </div>
    </main>
  )
}

function QuestionView<T extends string>({
  question,
  selected,
  onSelect,
}: {
  question: Question<T>
  selected: T | null
  onSelect: (v: T) => void
}) {
  return (
    <div>
      <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-2">
        {question.prompt}
      </h2>
      <p className="text-white/55 text-sm mb-6">{question.helper}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup">
        {question.options.map((opt) => {
          const isActive = selected === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onSelect(opt.value)}
              className={`text-left px-4 py-3.5 rounded-xl border transition-all ${
                isActive
                  ? 'bg-gradient-to-br from-violet-500/15 to-cyan-500/10 border-violet-400/50 shadow-lg shadow-violet-500/10'
                  : 'bg-white/[0.025] border-white/8 hover:bg-white/[0.05] hover:border-white/15'
              }`}
            >
              <div className={`text-base font-semibold ${isActive ? 'text-white' : 'text-white/85'}`}>
                {opt.label}
              </div>
              <div className="text-xs text-white/50 mt-0.5">{opt.description}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
