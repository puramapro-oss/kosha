'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { POST_TYPE_LABELS, type PostType } from '@/lib/posts'

export default function PostComposer({
  cercleId,
  placeholder = 'Quelle parole veux-tu déposer aujourd\'hui ?',
}: {
  cercleId?: string | null
  placeholder?: string
}) {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [type, setType] = useState<PostType>('text')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [moderationFeedback, setModerationFeedback] = useState<{ status: string; reason?: string | null } | null>(null)

  function submit() {
    if (content.trim().length < 5) return
    setError(null)
    setModerationFeedback(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/posts/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: content.trim(), type, cercle_id: cercleId ?? null }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? 'Publication impossible.')
          return
        }
        if (data.status === 'blocked') {
          setModerationFeedback({ status: 'blocked', reason: data.moderation?.reason })
          return
        }
        if (data.status === 'pending_review') {
          setModerationFeedback({ status: 'pending_review', reason: data.moderation?.reason })
          setContent('')
          return
        }
        // published
        setContent('')
        router.refresh()
      } catch {
        setError('Pas de connexion. Réessaie.')
      }
    })
  }

  return (
    <section className="glass rounded-2xl p-4 space-y-3">
      <textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value.slice(0, 2000))
          if (moderationFeedback) setModerationFeedback(null)
        }}
        placeholder={placeholder}
        rows={3}
        maxLength={2000}
        className="w-full px-3 py-2 rounded-xl bg-white/3 border border-white/10 text-white placeholder-white/35 text-[15px] focus:bg-white/5 focus:border-violet-400/40 focus:outline-none transition-colors resize-none"
      />

      <div className="flex items-center gap-2 flex-wrap">
        {(Object.keys(POST_TYPE_LABELS) as PostType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`px-3 py-1.5 rounded-full text-[11px] transition-colors border ${
              type === t
                ? 'bg-violet-500/15 border-violet-400/40 text-white'
                : 'bg-white/3 border-white/8 text-white/55 hover:bg-white/8'
            }`}
          >
            {POST_TYPE_LABELS[t].emoji} {POST_TYPE_LABELS[t].label}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-white/35 font-mono">{content.length}/2000</span>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="alert"
            className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs"
          >
            {error}
          </motion.div>
        )}
        {moderationFeedback?.status === 'blocked' && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            className="px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs leading-relaxed"
          >
            <strong className="text-amber-100">Aria a doucement écarté ce message.</strong>{' '}
            {moderationFeedback.reason ?? 'Reformule avec plus de douceur — KOSHA est un espace sans toxicité.'}
          </motion.div>
        )}
        {moderationFeedback?.status === 'pending_review' && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            role="status"
            className="px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-400/30 text-cyan-200 text-xs leading-relaxed"
          >
            ✦ Ton message est en relecture courte. Il sera publié dès qu&apos;Aria valide.
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-end pt-1">
        <button
          type="button"
          onClick={submit}
          disabled={isPending || content.trim().length < 5}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:from-violet-500 hover:to-cyan-400 text-sm shadow-lg shadow-violet-500/20"
        >
          {isPending ? 'Publication…' : 'Déposer'}
        </button>
      </div>
    </section>
  )
}
