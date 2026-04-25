'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CAGNOTTE_TYPE_LABELS, type CagnotteType, formatEur } from '@/lib/cagnottes'

type Step = 1 | 2 | 3 | 4

interface FormState {
  type: CagnotteType | null
  title: string
  description: string
  target_eur: number
  ends_at_days: number | null
  geolocation_label: string
  // Reformulation Aria
  description_aria: string
  title_aria: string
  impact_phrase: string
  use_aria: boolean
}

const INITIAL: FormState = {
  type: null,
  title: '',
  description: '',
  target_eur: 100,
  ends_at_days: 30,
  geolocation_label: '',
  description_aria: '',
  title_aria: '',
  impact_phrase: '',
  use_aria: false,
}

export default function NouvelleCagnottePage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<FormState>(INITIAL)
  const [isPending, startTransition] = useTransition()
  const [reformulating, setReformulating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((s) => ({ ...s, [k]: v }))
  }

  async function reformulate() {
    if (!form.type || form.title.length < 4 || form.description.length < 20) return
    setError(null)
    setReformulating(true)
    try {
      const res = await fetch('/api/aria/reformulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: form.type, title: form.title, description: form.description }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Aria n\'a pas pu reformuler.')
        return
      }
      set('title_aria', data.title || form.title)
      set('description_aria', data.description || form.description)
      set('impact_phrase', data.impact_phrase || '')
      set('use_aria', !data.degraded)
    } catch {
      setError('Pas de connexion à Aria. Garde ton texte original.')
    } finally {
      setReformulating(false)
    }
  }

  function submit() {
    if (!form.type) return
    setError(null)
    const finalTitle = form.use_aria && form.title_aria ? form.title_aria : form.title
    const finalDescription = form.use_aria && form.description_aria ? form.description_aria : form.description
    const ends_at = form.ends_at_days
      ? new Date(Date.now() + form.ends_at_days * 24 * 60 * 60 * 1000).toISOString()
      : null

    startTransition(async () => {
      try {
        const res = await fetch('/api/cagnottes/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: form.type,
            title: finalTitle,
            description: finalDescription,
            target_amount_cents: Math.round(form.target_eur * 100),
            ends_at,
            geolocation_label: form.geolocation_label || null,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? 'Création impossible.')
          return
        }
        router.push(`/cagnottes/${data.id}?created=1`)
      } catch {
        setError('Pas de connexion. Réessaie.')
      }
    })
  }

  return (
    <main className="min-h-screen px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(124,58,237,0.10), transparent 60%), #0A0A0F',
        }}
      />

      <div className="max-w-2xl mx-auto space-y-6">
        <Link href="/cagnottes" className="inline-block text-white/45 hover:text-white/85 text-sm transition-colors">
          ← Cagnottes
        </Link>

        {/* Stepper */}
        <div className="flex items-center justify-between glass rounded-2xl px-4 py-3">
          {([1, 2, 3, 4] as const).map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <span
                className={`w-7 h-7 rounded-full text-xs flex items-center justify-center font-mono transition-colors ${
                  step >= s ? 'bg-gradient-to-br from-violet-600 to-cyan-500 text-white' : 'bg-white/5 text-white/45'
                }`}
              >
                {s}
              </span>
              {s < 4 && <span className={`flex-1 h-px ${step > s ? 'bg-violet-500/40' : 'bg-white/8'}`} />}
            </div>
          ))}
        </div>

        {error && (
          <div role="alert" className="px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.section
              key="step1"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="glass rounded-2xl p-6 space-y-5"
            >
              <header>
                <p className="text-white/40 text-xs uppercase tracking-[0.3em] mb-2">Étape 1 — Intention</p>
                <h2 className="text-2xl font-display font-bold text-white">Quelle est la nature de ta cagnotte ?</h2>
                <p className="text-white/55 text-sm mt-1">Choisis ce qui résonne le plus.</p>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.keys(CAGNOTTE_TYPE_LABELS) as CagnotteType[]).map((t) => {
                  const meta = CAGNOTTE_TYPE_LABELS[t]
                  const selected = form.type === t
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => set('type', t)}
                      className={`text-left p-4 rounded-xl border transition-all ${
                        selected
                          ? 'bg-violet-500/15 border-violet-400/50 shadow-lg shadow-violet-500/10'
                          : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl" aria-hidden>
                          {meta.emoji}
                        </span>
                        <div>
                          <p className="text-sm font-display font-semibold text-white">{meta.label}</p>
                          <p className="text-xs text-white/55 mt-0.5 leading-relaxed">{meta.tagline}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => form.type && setStep(2)}
                  disabled={!form.type}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:from-violet-500 hover:to-cyan-400 text-sm"
                >
                  Continuer →
                </button>
              </div>
            </motion.section>
          )}

          {step === 2 && (
            <motion.section
              key="step2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="glass rounded-2xl p-6 space-y-5"
            >
              <header>
                <p className="text-white/40 text-xs uppercase tracking-[0.3em] mb-2">Étape 2 — Le récit</p>
                <h2 className="text-2xl font-display font-bold text-white">Raconte ce qui doit advenir.</h2>
                <p className="text-white/55 text-sm mt-1">Aria t&apos;aidera à reformuler à l&apos;étape suivante.</p>
              </header>

              <div>
                <label className="block text-xs font-mono text-white/55 mb-1.5">Titre court ({form.title.length}/80)</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value.slice(0, 80))}
                  placeholder="Ex : Vacances pour Léna et sa maman"
                  maxLength={80}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:bg-white/8 focus:border-violet-400/50 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-white/55 mb-1.5">Description ({form.description.length}/2000)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => set('description', e.target.value.slice(0, 2000))}
                  placeholder="Pourquoi cette cagnotte ? À qui sert l'argent ? Soit honnête, simple, concret."
                  rows={6}
                  maxLength={2000}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:bg-white/8 focus:border-violet-400/50 focus:outline-none transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-white/55 mb-1.5">Montant cible (€)</label>
                  <input
                    type="number"
                    min={5}
                    max={1000000}
                    step={1}
                    value={form.target_eur}
                    onChange={(e) => set('target_eur', Math.max(5, Math.min(1000000, Number(e.target.value) || 0)))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:bg-white/8 focus:border-violet-400/50 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-white/55 mb-1.5">Durée (jours)</label>
                  <select
                    value={form.ends_at_days ?? 0}
                    onChange={(e) => set('ends_at_days', Number(e.target.value) || null)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:bg-white/8 focus:border-violet-400/50 focus:outline-none"
                  >
                    <option value={7}>7 jours</option>
                    <option value={15}>15 jours</option>
                    <option value={30}>30 jours</option>
                    <option value={60}>60 jours</option>
                    <option value={90}>90 jours</option>
                    <option value={0}>Sans limite</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-white/55 mb-1.5">Lieu (facultatif)</label>
                <input
                  type="text"
                  value={form.geolocation_label}
                  onChange={(e) => set('geolocation_label', e.target.value.slice(0, 120))}
                  placeholder="Ex : Frasne, Doubs"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:bg-white/8 focus:border-violet-400/50 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-white/55 hover:text-white text-sm transition-colors"
                >
                  ← Retour
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (form.title.length >= 4 && form.description.length >= 20 && form.target_eur >= 5) {
                      setStep(3)
                      reformulate()
                    }
                  }}
                  disabled={form.title.length < 4 || form.description.length < 20 || form.target_eur < 5}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:from-violet-500 hover:to-cyan-400 text-sm"
                >
                  Demander à Aria →
                </button>
              </div>
            </motion.section>
          )}

          {step === 3 && (
            <motion.section
              key="step3"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="glass rounded-2xl p-6 space-y-5"
            >
              <header>
                <p className="text-white/40 text-xs uppercase tracking-[0.3em] mb-2">Étape 3 — Aria</p>
                <h2 className="text-2xl font-display font-bold text-white">Aria a affiné ton récit.</h2>
                <p className="text-white/55 text-sm mt-1">Choisis la version qui te ressemble.</p>
              </header>

              {reformulating ? (
                <div className="py-12 text-center">
                  <div className="inline-block w-8 h-8 rounded-full border-2 border-violet-400/30 border-t-violet-400 animate-spin" />
                  <p className="text-white/55 text-sm mt-4">Aria écoute et reformule…</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <ReformBox
                      label="Ton texte original"
                      title={form.title}
                      description={form.description}
                      selected={!form.use_aria}
                      onSelect={() => set('use_aria', false)}
                    />
                    <ReformBox
                      label="Version Aria"
                      title={form.title_aria || form.title}
                      description={form.description_aria || form.description}
                      selected={form.use_aria}
                      onSelect={() => set('use_aria', true)}
                      disabled={!form.title_aria}
                    />
                  </div>

                  {form.impact_phrase && (
                    <div className="rounded-xl border border-violet-400/20 bg-violet-500/5 p-4">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-violet-300/70 mb-1">Phrase d&apos;impact d&apos;Aria</p>
                      <p className="text-white/85 text-sm italic leading-relaxed">« {form.impact_phrase} »</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-white/55 hover:text-white text-sm transition-colors"
                >
                  ← Modifier
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  disabled={reformulating}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold disabled:opacity-40 transition-all hover:from-violet-500 hover:to-cyan-400 text-sm"
                >
                  Continuer →
                </button>
              </div>
            </motion.section>
          )}

          {step === 4 && (
            <motion.section
              key="step4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="glass rounded-2xl p-6 space-y-5"
            >
              <header>
                <p className="text-white/40 text-xs uppercase tracking-[0.3em] mb-2">Étape 4 — Confirmation</p>
                <h2 className="text-2xl font-display font-bold text-white">Tu déposes une intention dans le monde.</h2>
                <p className="text-white/55 text-sm mt-1">
                  Une fois ouverte, ta cagnotte vit dans ton Fil de Vie pour toujours.
                </p>
              </header>

              <div className="space-y-3">
                <div className="rounded-xl border border-white/10 bg-white/3 p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">Type</p>
                  <p className="text-white text-sm">
                    {form.type ? CAGNOTTE_TYPE_LABELS[form.type].emoji + ' ' + CAGNOTTE_TYPE_LABELS[form.type].label : '—'}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/3 p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">Titre</p>
                  <p className="text-white text-base font-display font-semibold">
                    {form.use_aria ? form.title_aria : form.title}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/3 p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">Description</p>
                  <p className="text-white/85 text-sm leading-relaxed whitespace-pre-wrap">
                    {form.use_aria ? form.description_aria : form.description}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/3 p-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">Cible</p>
                    <p className="text-white font-mono text-base">{formatEur(Math.round(form.target_eur * 100))}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/3 p-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">Durée</p>
                    <p className="text-white text-base">{form.ends_at_days ? `${form.ends_at_days} jours` : 'Sans limite'}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-violet-500/5 border border-violet-400/20 p-4 text-xs text-white/70 leading-relaxed">
                <strong className="text-white/90">Répartition transparente :</strong>{' '}
                70% au projet, 15% redistribué aux contributeurs, 5% au fonds sécurité, 10% au fonds VIDA (5% Asso + 5% redistribution).
                Chaque don est horodaté en blockchain Bitcoin (« argent à mémoire »).
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2 text-white/55 hover:text-white text-sm transition-colors"
                >
                  ← Retour
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={isPending}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold disabled:opacity-40 transition-all hover:from-violet-500 hover:to-cyan-400 text-sm shadow-lg shadow-violet-500/20"
                >
                  {isPending ? 'Création…' : '✦ Ouvrir ma cagnotte'}
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}

function ReformBox({
  label,
  title,
  description,
  selected,
  onSelect,
  disabled,
}: {
  label: string
  title: string
  description: string
  selected: boolean
  onSelect: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`text-left p-4 rounded-xl border transition-all w-full ${
        selected
          ? 'bg-violet-500/15 border-violet-400/50 shadow-lg shadow-violet-500/10'
          : disabled
            ? 'bg-white/3 border-white/5 opacity-50 cursor-not-allowed'
            : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
      }`}
    >
      <p className="text-[10px] uppercase tracking-[0.2em] text-white/45 mb-2">{label}</p>
      <p className="text-white text-sm font-display font-semibold mb-2 line-clamp-2">{title || '—'}</p>
      <p className="text-white/65 text-xs leading-relaxed line-clamp-5">{description || '—'}</p>
    </button>
  )
}
