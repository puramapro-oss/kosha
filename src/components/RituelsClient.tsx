'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Users as UsersIcon, Clock, ArrowLeft, Check, Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { THEME_VISUAL, formatCountdownFR, type RituelRow, type ParticipationRow, type RituelState } from '@/lib/rituels'

interface Props {
  userId: string
  current: RituelRow
  initialState: RituelState
  userParticipated: boolean
  upcoming: RituelRow[]
  participations: Array<ParticipationRow & { rituel: RituelRow }>
}

export default function RituelsClient({
  userId,
  current,
  initialState,
  userParticipated,
  upcoming,
  participations,
}: Props) {
  const [now, setNow] = useState<Date>(new Date())
  const [participated, setParticipated] = useState(userParticipated)
  const [participantsCount, setParticipantsCount] = useState(current.participants_count)
  const [intentionDraft, setIntentionDraft] = useState('')
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)

  // Tick countdown chaque seconde
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  // Realtime : nouvelles participations sur le rituel courant → bump le compteur live
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`rituel-${current.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'kosha',
          table: 'rituel_participations',
          filter: `rituel_id=eq.${current.id}`,
        },
        () => {
          setParticipantsCount((c) => c + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [current.id])

  const state = useMemo<RituelState>(() => {
    const start = new Date(current.starts_at_utc).getTime()
    const end = new Date(current.ends_at_utc).getTime()
    const t = now.getTime()
    if (t < start) return 'upcoming'
    if (t > end) return 'ended'
    return 'live'
  }, [current.starts_at_utc, current.ends_at_utc, now])

  const visual = THEME_VISUAL[current.theme_slug]
  const startDate = useMemo(() => new Date(current.starts_at_utc), [current.starts_at_utc])
  const endDate = useMemo(() => new Date(current.ends_at_utc), [current.ends_at_utc])

  function participate() {
    setFeedback(null)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/rituels/${current.id}/participate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intention_text: intentionDraft.trim() || undefined }),
        })
        const data = await res.json()
        if (!res.ok) {
          if (res.status === 409 && data.already_participated) {
            setParticipated(true)
            setFeedback({ kind: 'ok', msg: 'Tu participes déjà à ce rituel cette semaine.' })
            return
          }
          setFeedback({ kind: 'err', msg: data.error ?? 'Une erreur est survenue.' })
          return
        }
        setParticipated(true)
        if (typeof data.participants_count === 'number') {
          setParticipantsCount(data.participants_count)
        }
        setFeedback({ kind: 'ok', msg: 'Ta présence est jointe au rituel. +30 Points crédités.' })
        setIntentionDraft('')
      } catch {
        setFeedback({ kind: 'err', msg: 'Pas de connexion. Réessaie.' })
      }
    })
  }

  const _userId = userId  // pour silence des unused warnings — utilisé par les hooks plus tard
  void _userId

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between gap-4">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-white/55 hover:text-white/85">
          <ArrowLeft className="w-4 h-4" />
          Tableau de bord
        </Link>
        <span className="text-xs uppercase tracking-widest text-white/35 font-medium">Semaine {current.week_iso}</span>
      </header>

      {/* HERO — rituel courant */}
      <section className={`glass rounded-3xl p-8 md:p-10 bg-gradient-to-br ${visual.gradient} relative overflow-hidden`}>
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className={`absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl bg-${visual.tone}-500/20`} />
        </div>
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs uppercase tracking-widest font-medium text-white/85">
            {state === 'live' ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Rituel en cours
              </>
            ) : state === 'upcoming' ? (
              <>
                <Clock className="w-3 h-3" />
                Démarre {formatCountdownFR(startDate, now)}
              </>
            ) : (
              <>Terminé</>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-display font-bold mt-4 text-white leading-tight">
            <span className="mr-3 inline-block">{visual.emoji}</span>
            {current.theme_label}
          </h1>

          <p className="text-white/85 text-lg mt-4 leading-relaxed max-w-3xl">
            {current.variation_text || current.intention}
          </p>

          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black/20 border border-white/15 text-sm text-white/85 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-white/70" />
            <span>{current.mission_label}</span>
          </div>

          {/* Live counter */}
          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-sm text-white">
              <UsersIcon className="w-4 h-4" />
              <span className="font-semibold tabular-nums">{participantsCount.toLocaleString('fr-FR')}</span>
              <span className="text-white/70">voyageur{participantsCount > 1 ? 's' : ''}</span>
            </div>
            <span className="text-xs text-white/55">
              du {formatDateFR(startDate)} au {formatDateFR(endDate)}
            </span>
          </div>

          {/* CTA */}
          {state === 'live' ? (
            participated ? (
              <div className="mt-8 flex items-center gap-3 px-5 py-4 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-100">
                <Check className="w-5 h-5" />
                <div>
                  <p className="font-semibold">Tu fais partie de ce rituel.</p>
                  <p className="text-sm text-emerald-200/85 mt-0.5">Reviens lundi pour le prochain.</p>
                </div>
              </div>
            ) : (
              <div className="mt-8 space-y-3">
                <textarea
                  value={intentionDraft}
                  onChange={(e) => setIntentionDraft(e.target.value.slice(0, 280))}
                  placeholder="Ton intention pour cette semaine (optionnelle)..."
                  rows={2}
                  className="w-full max-w-2xl px-4 py-3 rounded-xl bg-black/25 border border-white/15 text-white placeholder-white/45 text-sm resize-none focus:outline-none focus:border-white/40"
                />
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={participate}
                    disabled={isPending}
                    className="px-6 py-3 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-wait bg-gradient-to-r from-violet-600 to-cyan-500 hover:opacity-90"
                  >
                    {isPending ? 'En cours...' : 'Je participe au rituel'}
                  </button>
                  <span className="text-xs text-white/60">+30 Points crédités</span>
                </div>
                <AnimatePresence>
                  {feedback && (
                    <motion.p
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`text-sm ${feedback.kind === 'ok' ? 'text-emerald-200' : 'text-red-300'}`}
                    >
                      {feedback.msg}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            )
          ) : (
            <p className="mt-8 text-sm text-white/60">
              Le bouton de participation s&apos;activera dès le démarrage.
            </p>
          )}
        </div>
      </section>

      {/* CALENDRIER 6 prochains */}
      <section className="space-y-4">
        <header className="flex items-center justify-between">
          <h2 className="text-xl font-display font-semibold text-white/90">Les 6 prochaines semaines</h2>
          <span className="text-xs text-white/40">Cycle de 6 thèmes — il revient toutes les 6 semaines</span>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {upcoming.map((r) => {
            const v = THEME_VISUAL[r.theme_slug]
            const isCurrent = r.id === current.id
            return (
              <div
                key={r.id}
                className={`rounded-2xl p-5 border transition-all ${
                  isCurrent
                    ? 'bg-white/10 border-white/30 shadow-lg shadow-violet-500/10'
                    : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.06]'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">{v.emoji}</span>
                  <span className="text-[10px] uppercase tracking-widest text-white/40 font-medium">{r.week_iso}</span>
                </div>
                <h3 className="font-display font-semibold text-white text-base">{r.theme_label}</h3>
                <p className="text-xs text-white/55 mt-1.5 line-clamp-2">{r.intention}</p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-white/50">
                  <span>{formatDateFR(new Date(r.starts_at_utc))}</span>
                  <span className="inline-flex items-center gap-1">
                    <UsersIcon className="w-3 h-3" />
                    {r.participants_count}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* MES PARTICIPATIONS */}
      <section className="glass rounded-2xl p-6 space-y-4">
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-display font-semibold text-white/90">Tes rituels</h2>
          {participations.length > 0 && (
            <span className="text-xs text-white/45">{participations.length} participation{participations.length > 1 ? 's' : ''}</span>
          )}
        </header>
        {participations.length === 0 ? (
          <p className="text-white/55 text-sm">
            Tu n&apos;as encore rejoint aucun rituel. Le premier reste gravé dans ton Fil de Vie.
          </p>
        ) : (
          <ul className="space-y-2">
            {participations.map((p) => {
              const v = THEME_VISUAL[p.rituel.theme_slug]
              return (
                <li
                  key={p.id}
                  className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.07]"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-base bg-gradient-to-br ${v.gradient} border border-white/10 shrink-0`}
                  >
                    {v.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{p.rituel.theme_label}</p>
                    {p.intention_text && (
                      <p className="text-xs text-white/65 mt-1 italic">« {p.intention_text} »</p>
                    )}
                    <p className="text-[11px] text-white/40 mt-1">
                      {formatDateFR(new Date(p.participated_at))} · +{p.points_awarded} Points
                    </p>
                  </div>
                  <Heart className="w-4 h-4 text-rose-300/60 shrink-0 mt-1" />
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

function formatDateFR(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}
