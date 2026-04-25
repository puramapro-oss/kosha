/**
 * KOSHA — Cercles de Vie
 * Groupes intimes max 12 membres autour d'une intention partagée.
 */
import { z } from 'zod'
import { createServiceClient } from './supabase'

export interface Cercle {
  id: string
  name: string
  intention: string
  created_by: string
  max_members: number
  visibility: 'public' | 'private'
  members_count: number
  posts_count: number
  archived: boolean
  created_at: string
}

export interface CercleWithMembership extends Cercle {
  is_member: boolean
  is_creator: boolean
  members_preview: Array<{ user_id: string; full_name: string | null; avatar_url: string | null; role: string }>
}

export const CercleCreateSchema = z.object({
  name: z.string().trim().min(3, 'Au moins 3 caractères.').max(60, 'Maximum 60 caractères.'),
  intention: z
    .string()
    .trim()
    .min(10, 'Donne plus de souffle à ton intention — au moins 10 caractères.')
    .max(500, 'Maximum 500 caractères.'),
  visibility: z.enum(['public', 'private']).default('public'),
  max_members: z.number().int().min(3).max(24).default(12),
})
export type CercleCreateInput = z.infer<typeof CercleCreateSchema>

// -----------------------------------------------------------------------------
// QUERIES
// -----------------------------------------------------------------------------
export async function getActiveCercles(viewerId: string, opts: { limit?: number } = {}): Promise<CercleWithMembership[]> {
  const service = createServiceClient()
  const { data: cercles } = await service
    .from('cercles')
    .select('*')
    .eq('archived', false)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(opts.limit ?? 50)

  if (!cercles || cercles.length === 0) return []

  return enrichCercles(cercles as Cercle[], viewerId)
}

export async function getCercleById(id: string, viewerId: string): Promise<CercleWithMembership | null> {
  const service = createServiceClient()
  const { data } = await service.from('cercles').select('*').eq('id', id).eq('archived', false).maybeSingle()
  if (!data) return null
  const enriched = await enrichCercles([data as Cercle], viewerId)
  return enriched[0] ?? null
}

async function enrichCercles(cercles: Cercle[], viewerId: string): Promise<CercleWithMembership[]> {
  const service = createServiceClient()
  const cercleIds = cercles.map((c) => c.id)

  const [{ data: members }, { data: myMembership }] = await Promise.all([
    service.from('cercle_membres').select('cercle_id, user_id, role').in('cercle_id', cercleIds),
    service
      .from('cercle_membres')
      .select('cercle_id')
      .in('cercle_id', cercleIds)
      .eq('user_id', viewerId),
  ])

  const memberIds = Array.from(new Set((members ?? []).map((m) => m.user_id as string)))
  const profiles = await fetchProfilesMap(memberIds)
  const myMembershipSet = new Set((myMembership ?? []).map((m) => m.cercle_id as string))

  const membersByCercle = new Map<string, Array<{ user_id: string; role: string }>>()
  for (const m of members ?? []) {
    const arr = membersByCercle.get(m.cercle_id as string) ?? []
    arr.push({ user_id: m.user_id as string, role: m.role as string })
    membersByCercle.set(m.cercle_id as string, arr)
  }

  return cercles.map((c) => {
    const ms = membersByCercle.get(c.id) ?? []
    const preview = ms.slice(0, 8).map((m) => {
      const p = profiles.get(m.user_id)
      return { user_id: m.user_id, full_name: p?.full_name ?? null, avatar_url: p?.avatar_url ?? null, role: m.role }
    })
    return {
      ...c,
      is_member: myMembershipSet.has(c.id),
      is_creator: c.created_by === viewerId,
      members_preview: preview,
    }
  })
}

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
