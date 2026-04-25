/**
 * KOSHA P10 — Admin helpers (back-office Espace Pilote)
 * Triple check OBLIGATOIRE pour TOUTE action admin :
 *   1. JWT valide (auth.getUser() côté server)
 *   2. email === SUPER_ADMIN_EMAIL (constants.ts)
 *   3. profile.role === 'super_admin' (DB read)
 *
 * Tout endpoint qui MUTE quelque chose en admin DOIT logger via logAdminAction.
 */
import { z } from 'zod'
import { createClient as createServerClient } from './supabase-server'
import { createServiceClient } from './supabase'
import { SUPER_ADMIN_EMAIL } from './constants'
import type { User } from '@supabase/supabase-js'

export class NotAdminError extends Error {
  constructor(public reason: 'no_session' | 'wrong_email' | 'wrong_role') {
    super(`Not admin: ${reason}`)
  }
}

export interface AdminContext {
  user: User
  email: string
}

/**
 * À appeler en haut de chaque page/route admin. Throw NotAdminError sinon.
 * Renvoie le user authentifié pour usage downstream.
 */
export async function assertSuperAdmin(): Promise<AdminContext> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new NotAdminError('no_session')
  if (user.email !== SUPER_ADMIN_EMAIL) throw new NotAdminError('wrong_email')

  // Triple check : DB read role
  const service = createServiceClient()
  const { data: profile } = await service
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile || profile.role !== 'super_admin') {
    throw new NotAdminError('wrong_role')
  }
  return { user, email: user.email }
}

/**
 * Wrapper pratique pour les pages : retourne null si pas admin (au lieu de throw).
 */
export async function isSuperAdmin(): Promise<AdminContext | null> {
  try {
    return await assertSuperAdmin()
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// KPIs globaux (RPC vers la fonction SQL)
// ─────────────────────────────────────────────────────────────────────────────
export interface AdminKpis {
  users_total: number
  users_active_7d: number
  users_paid: number
  cagnottes_total: number
  cagnottes_completed: number
  total_donated_cents: number
  total_points_lifetime: number
  missions_completed: number
  rituels_participations: number
  newsletter_subscribed: number
  aria_messages: number
  impact_global: { kg_dechets?: number; arbres?: number; l_eau?: number; personnes?: number }
  computed_at: string
}

export async function getAdminKpis(): Promise<AdminKpis | null> {
  const service = createServiceClient()
  const { data, error } = await service.rpc('admin_kpis_global')
  if (error) {
    console.error('[admin] getAdminKpis failed', error.message)
    return null
  }
  return data as AdminKpis
}

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic config CRUD
// ─────────────────────────────────────────────────────────────────────────────
export interface ConfigEntry {
  key: string
  value: unknown
  description: string | null
  updated_by: string | null
  updated_at: string
}

export async function listDynamicConfig(): Promise<ConfigEntry[]> {
  const service = createServiceClient()
  const { data } = await service
    .from('admin_dynamic_config')
    .select('key, value, description, updated_by, updated_at')
    .order('key', { ascending: true })
  return (data ?? []) as ConfigEntry[]
}

export async function getDynamicConfig<T = unknown>(key: string, fallback: T): Promise<T> {
  const service = createServiceClient()
  const { data } = await service
    .from('admin_dynamic_config')
    .select('value')
    .eq('key', key)
    .maybeSingle()
  if (!data) return fallback
  return data.value as T
}

export const updateConfigSchema = z.object({
  key: z.string().min(2).max(100).regex(/^[a-z0-9_.-]+$/, 'clé invalide (a-z 0-9 _ . -)'),
  value: z.unknown().refine((v) => v !== undefined, 'value requis'),
  description: z.string().max(280).optional().nullable(),
})

export async function upsertDynamicConfig(
  ctx: AdminContext,
  patch: { key: string; value: unknown; description?: string | null }
): Promise<{ ok: boolean; error?: string }> {
  const service = createServiceClient()
  const { error } = await service
    .from('admin_dynamic_config')
    .upsert(
      {
        key: patch.key,
        value: patch.value,
        description: patch.description ?? null,
        updated_by: ctx.user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    )
  if (error) return { ok: false, error: error.message }

  await logAdminAction(ctx, {
    action_type: 'config_update',
    target_type: 'config_key',
    target_id: patch.key,
    payload: { value: patch.value, description: patch.description ?? null },
  })
  return { ok: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// Logging
// ─────────────────────────────────────────────────────────────────────────────
export interface AdminLogPayload {
  action_type: string
  target_type?: string
  target_id?: string
  payload?: Record<string, unknown>
}

export async function logAdminAction(ctx: AdminContext, log: AdminLogPayload): Promise<void> {
  const service = createServiceClient()
  await service.from('admin_logs').insert({
    admin_id: ctx.user.id,
    admin_email: ctx.email,
    action_type: log.action_type,
    target_type: log.target_type ?? null,
    target_id: log.target_id ?? null,
    payload: log.payload ?? null,
  })
}

export async function listAdminLogs(limit = 50): Promise<Array<{
  id: string
  admin_email: string
  action_type: string
  target_type: string | null
  target_id: string | null
  payload: unknown
  created_at: string
}>> {
  const service = createServiceClient()
  const { data } = await service
    .from('admin_logs')
    .select('id, admin_email, action_type, target_type, target_id, payload, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data ?? []) as Array<{
    id: string
    admin_email: string
    action_type: string
    target_type: string | null
    target_id: string | null
    payload: unknown
    created_at: string
  }>
}

// ─────────────────────────────────────────────────────────────────────────────
// Users search/list
// ─────────────────────────────────────────────────────────────────────────────
export interface AdminUserRow {
  id: string
  email: string | null
  full_name: string | null
  plan: string | null
  role: string | null
  score_humanite: number | null
  fil_de_vie_count: number | null
  created_at: string
}

export async function searchUsers(q: string, limit = 50): Promise<AdminUserRow[]> {
  const service = createServiceClient()
  let query = service
    .from('profiles')
    .select('id, email, full_name, plan, role, score_humanite, fil_de_vie_count, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
  const search = q.trim()
  if (search.length > 0) {
    query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
  }
  const { data } = await query
  return (data ?? []) as AdminUserRow[]
}
