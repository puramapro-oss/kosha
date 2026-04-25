/**
 * KOSHA — Cagnottes domain logic
 * Types, Zod schemas, helpers, fetchers.
 */
import { z } from 'zod'
import { createServiceClient } from './supabase'
import { calculateSplit } from './treezor'

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------
export type CagnotteType = 'communautaire' | 'projet_vie' | 'action_immediate' | 'humanitaire' | 'hybride'

export type CagnotteStatus = 'active' | 'completed' | 'frozen' | 'fraud_check' | 'cancelled'

export interface Cagnotte {
  id: string
  owner_id: string
  type: CagnotteType
  title: string
  description: string
  description_aria: string | null
  ai_reformulation_done: boolean
  target_amount_cents: number
  raised_amount_cents: number
  contributors_count: number
  status: CagnotteStatus
  ai_score_arnaque: number | null
  ai_score_reason: string | null
  image_url: string | null
  geolocation_geohash: string | null
  geolocation_label: string | null
  created_at: string
  ends_at: string | null
  completed_at: string | null
}

export interface CagnotteWithOwner extends Cagnotte {
  owner_name: string | null
  owner_avatar: string | null
}

// -----------------------------------------------------------------------------
// LABELS UI (jamais hardcodés ailleurs)
// -----------------------------------------------------------------------------
export const CAGNOTTE_TYPE_LABELS: Record<CagnotteType, { label: string; emoji: string; tagline: string }> = {
  communautaire: {
    label: 'Cagnotte communautaire',
    emoji: '✶',
    tagline: 'Pour soutenir un projet collectif local.',
  },
  projet_vie: {
    label: 'Projet de vie',
    emoji: '◇',
    tagline: 'Pour faire éclore un rêve concret et mesurable.',
  },
  action_immediate: {
    label: 'Action immédiate',
    emoji: '⚡',
    tagline: 'Pour répondre maintenant à une situation urgente.',
  },
  humanitaire: {
    label: 'Humanitaire',
    emoji: '✦',
    tagline: 'Pour porter un acte solidaire au-delà des frontières.',
  },
  hybride: {
    label: 'Hybride',
    emoji: '⌬',
    tagline: 'Pour mêler plusieurs intentions dans une même cause.',
  },
}

export const CAGNOTTE_STATUS_LABELS: Record<CagnotteStatus, { label: string; tone: string }> = {
  active: { label: 'En cours', tone: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' },
  completed: { label: 'Atteinte', tone: 'text-violet-200 bg-violet-500/10 border-violet-500/30' },
  frozen: { label: 'En revue', tone: 'text-amber-300 bg-amber-500/10 border-amber-500/20' },
  fraud_check: { label: 'Vérification', tone: 'text-amber-300 bg-amber-500/10 border-amber-500/20' },
  cancelled: { label: 'Annulée', tone: 'text-white/40 bg-white/5 border-white/10' },
}

// -----------------------------------------------------------------------------
// VALIDATION SCHEMAS
// -----------------------------------------------------------------------------
export const CagnotteCreateSchema = z.object({
  type: z.enum(['communautaire', 'projet_vie', 'action_immediate', 'humanitaire', 'hybride']),
  title: z.string().trim().min(4, 'Au moins 4 caractères.').max(80, 'Maximum 80 caractères.'),
  description: z
    .string()
    .trim()
    .min(20, 'Décris un peu plus — au moins 20 caractères.')
    .max(2000, 'Trop long — maximum 2000 caractères.'),
  target_amount_cents: z
    .number()
    .int()
    .min(500, 'Minimum 5€.')
    .max(100_000_000, 'Maximum 1 000 000€.'),
  ends_at: z.string().datetime().optional().nullable(),
  geolocation_label: z.string().max(120).optional().nullable(),
  image_url: z.string().url().optional().nullable(),
})
export type CagnotteCreateInput = z.infer<typeof CagnotteCreateSchema>

export const CagnotteContributeSchema = z.object({
  amount_cents: z
    .number()
    .int()
    .min(100, 'Minimum 1€.')
    .max(100_000_000, 'Maximum 1 000 000€.'),
  message: z.string().trim().max(280, 'Maximum 280 caractères.').optional().nullable(),
  anonymous: z.boolean().default(false),
})
export type CagnotteContributeInput = z.infer<typeof CagnotteContributeSchema>

export const CagnotteReportSchema = z.object({
  reason: z.string().trim().min(10, 'Décris la raison — au moins 10 caractères.').max(500),
  severity: z.number().int().min(1).max(10).default(5),
})
export type CagnotteReportInput = z.infer<typeof CagnotteReportSchema>

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

export async function getActiveCagnottes(opts: { type?: CagnotteType; limit?: number } = {}): Promise<CagnotteWithOwner[]> {
  const service = createServiceClient()
  let q = service
    .from('cagnottes')
    .select('*')
    .in('status', ['active', 'completed'])
    .order('created_at', { ascending: false })
    .limit(opts.limit ?? 50)

  if (opts.type) q = q.eq('type', opts.type)

  const { data, error } = await q
  if (error || !data) return []

  const ownerIds = Array.from(new Set(data.map((r) => r.owner_id as string)))
  const profiles = await fetchProfilesMap(ownerIds)

  return data.map((row) => {
    const p = profiles.get(row.owner_id as string)
    return {
      ...(row as Cagnotte),
      owner_name: p?.full_name ?? null,
      owner_avatar: p?.avatar_url ?? null,
    } as CagnotteWithOwner
  })
}

export async function getCagnotteById(id: string): Promise<CagnotteWithOwner | null> {
  const service = createServiceClient()
  const { data, error } = await service.from('cagnottes').select('*').eq('id', id).maybeSingle()
  if (error || !data) return null
  const profiles = await fetchProfilesMap([data.owner_id as string])
  const p = profiles.get(data.owner_id as string)
  return {
    ...(data as Cagnotte),
    owner_name: p?.full_name ?? null,
    owner_avatar: p?.avatar_url ?? null,
  } as CagnotteWithOwner
}

export async function getCagnotteSplits(cagnotteId: string) {
  const service = createServiceClient()
  const { data } = await service.from('cagnotte_splits').select('*').eq('cagnotte_id', cagnotteId).maybeSingle()
  return data
}

export interface RecentContribution {
  id: string
  amount_cents: number
  message: string | null
  anonymous: boolean
  paid_at: string | null
  contributor_id: string
  display_name: string | null
  display_avatar: string | null
}

export async function getRecentContributions(cagnotteId: string, limit = 30): Promise<RecentContribution[]> {
  const service = createServiceClient()
  const { data } = await service
    .from('cagnotte_contributions')
    .select('id, amount_cents, message, anonymous, paid_at, contributor_id')
    .eq('cagnotte_id', cagnotteId)
    .eq('status', 'succeeded')
    .order('paid_at', { ascending: false })
    .limit(limit)
  if (!data) return []

  const contributorIds = Array.from(new Set(data.map((r) => r.contributor_id as string)))
  const profiles = await fetchProfilesMap(contributorIds)

  return data.map((row) => {
    const p = profiles.get(row.contributor_id as string)
    return {
      id: row.id as string,
      amount_cents: row.amount_cents as number,
      message: row.message as string | null,
      anonymous: row.anonymous as boolean,
      paid_at: row.paid_at as string | null,
      contributor_id: row.contributor_id as string,
      display_name: row.anonymous ? null : p?.full_name ?? 'Voyageur',
      display_avatar: row.anonymous ? null : p?.avatar_url ?? null,
    }
  })
}

// -----------------------------------------------------------------------------
// IMPACT GLOBAL
// -----------------------------------------------------------------------------
export async function getImpactGlobal() {
  const service = createServiceClient()
  const { data } = await service.from('impact_global').select('*').eq('id', 1).maybeSingle()
  return data
}

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------
export function progressPercent(raised: number, target: number): number {
  if (target <= 0) return 0
  return Math.min(100, Math.round((raised / target) * 100))
}

export function formatEur(cents: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(cents / 100)
}

export { calculateSplit }
