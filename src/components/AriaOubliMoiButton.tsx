'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AriaOubliMoiButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function trigger() {
    if (loading || done) return
    if (!confirm("Tu es sûr ? Aria va oublier toutes tes préférences et archiver tes conversations.")) return
    setLoading(true)
    try {
      const r = await fetch('/api/aria/oubli-moi', { method: 'POST' })
      const data = (await r.json()) as { ok?: boolean; message?: string; error?: string }
      if (!r.ok || !data.ok) {
        alert(data.error ?? 'Erreur lors de l\'effacement.')
        return
      }
      setDone(true)
      setTimeout(() => router.push('/aria'), 2000)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur réseau.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-xl px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-200/90 text-sm">
        ✓ Aria a tout oublié. Redirection vers /aria...
      </div>
    )
  }

  return (
    <button
      onClick={trigger}
      disabled={loading}
      className="w-full px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200/90 text-sm font-medium hover:bg-red-500/15 transition-colors disabled:opacity-50"
    >
      {loading ? '...' : 'Tout effacer maintenant'}
    </button>
  )
}
