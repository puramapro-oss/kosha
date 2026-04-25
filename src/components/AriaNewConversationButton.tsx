'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Plus } from 'lucide-react'

export default function AriaNewConversationButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function create() {
    if (loading) return
    setLoading(true)
    try {
      const r = await fetch('/api/aria/conversations', { method: 'POST' })
      const data = (await r.json()) as { conversation?: { id: string }; error?: string }
      if (!r.ok || !data.conversation) {
        alert(data.error ?? "Aria n'arrive pas à créer la conversation.")
        return
      }
      router.push(`/aria/${data.conversation.id}`)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur réseau.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={create}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
      style={{
        background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
        boxShadow: '0 6px 24px -6px rgba(124,58,237,0.55)',
      }}
    >
      <Plus className="w-4 h-4" />
      {loading ? '...' : 'Nouvelle'}
    </button>
  )
}
