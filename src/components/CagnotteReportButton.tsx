'use client'

import { useState, useTransition } from 'react'

export default function CagnotteReportButton({ cagnotteId, isOwner }: { cagnotteId: string; isOwner: boolean }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (isOwner) return null

  function submit() {
    if (reason.trim().length < 10) return
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/cagnottes/${cagnotteId}/report`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: reason.trim(), severity: 5 }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? 'Signalement impossible.')
          return
        }
        setDone(true)
      } catch {
        setError('Pas de connexion.')
      }
    })
  }

  if (done) {
    return (
      <p className="text-xs text-emerald-300/80 text-center mt-2">
        ✓ Merci. Notre équipe va examiner cette cagnotte.
      </p>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[11px] text-white/35 hover:text-white/65 underline underline-offset-2 transition-colors"
      >
        Signaler un problème
      </button>
    )
  }

  return (
    <div className="glass rounded-xl p-4 space-y-3 mt-3">
      <p className="text-xs text-white/65">Décris le problème en quelques mots. Aria et notre équipe examineront.</p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value.slice(0, 500))}
        rows={3}
        maxLength={500}
        placeholder="Pourquoi cette cagnotte semble suspecte ?"
        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs placeholder-white/30 resize-none focus:outline-none focus:border-violet-400/50"
      />
      {error && <p className="text-xs text-red-300">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-3 py-1.5 text-xs text-white/55 hover:text-white transition-colors"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={isPending || reason.trim().length < 10}
          className="ml-auto px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-400/30 text-amber-200 text-xs disabled:opacity-40 hover:bg-amber-500/25 transition-colors"
        >
          {isPending ? 'Envoi…' : 'Envoyer'}
        </button>
      </div>
    </div>
  )
}
