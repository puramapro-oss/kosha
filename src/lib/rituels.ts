/**
 * KOSHA P8 — VIDA RITUELS helpers
 * 6 thèmes cycliques, 1 rituel hebdo, participation = +30 Points + fil_de_vie
 */
import { z } from 'zod'
import { createServiceClient } from './supabase'
import { askAria, MODEL_FAST } from './claude'
import { AI_NAME, APP_NAME } from './constants'

export type RituelThemeSlug = 'depollution' | 'paix' | 'amour' | 'pardon' | 'gratitude' | 'abondance'

export interface RituelRow {
  id: string
  week_iso: string
  theme_index: number
  theme_slug: RituelThemeSlug
  theme_label: string
  intention: string
  mission_label: string
  starts_at_utc: string
  ends_at_utc: string
  participants_count: number
  variation_text: string | null
}

export interface ParticipationRow {
  id: string
  rituel_id: string
  user_id: string
  intention_text: string | null
  points_awarded: number
  participated_at: string
}

export type RituelState = 'upcoming' | 'live' | 'ended'

/** Donne l'état d'un rituel selon now() */
export function rituelState(rituel: RituelRow, now = new Date()): RituelState {
  const start = new Date(rituel.starts_at_utc).getTime()
  const end = new Date(rituel.ends_at_utc).getTime()
  const t = now.getTime()
  if (t < start) return 'upcoming'
  if (t > end) return 'ended'
  return 'live'
}

/** Le rituel actif maintenant (live, sinon le prochain à démarrer) */
export async function getCurrentRituel(): Promise<RituelRow | null> {
  const admin = createServiceClient()
  // 1) live d'abord
  const nowIso = new Date().toISOString()
  const { data: live, error: e1 } = await admin
    .from('rituels_calendar')
    .select('*')
    .lte('starts_at_utc', nowIso)
    .gte('ends_at_utc', nowIso)
    .order('starts_at_utc', { ascending: false })
    .limit(1)
  if (e1) {
    console.error('[rituels] getCurrentRituel live failed', e1.message)
    return null
  }
  if (live && live.length > 0) return live[0] as RituelRow

  // 2) sinon le prochain
  const { data: upcoming, error: e2 } = await admin
    .from('rituels_calendar')
    .select('*')
    .gt('starts_at_utc', nowIso)
    .order('starts_at_utc', { ascending: true })
    .limit(1)
  if (e2) {
    console.error('[rituels] getCurrentRituel upcoming failed', e2.message)
    return null
  }
  return (upcoming?.[0] as RituelRow) ?? null
}

/** Les N prochains rituels (incl. courant), trié par date */
export async function getUpcomingRituels(weeks = 6): Promise<RituelRow[]> {
  const admin = createServiceClient()
  const nowMonday = startOfWeekUtc(new Date()).toISOString()
  const { data, error } = await admin
    .from('rituels_calendar')
    .select('*')
    .gte('starts_at_utc', nowMonday)
    .order('starts_at_utc', { ascending: true })
    .limit(weeks)
  if (error) {
    console.error('[rituels] getUpcomingRituels failed', error.message)
    return []
  }
  return (data ?? []) as RituelRow[]
}

/** Participations récentes d'un user */
export async function getUserParticipations(userId: string, limit = 12): Promise<Array<ParticipationRow & { rituel: RituelRow }>> {
  const admin = createServiceClient()
  const { data, error } = await admin
    .from('rituel_participations')
    .select('id, rituel_id, user_id, intention_text, points_awarded, participated_at')
    .eq('user_id', userId)
    .order('participated_at', { ascending: false })
    .limit(limit)
  if (error || !data) {
    if (error) console.error('[rituels] getUserParticipations failed', error.message)
    return []
  }
  if (data.length === 0) return []

  const rituelIds = Array.from(new Set(data.map((p) => p.rituel_id)))
  const { data: rituels } = await admin
    .from('rituels_calendar')
    .select('*')
    .in('id', rituelIds)
  const byId = new Map<string, RituelRow>()
  for (const r of (rituels ?? []) as RituelRow[]) byId.set(r.id, r)

  return data
    .map((p) => {
      const r = byId.get(p.rituel_id)
      if (!r) return null
      return { ...(p as ParticipationRow), rituel: r }
    })
    .filter((x): x is ParticipationRow & { rituel: RituelRow } => x !== null)
}

export async function hasParticipated(userId: string, rituelId: string): Promise<boolean> {
  const admin = createServiceClient()
  const { data } = await admin
    .from('rituel_participations')
    .select('id')
    .eq('user_id', userId)
    .eq('rituel_id', rituelId)
    .maybeSingle()
  return Boolean(data)
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation Zod intention text
// ─────────────────────────────────────────────────────────────────────────────
export const participateSchema = z.object({
  intention_text: z
    .string()
    .trim()
    .min(3, 'Intention trop courte (min 3 caractères)')
    .max(280, 'Intention trop longue (max 280 caractères)')
    .optional()
    .or(z.literal('')),
})

// ─────────────────────────────────────────────────────────────────────────────
// Aria — variation textuelle d'un thème (anti-monotonie cycle 6 sem)
// ─────────────────────────────────────────────────────────────────────────────
export async function generateAriaVariation(rituel: RituelRow): Promise<string | null> {
  const system = `Tu es ${AI_NAME}, l'assistante de ${APP_NAME}. Tu génères 1 phrase courte (15 à 25 mots) qui réinvente l'intention d'un rituel hebdomadaire collectif. Style: poétique, calme, jamais corporate, jamais "tu dois". Pas de emoji. Pas de guillemets. Pas de markdown. Réponds uniquement la phrase, rien d'autre.`
  const user = `Thème de cette semaine : « ${rituel.theme_label} »\nIntention canonique : ${rituel.intention}\n\nGénère une variante fraîche pour la semaine ISO ${rituel.week_iso}.`
  try {
    const text = await askAria(system, user, { model: MODEL_FAST, maxTokens: 200 })
    const cleaned = text.replace(/^["«»\s]+|["«»\s]+$/g, '').trim()
    if (cleaned.length < 10 || cleaned.length > 300) return null
    return cleaned
  } catch (e) {
    console.error('[rituels] generateAriaVariation failed', e instanceof Error ? e.message : e)
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de date (lundi 00:00 UTC = début semaine ISO)
// ─────────────────────────────────────────────────────────────────────────────
export function startOfWeekUtc(d: Date): Date {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const day = x.getUTCDay() // 0 dimanche → 6 samedi
  // Lundi = 1. Si dimanche (0), reculer 6 jours; sinon reculer (day-1)
  const diff = day === 0 ? 6 : day - 1
  x.setUTCDate(x.getUTCDate() - diff)
  x.setUTCHours(0, 0, 0, 0)
  return x
}

export function formatCountdownFR(target: Date, now = new Date()): string {
  const diffMs = target.getTime() - now.getTime()
  if (diffMs <= 0) return 'maintenant'
  const sec = Math.floor(diffMs / 1000)
  const day = Math.floor(sec / 86400)
  const hour = Math.floor((sec % 86400) / 3600)
  const min = Math.floor((sec % 3600) / 60)
  if (day > 0) return `dans ${day}j ${hour}h`
  if (hour > 0) return `dans ${hour}h ${min}min`
  if (min > 0) return `dans ${min}min`
  return 'dans quelques secondes'
}

export const THEME_VISUAL: Record<RituelThemeSlug, { gradient: string; emoji: string; tone: string }> = {
  depollution: { gradient: 'from-emerald-500/30 to-cyan-400/20', emoji: '🌿', tone: 'emerald' },
  paix: { gradient: 'from-sky-500/30 to-violet-400/20', emoji: '🕊️', tone: 'sky' },
  amour: { gradient: 'from-rose-500/30 to-pink-400/20', emoji: '❤️', tone: 'rose' },
  pardon: { gradient: 'from-violet-500/30 to-fuchsia-400/20', emoji: '🤍', tone: 'violet' },
  gratitude: { gradient: 'from-amber-500/30 to-yellow-400/20', emoji: '🙏', tone: 'amber' },
  abondance: { gradient: 'from-yellow-500/30 to-amber-400/20', emoji: '✨', tone: 'yellow' },
}
