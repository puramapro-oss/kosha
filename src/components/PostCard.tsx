'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  REACTION_TYPES,
  REACTION_LABELS,
  POST_TYPE_LABELS,
  type ReactionType,
  type PostWithMeta,
} from '@/lib/posts'
import { stringToColor, getInitials } from '@/lib/utils'

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60_000)
  if (min < 1) return 'à l\'instant'
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h} h`
  const d = Math.floor(h / 24)
  if (d < 7) return `il y a ${d} j`
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function PostCard({ post, viewerId }: { post: PostWithMeta; viewerId: string }) {
  const [reactions, setReactions] = useState(post.reactions_by_type)
  const [my, setMy] = useState<ReactionType[]>(post.my_reactions)
  const [isPending, startTransition] = useTransition()

  const isMe = post.author_id === viewerId
  const authorColor = stringToColor(post.author_id)
  const typeMeta = POST_TYPE_LABELS[post.type]

  function toggle(type: ReactionType) {
    const wasActive = my.includes(type)
    // Optimistic
    setReactions((r) => ({ ...r, [type]: Math.max(0, (r[type] ?? 0) + (wasActive ? -1 : 1)) }))
    setMy((arr) => (wasActive ? arr.filter((t) => t !== type) : [...arr, type]))

    startTransition(async () => {
      try {
        const res = await fetch(`/api/posts/${post.id}/react`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type }),
        })
        if (!res.ok) {
          // Rollback
          setReactions((r) => ({ ...r, [type]: Math.max(0, (r[type] ?? 0) + (wasActive ? 1 : -1)) }))
          setMy((arr) => (wasActive ? [...arr, type] : arr.filter((t) => t !== type)))
        }
      } catch {
        // Rollback réseau
        setReactions((r) => ({ ...r, [type]: Math.max(0, (r[type] ?? 0) + (wasActive ? 1 : -1)) }))
        setMy((arr) => (wasActive ? [...arr, type] : arr.filter((t) => t !== type)))
      }
    })
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="glass rounded-2xl p-5 space-y-3"
    >
      <header className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ background: `linear-gradient(135deg, ${authorColor}, #06B6D4)` }}
          aria-hidden
        >
          {getInitials(post.author_name ?? 'V')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-white text-sm font-medium">
              {isMe ? 'Toi' : post.author_name ?? 'Voyageur'}
            </span>
            <span className="text-[10px] uppercase tracking-[0.15em] text-white/40">
              {typeMeta.emoji} {typeMeta.label}
            </span>
            {post.cercle_name && post.cercle_id && (
              <Link
                href={`/cercles/${post.cercle_id}`}
                className="text-[10px] text-violet-300/80 hover:text-violet-200 transition-colors"
              >
                ✶ {post.cercle_name}
              </Link>
            )}
          </div>
          <p className="text-[11px] text-white/35 mt-0.5 font-mono">{formatRelative(post.created_at)}</p>
        </div>
      </header>

      <p className="text-white/90 text-[15px] leading-relaxed whitespace-pre-wrap">{post.content}</p>

      {post.media_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.media_url} alt="" className="w-full rounded-xl border border-white/8" />
      )}

      <footer className="flex items-center gap-1.5 pt-2">
        {REACTION_TYPES.map((type) => {
          const meta = REACTION_LABELS[type]
          const count = reactions[type] ?? 0
          const active = my.includes(type)
          return (
            <button
              key={type}
              type="button"
              onClick={() => toggle(type)}
              disabled={isPending && active}
              title={meta.tagline}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all border ${
                active
                  ? 'border-white/25 bg-white/8 text-white'
                  : 'border-white/8 bg-white/3 text-white/55 hover:bg-white/8 hover:text-white/85'
              }`}
              style={active ? { color: meta.color, borderColor: `${meta.color}55`, background: `${meta.color}10` } : undefined}
            >
              <span>{meta.emoji}</span>
              <span className="font-mono">{count}</span>
            </button>
          )
        })}
      </footer>
    </motion.article>
  )
}

export function FeedList({ initialPosts, viewerId }: { initialPosts: PostWithMeta[]; viewerId: string }) {
  const [posts] = useState(initialPosts)

  if (posts.length === 0) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <div className="text-5xl mb-4 opacity-50" aria-hidden>
          ◯
        </div>
        <h2 className="text-lg font-display font-semibold text-white/85">Le feed est silencieux.</h2>
        <p className="text-white/55 text-sm mt-2 max-w-md mx-auto leading-relaxed">
          Sois la première lumière. Une parole sincère vaut mille likes.
        </p>
      </div>
    )
  }

  return (
    <AnimatePresence initial={false}>
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} viewerId={viewerId} />
        ))}
      </div>
    </AnimatePresence>
  )
}
