'use client'

import { useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import type { SilenceConfig } from '@/lib/silence'

const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

export default function SilenceClient({ initial }: { initial: SilenceConfig }) {
  const [enabled, setEnabled] = useState(initial.enabled)
  const [startHour, setStartHour] = useState<number>(initial.start_hour ?? 22)
  const [endHour, setEndHour] = useState<number>(initial.end_hour ?? 7)
  const [days, setDays] = useState<number[]>(initial.days_of_week)
  const [pausedUntil, setPausedUntil] = useState<string | null>(initial.paused_until)
  const [isPending, startTransition] = useTransition()
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  function toggleDay(d: number) {
    setDays((arr) => (arr.includes(d) ? arr.filter((x) => x !== d) : [...arr, d].sort()))
  }

  function pauseFor(hours: number) {
    const until = new Date(Date.now() + hours * 3_600_000).toISOString()
    setPausedUntil(until)
  }

  function clearPause() {
    setPausedUntil(null)
  }

  function save() {
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/silence/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            enabled,
            start_hour: startHour,
            end_hour: endHour,
            days_of_week: days,
            paused_until: pausedUntil,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? 'Sauvegarde impossible.')
          return
        }
        setSavedAt(Date.now())
      } catch {
        setError('Pas de connexion.')
      }
    })
  }

  const hours = Array.from({ length: 24 }, (_, i) => i)
  const pausedActive = pausedUntil && new Date(pausedUntil).getTime() > Date.now()

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      {/* Toggle global */}
      <div className="glass rounded-2xl p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-white text-base font-display font-semibold">Activer le Mode Silence</p>
          <p className="text-white/55 text-xs mt-0.5">Notifications coupées sur la plage choisie.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled((v) => !v)}
          className={`w-14 h-8 rounded-full relative transition-colors ${enabled ? 'bg-violet-500/60' : 'bg-white/10'}`}
        >
          <span
            className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg transition-all ${
              enabled ? 'left-7' : 'left-1'
            }`}
          />
        </button>
      </div>

      {enabled && (
        <>
          {/* Plage horaire */}
          <div className="glass rounded-2xl p-5 space-y-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">Plage horaire</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/55 mb-1.5">De</label>
                <select
                  value={startHour}
                  onChange={(e) => setStartHour(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:bg-white/8 focus:border-violet-400/50 focus:outline-none font-mono"
                >
                  {hours.map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/55 mb-1.5">À</label>
                <select
                  value={endHour}
                  onChange={(e) => setEndHour(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:bg-white/8 focus:border-violet-400/50 focus:outline-none font-mono"
                >
                  {hours.map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {startHour > endHour && (
              <p className="text-[11px] text-white/45 leading-relaxed">
                ✦ Plage qui chevauche minuit — silence appliqué de {String(startHour).padStart(2, '0')}h le soir
                à {String(endHour).padStart(2, '0')}h le lendemain.
              </p>
            )}
          </div>

          {/* Jours de la semaine */}
          <div className="glass rounded-2xl p-5 space-y-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">Jours actifs</p>
            <div className="grid grid-cols-7 gap-1.5">
              {DAYS.map((label, idx) => {
                const active = days.includes(idx)
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    className={`py-2 rounded-lg text-xs transition-colors border ${
                      active
                        ? 'bg-violet-500/15 border-violet-400/40 text-white'
                        : 'bg-white/3 border-white/8 text-white/45 hover:bg-white/8'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Pause rapide */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">Pause immédiate</p>
        {pausedActive ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-violet-200">
              Silence jusqu&apos;à <span className="font-mono">{new Date(pausedUntil!).toLocaleString('fr-FR')}</span>
            </p>
            <button
              type="button"
              onClick={clearPause}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/85 hover:bg-white/10"
            >
              Annuler
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {[1, 2, 4, 12, 24].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => pauseFor(h)}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white/85 hover:bg-white/10 transition-colors"
              >
                {h < 24 ? `${h}h` : '1 jour'}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div role="alert" className="px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-2">
        <p className="text-xs text-white/40">
          {savedAt ? `✓ Sauvegardé ${new Date(savedAt).toLocaleTimeString('fr-FR')}` : ''}
        </p>
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold disabled:opacity-40 transition-all hover:from-violet-500 hover:to-cyan-400 text-sm shadow-lg shadow-violet-500/20"
        >
          {isPending ? 'Sauvegarde…' : 'Sauvegarder'}
        </button>
      </div>
    </motion.section>
  )
}
