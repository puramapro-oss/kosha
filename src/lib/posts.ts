/**
 * KOSHA — Posts domain logic
 * Types, Zod schemas, queries.
 */
import { z } from 'zod'
import { createServiceClient } from './supabase'

export type PostType = 'text' | 'story' | 'milestone' | 'gratitude'
export type PostStatus = 'pending_review' | 'published' | 'blocked' | 'deleted'
export type ReactionType = 'energie' | 'gratitude' | 'soutien'

export const REACTION_TYPES: ReactionType[] = ['energie', 'gratitude', 'soutien']

export const REACTION_LABELS: Record<ReactionType, { emoji: string; label: string; color: string; tagline: string }> = {
  energie: { emoji: '⚡', label: 'Énergie', color: '#F59E0B', tagline: 'Ce que tu as posté m\'enflamme.' },
  gratitude: { emoji: '✦', label: 'Gratitude', color: '#7C3AED', tagline: 'Merci pour cette parole.' },
  soutien: { emoji: '⟡', label: 'Soutien', color: '#06B6D4', tagline: 'Je suis là.' },
}

export const POST_TYPE_LABELS: Record<PostType, { emoji: string; label: string }> = {
  text: { emoji: '◇', label: 'Parole' },
  story: { emoji: '⊹', label: 'Histoire' },
  milestone: { emoji: '◈', label: 'Cap atteint' },
  gratitude: { emoji: '✦', label: 'Gratitude' },
}

export interface Post {
  id: string
  author_id: string
  cercle_id: string | null
  content: string
  type: PostType
  media_url: string | null
  status: PostStatus
  ai_moderation_score: number | null
  ai_moderation_reason: string | null
  ai_moderation_categories: string[] | null
  reactions_count: number
  created_at: string
}

export interface PostWithMeta extends Post {
  author_name: string | null
  author_avatar: string | null
  cercle_name: string | null
  reactions_by_type: Record<ReactionType, number>
  my_reactions: ReactionType[]
}

export const PostCreateSchema = z.object({
  content: z.string().trim().min(5, 'Au moins 5 caractères.').max(2000, 'Maximum 2000 caractères.'),
  cercle_id: z.string().uuid().nullable().optional(),
  type: z.enum(['text', 'story', 'milestone', 'gratitude']).default('text'),
  media_url: z.string().url().nullable().optional(),
})
export type PostCreateInput = z.infer<typeof PostCreateSchema>

export const ReactionToggleSchema = z.object({
  type: z.enum(['energie', 'gratitude', 'soutien']),
})
export type ReactionToggleInput = z.infer<typeof ReactionToggleSchema>

// -----------------------------------------------------------------------------
// QUERIES
// -----------------------------------------------------------------------------
async function fetchProfilesMap(userIds: string[]): Promise<Map<string, { full_name: string | null; avatar_url: string | null }>> {
  if (userIds.length === 0) return new Map()
  const service = createServiceClient()
  const { data } = await service.from('profiles').select('id, full_name, avatar_url').in('id', userIds)
  const map = new Map<string, { full_name: string | null; avatar_url: string | null }>()
  for (const p of data ?? []) {
    map.set(p.id as string, { full_name: p.full_name as string | null, avatar_url: p.avatar_url as string | null })
  }
  return map
}

async function fetchCerclesMap(cercleIds: string[]): Promise<Map<string, string>> {
  if (cercleIds.length === 0) return new Map()
  const service = createServiceClient()
  const { data } = await service.from('cercles').select('id, name').in('id', cercleIds)
  const map = new Map<string, string>()
  for (const c of data ?? []) {
    map.set(c.id as string, c.name as string)
  }
  return map
}

async function enrichPosts(rows: Post[], viewerId: string): Promise<PostWithMeta[]> {
  if (rows.length === 0) return []

  const authorIds = Array.from(new Set(rows.map((r) => r.author_id)))
  const cercleIds = Array.from(new Set(rows.map((r) => r.cercle_id).filter((x): x is string => !!x)))
  const postIds = rows.map((r) => r.id)

  const service = createServiceClient()

  const [profiles, cercles, reactions] = await Promise.all([
    fetchProfilesMap(authorIds),
    fetchCerclesMap(cercleIds),
    service
      .from('reactions')
      .select('post_id, user_id, type')
      .in('post_id', postIds)
      .then(({ data }) => data ?? []),
  ])

  // Index reactions par post_id
  const reactionsByPost = new Map<string, { type: ReactionType; user_id: string }[]>()
  for (const r of reactions) {
    const arr = reactionsByPost.get(r.post_id as string) ?? []
    arr.push({ type: r.type as ReactionType, user_id: r.user_id as string })
    reactionsByPost.set(r.post_id as string, arr)
  }

  return rows.map((post) => {
    const reacts = reactionsByPost.get(post.id) ?? []
    const reactionsByType: Record<ReactionType, number> = { energie: 0, gratitude: 0, soutien: 0 }
    const myReactions: ReactionType[] = []
    for (const r of reacts) {
      reactionsByType[r.type] = (reactionsByType[r.type] ?? 0) + 1
      if (r.user_id === viewerId) myReactions.push(r.type)
    }
    const author = profiles.get(post.author_id)
    return {
      ...post,
      author_name: author?.full_name ?? null,
      author_avatar: author?.avatar_url ?? null,
      cercle_name: post.cercle_id ? cercles.get(post.cercle_id) ?? null : null,
      reactions_by_type: reactionsByType,
      my_reactions: myReactions,
    }
  })
}

export async function getPublicFeed(viewerId: string, limit = 30): Promise<PostWithMeta[]> {
  const service = createServiceClient()
  const { data } = await service
    .from('posts')
    .select('*')
    .is('cercle_id', null)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(limit)
  return enrichPosts((data ?? []) as Post[], viewerId)
}

export async function getCerclePosts(cercleId: string, viewerId: string, limit = 30): Promise<PostWithMeta[]> {
  const service = createServiceClient()
  const { data } = await service
    .from('posts')
    .select('*')
    .eq('cercle_id', cercleId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(limit)
  return enrichPosts((data ?? []) as Post[], viewerId)
}
