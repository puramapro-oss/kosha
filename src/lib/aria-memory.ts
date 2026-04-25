/**
 * Mémoire cognitive persistante d'Aria.
 *
 * Aria se souvient de :
 * - Préférences ton/longueur/style
 * - Projets en cours (cagnottes ouvertes, cercles à modérer, etc.)
 * - Thèmes long terme (spiritualité, finance, santé...)
 * - État émotionnel détecté
 * - Faits factuels (prénom préféré, métier, situation)
 *
 * Le service role écrit. L'utilisateur peut lire sa propre mémoire (RLS).
 * Tout user peut faire /aria/oubli-moi → reset complet (RGPD).
 */
import { createServiceClient } from './supabase'

export interface AriaMemory {
  user_id: string
  preferences: {
    tone?: 'warm' | 'neutral' | 'concise'
    length?: 'short' | 'medium' | 'long'
    emoji?: boolean
  }
  current_projects: string[]
  long_term_themes: string[]
  emotional_state: string | null
  facts: Record<string, string | number | boolean>
  updated_at: string
}

export const EMPTY_MEMORY: Omit<AriaMemory, 'user_id' | 'updated_at'> = {
  preferences: {},
  current_projects: [],
  long_term_themes: [],
  emotional_state: null,
  facts: {},
}

/** Récupère la mémoire d'un user (crée la row si elle n'existe pas). */
export async function getUserMemory(userId: string): Promise<AriaMemory> {
  const service = createServiceClient()
  const { data } = await service
    .from('aria_user_memory')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (data) return data as AriaMemory

  // Crée une row vide
  const { data: created } = await service
    .from('aria_user_memory')
    .insert({ user_id: userId, ...EMPTY_MEMORY })
    .select('*')
    .single()
  return (created ?? { user_id: userId, ...EMPTY_MEMORY, updated_at: new Date().toISOString() }) as AriaMemory
}

export interface MemoryPatch {
  preferences?: Partial<AriaMemory['preferences']>
  add_current_projects?: string[]
  remove_current_projects?: string[]
  add_long_term_themes?: string[]
  emotional_state?: string | null
  facts?: Record<string, string | number | boolean>
}

/**
 * Patch incrémental de la mémoire — Aria peut écrire elle-même.
 * Caps : max 10 current_projects, max 8 long_term_themes, max 32 facts.
 */
export async function updateUserMemory(userId: string, patch: MemoryPatch): Promise<AriaMemory> {
  const current = await getUserMemory(userId)
  const service = createServiceClient()

  const next: Partial<AriaMemory> = {
    preferences: { ...current.preferences, ...(patch.preferences ?? {}) },
    emotional_state: patch.emotional_state !== undefined ? patch.emotional_state : current.emotional_state,
    facts: { ...current.facts, ...(patch.facts ?? {}) },
  }

  const projects = new Set(current.current_projects)
  patch.add_current_projects?.forEach((p) => projects.add(p))
  patch.remove_current_projects?.forEach((p) => projects.delete(p))
  next.current_projects = Array.from(projects).slice(0, 10)

  const themes = new Set(current.long_term_themes)
  patch.add_long_term_themes?.forEach((t) => themes.add(t))
  next.long_term_themes = Array.from(themes).slice(0, 8)

  // Cap facts à 32 entries (FIFO si dépassement)
  const factsEntries = Object.entries(next.facts ?? {})
  if (factsEntries.length > 32) {
    next.facts = Object.fromEntries(factsEntries.slice(-32))
  }

  const { data: updated } = await service
    .from('aria_user_memory')
    .update({ ...next, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select('*')
    .single()

  return (updated ?? { ...current, ...next }) as AriaMemory
}

/** Reset complet (RGPD /aria/oubli-moi). */
export async function forgetUserMemory(userId: string): Promise<void> {
  const service = createServiceClient()
  await service.from('aria_user_memory').update({ ...EMPTY_MEMORY, updated_at: new Date().toISOString() }).eq('user_id', userId)
}

/** Compose un fragment système à injecter dans le prompt Aria. */
export function memoryToSystemFragment(memory: AriaMemory): string {
  const lines: string[] = []
  if (memory.facts && Object.keys(memory.facts).length > 0) {
    const factsStr = Object.entries(memory.facts).slice(0, 10).map(([k, v]) => `${k}=${v}`).join(', ')
    lines.push(`Faits mémorisés : ${factsStr}`)
  }
  if (memory.long_term_themes.length > 0) {
    lines.push(`Thèmes récurrents : ${memory.long_term_themes.slice(0, 5).join(', ')}`)
  }
  if (memory.current_projects.length > 0) {
    lines.push(`Projets actifs : ${memory.current_projects.slice(0, 5).join(' | ')}`)
  }
  if (memory.emotional_state) {
    lines.push(`État émotionnel récent : ${memory.emotional_state}`)
  }
  if (memory.preferences.tone) lines.push(`Préfère ton : ${memory.preferences.tone}`)
  if (memory.preferences.length) lines.push(`Préfère réponses : ${memory.preferences.length}`)
  if (lines.length === 0) return ''
  return `\n\n# MÉMOIRE PERSONNELLE\n${lines.join('\n')}\nUtilise ces infos pour personnaliser ta réponse, mais sans les répéter explicitement (sauf si demandé).`
}
