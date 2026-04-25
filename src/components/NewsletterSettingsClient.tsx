'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Check, Eye, MousePointerClick, Calendar } from 'lucide-react'

interface EmailRow {
  id: string
  week_iso: string
  subject: string
  action_kind: string
  action_label: string
  sent_at: string
  opened_at: string | null
  action_taken_at: string | null
}

interface Props {
  initialSubscribed: boolean
  unsubscribeToken: string
  lastSentAt: string | null
  emails: EmailRow[]
}

export default function NewsletterSettingsClient({
  initialSubscribed,
  unsubscribeToken,
  lastSentAt,
  emails,
}: Props) {
  const [subscribed, setSubscribed] = useState(initialSubscribed)
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)

  function toggle() {
    setFeedback(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/newsletter/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscribed: !subscribed }),
        })
        const data = await res.json()
        if (!res.ok) {
          setFeedback({ kind: 'err', msg: data.error ?? 'Mise à jour impossible.' })
          return
        }
        setSubscribed(!subscribed)
        setFeedback({
          kind: 'ok',
          msg: !subscribed
            ? 'Tu es à nouveau abonné. Le prochain envoi part lundi 9h.'
            : 'Tu es désabonné. Aucun email ne te sera envoyé.',
        })
      } catch {
        setFeedback({ kind: 'err', msg: 'Pas de connexion.' })
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Bloc abonnement */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-widest text-white/40 font-medium">Abonnement</p>
            <p className="text-lg font-display font-semibold mt-1 text-white">
              {subscribed ? 'Tu reçois la newsletter' : 'Tu ne reçois rien'}
            </p>
            {lastSentAt && (
              <p className="text-xs text-white/45 mt-1">Dernier envoi : {formatDateFR(new Date(lastSentAt))}</p>
            )}
          </div>
          <button
            onClick={toggle}
            disabled={isPending}
            className={`relative w-14 h-8 rounded-full transition-all disabled:opacity-50 ${
              subscribed ? 'bg-emerald-500/60' : 'bg-white/10'
            }`}
            aria-pressed={subscribed}
          >
            <span
              className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${
                subscribed ? 'left-7' : 'left-1'
              }`}
            />
          </button>
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

        <p className="text-xs text-white/40 leading-relaxed">
          Tu peux te désabonner par 1 clic dans chaque email reçu. L&apos;ordre RFC 8058 (List-Unsubscribe One-Click) est respecté.
          {' '}
          <a
            href={`/api/newsletter/unsubscribe?token=${unsubscribeToken}`}
            className="text-white/60 underline underline-offset-2 hover:text-white/85"
          >
            Lien de désabo direct
          </a>
        </p>
      </div>

      {/* Historique */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-display font-semibold text-white/90 flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5" />
          Tes derniers numéros
        </h2>
        {emails.length === 0 ? (
          <p className="text-white/55 text-sm">
            Tu n&apos;as encore reçu aucune newsletter. Le premier envoi a lieu lundi 9h.
          </p>
        ) : (
          <ul className="divide-y divide-white/5">
            {emails.map((e) => (
              <li key={e.id} className="py-3 flex items-start gap-4">
                <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono w-20 mt-1 shrink-0">
                  {e.week_iso}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{e.subject}</p>
                  <p className="text-xs text-white/45 mt-1">
                    Action proposée : {e.action_label} ({e.action_kind})
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-white/45 shrink-0">
                  <span className="inline-flex items-center gap-1" title="Envoyé">
                    <Calendar className="w-3 h-3" />
                    {formatDateFR(new Date(e.sent_at))}
                  </span>
                  {e.opened_at && (
                    <span className="inline-flex items-center gap-1 text-white/65" title="Ouvert">
                      <Eye className="w-3 h-3" />
                    </span>
                  )}
                  {e.action_taken_at && (
                    <span className="inline-flex items-center gap-1 text-emerald-300" title="Action faite">
                      <MousePointerClick className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Promesse */}
      <div className="rounded-2xl p-5 border border-white/10 bg-gradient-to-br from-violet-500/10 to-cyan-500/5">
        <p className="text-sm text-white/85 leading-relaxed">
          <Check className="w-4 h-4 inline mr-1.5 text-emerald-300" />
          Notre engagement : aucun email transactionnel commercial, jamais d&apos;urgence fabriquée, jamais de FOMO.
          Notre mesure de succès n&apos;est pas le taux d&apos;ouverture, c&apos;est ton{' '}
          <strong className="text-white">taux d&apos;action concrète</strong>.
        </p>
      </div>
    </div>
  )
}

function formatDateFR(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
