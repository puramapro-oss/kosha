'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export default function CercleJoinButton({
  cercleId,
  isMember,
  isCreator,
  isFull,
}: {
  cercleId: string
  isMember: boolean
  isCreator: boolean
  isFull: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [memberLocal, setMemberLocal] = useState(isMember)

  if (isCreator) {
    return (
      <div className="px-4 py-2 rounded-xl bg-violet-500/10 border border-violet-400/30 text-violet-200 text-xs text-center">
        Tu es le capitaine de ce cercle.
      </div>
    )
  }

  function action() {
    setError(null)
    startTransition(async () => {
      try {
        const method = memberLocal ? 'DELETE' : 'POST'
        const res = await fetch(`/api/cercles/${cercleId}/membership`, { method })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? 'Action impossible.')
          return
        }
        setMemberLocal(!memberLocal)
        router.refresh()
      } catch {
        setError('Pas de connexion. Réessaie.')
      }
    })
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={action}
        disabled={isPending || (!memberLocal && isFull)}
        className={`w-full px-5 py-3 rounded-2xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm ${
          memberLocal
            ? 'bg-white/5 border border-white/10 text-white/85 hover:bg-white/8'
            : 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white hover:from-violet-500 hover:to-cyan-400 shadow-lg shadow-violet-500/20'
        }`}
      >
        {isPending
          ? 'En cours…'
          : memberLocal
            ? 'Quitter le cercle'
            : isFull
              ? 'Cercle complet'
              : '✶ Rejoindre le cercle'}
      </button>
      {error && <p className="text-xs text-red-300 text-center">{error}</p>}
    </div>
  )
}
