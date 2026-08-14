'use client'

import { useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import { formatEur } from '@/lib/cagnottes'

const QUICK_AMOUNTS = [5, 10, 25, 50, 100]

export default function CagnotteContributePanel({
  cagnotteId,
  cagnotteStatus,
  isOwner,
}: {
  cagnotteId: string
  cagnotteStatus: string
  isOwner: boolean
}) {
  const [amount, setAmount] = useState<number>(10)
  const [message, setMessage] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const blocked = cagnotteStatus !== 'active' || isOwner

  function contribute() {
    if (blocked) return
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/cagnottes/${cagnotteId}/contribute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount_cents: Math.round(amount * 100),
            message: message.trim() || null,
            anonymous,
            idempotency_key: crypto.randomUUID(),
          }),
        })
        const data = await res.json()
        if (!res.ok || !data.url) {
          setError(data.error ?? 'Stripe indisponible. Réessaie.')
          return
        }
        window.location.href = data.url
      } catch {
        setError('Pas de connexion. Réessaie.')
      }
    })
  }

  if (isOwner) {
    return (
      <div className="glass rounded-2xl p-5 text-sm text-white/65 text-center">
        Tu as ouvert cette cagnotte. Partage-la pour qu&apos;elle prenne vie.
      </div>
    )
  }

  if (cagnotteStatus !== 'active') {
    return (
      <div className="glass rounded-2xl p-5 text-sm text-white/65 text-center">
        {cagnotteStatus === 'completed'
          ? 'Cette cagnotte a atteint son objectif. ✦'
          : cagnotteStatus === 'frozen' || cagnotteStatus === 'fraud_check'
            ? 'Cette cagnotte est en vérification.'
            : 'Cette cagnotte n\'accepte plus de contributions.'}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass rounded-2xl p-5 space-y-4 sticky top-6"
    >
      <header>
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">Contribuer</p>
        <p className="text-white text-sm mt-1">
          Choisis un montant. Tu seras redirigé vers Stripe pour payer en sécurité.
        </p>
      </header>

      <div className="grid grid-cols-5 gap-1.5">
        {QUICK_AMOUNTS.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAmount(a)}
            className={`py-2 rounded-lg text-xs font-mono transition-colors border ${
              amount === a
                ? 'bg-violet-500/20 border-violet-400/40 text-white'
                : 'bg-white/5 border-white/10 text-white/65 hover:bg-white/10'
            }`}
          >
            {a}€
          </button>
        ))}
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-[0.2em] text-white/45 mb-1.5">Montant libre</label>
        <div className="relative">
          <input
            type="number"
            min={1}
            max={1000000}
            step={1}
            value={amount}
            onChange={(e) => setAmount(Math.max(1, Math.min(1000000, Number(e.target.value) || 0)))}
            className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-base focus:bg-white/8 focus:border-violet-400/50 focus:outline-none transition-colors"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/55 text-sm">€</span>
        </div>
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-[0.2em] text-white/45 mb-1.5">Message (facultatif, {message.length}/280)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 280))}
          rows={2}
          maxLength={280}
          placeholder="Ce que tu souhaites pour cette cagnotte…"
          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:bg-white/8 focus:border-violet-400/50 focus:outline-none resize-none"
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer text-xs text-white/65">
        <input
          type="checkbox"
          checked={anonymous}
          onChange={(e) => setAnonymous(e.target.checked)}
          className="w-4 h-4 rounded border-white/20 bg-white/5 accent-violet-500"
        />
        Donner anonymement
      </label>

      {error && (
        <div role="alert" className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={contribute}
        disabled={isPending || amount < 1 || blocked}
        className="w-full px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:from-violet-500 hover:to-cyan-400 shadow-lg shadow-violet-500/20"
      >
        {isPending ? 'Redirection Stripe…' : `Contribuer ${formatEur(Math.round(amount * 100))}`}
      </button>

      <p className="text-[10px] text-white/35 text-center leading-relaxed">
        Paiement sécurisé par Stripe. Aucune donnée bancaire ne transite par KOSHA.
      </p>
    </motion.div>
  )
}
