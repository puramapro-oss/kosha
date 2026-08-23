import { motion } from 'framer-motion'
import type { Dispatch, SetStateAction } from 'react'
import ReformBox from '@/components/ReformBox'
import type { FormState, Step } from './page'

interface StepProps {
  form: FormState
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void
  setStep: Dispatch<SetStateAction<Step>>
}

export function Step2({ form, set, setStep, reformulate }: StepProps & { reformulate: () => void }) {
  return (
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
  )
}

export function Step3({ form, set, setStep, reformulating }: StepProps & { reformulating: boolean }) {
  return (
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
  )
}
