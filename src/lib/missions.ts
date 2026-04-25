/**
 * Lib MISSIONS — économie circulaire KOSHA.
 * - Liste des missions actives
 * - Soumission de completion (preuve photo/texte/GPS)
 * - Validation par Aria (Haiku rapide) → auto-approve si confidence ≥ 70
 * - Trigger SQL crédite Points + Fil de Vie automatiquement
 */
import { z } from 'zod'
import { createServiceClient } from './supabase'
import { askAriaJSON, MODEL_FAST } from './claude'

export type MissionCategory = 'ecology' | 'social' | 'health' | 'knowledge' | 'creativity'
export type ProofType = 'photo' | 'text' | 'gps' | 'qr' | 'auto_health' | 'none'
export type CompletionStatus = 'pending_review' | 'approved' | 'rejected'

export interface Mission {
  id: string
  slug: string
  title: string
  description: string
  category: MissionCategory
  reward_type: 'points' | 'euros'
  reward_points: number
  reward_amount_cents: number
  proof_type: ProofType
  proof_instructions: string | null
  max_per_user: number
  max_total: number | null
  current_completions: number
  active: boolean
  icon: string | null
  color: string | null
}

export interface MissionCompletion {
  id: string
  mission_id: string
  user_id: string
  proof_url: string | null
  proof_text: string | null
  proof_gps_lat: number | null
  proof_gps_lon: number | null
  ai_confidence: number | null
  ai_reason: string | null
  status: CompletionStatus
  validated_by: 'aria' | 'admin' | 'auto' | null
  validated_at: string | null
  created_at: string
}

export const SubmitCompletionSchema = z.object({
  mission_id: z.string().uuid(),
  proof_text: z.string().min(5).max(1000).optional().nullable(),
  proof_url: z.string().url().max(500).optional().nullable(),
  proof_gps_lat: z.number().min(-90).max(90).optional().nullable(),
  proof_gps_lon: z.number().min(-180).max(180).optional().nullable(),
})

/** Liste paginée des missions actives (filtres par catégorie). */
export async function getActiveMissions(category?: MissionCategory): Promise<Mission[]> {
  const service = createServiceClient()
  let query = service
    .from('missions')
    .select('id, slug, title, description, category, reward_type, reward_points, reward_amount_cents, proof_type, proof_instructions, max_per_user, max_total, current_completions, active, icon, color')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(50)
  if (category) query = query.eq('category', category)
  const { data } = await query
  return (data ?? []) as Mission[]
}

export async function getMissionBySlug(slug: string): Promise<Mission | null> {
  const service = createServiceClient()
  const { data } = await service
    .from('missions')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle()
  return (data as Mission | null) ?? null
}

export async function getMissionById(id: string): Promise<Mission | null> {
  const service = createServiceClient()
  const { data } = await service.from('missions').select('*').eq('id', id).maybeSingle()
  return (data as Mission | null) ?? null
}

/** Combien de fois ce user a déjà complété cette mission (succès uniquement). */
export async function countUserCompletions(userId: string, missionId: string): Promise<number> {
  const service = createServiceClient()
  const { count } = await service
    .from('mission_completions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('mission_id', missionId)
    .eq('status', 'approved')
  return count ?? 0
}

interface AriaValidationResult {
  confidence: number
  reason: string
  decision: 'approve' | 'reject' | 'review'
}

/**
 * Aria valide une preuve textuelle.
 * - Si proof_type='text' : Aria juge la cohérence du texte vs la mission
 * - Si proof_type='photo' : on accepte la preuve URL (validation visuelle réelle = future Vision API)
 *   pour l'instant on demande à Aria de juger la PROBABILITÉ que le user a vraiment fait l'action
 *   à partir du texte d'accompagnement.
 *
 * Retourne confidence 0-100 + raison FR + décision.
 */
export async function validateProofWithAria(
  mission: Mission,
  proofText: string | null | undefined,
  proofUrl: string | null | undefined
): Promise<AriaValidationResult> {
  // Cas trivial : pas de preuve fournie alors qu'elle est requise
  if (mission.proof_type !== 'none' && !proofText && !proofUrl) {
    return { confidence: 0, reason: 'Aucune preuve fournie.', decision: 'reject' }
  }

  // Cas 'none' : on auto-approve sans Aria (mission gratuite type checkpoint)
  if (mission.proof_type === 'none') {
    return { confidence: 100, reason: 'Mission validée automatiquement (pas de preuve requise).', decision: 'approve' }
  }

  // Système prompt : Aria juge la cohérence
  const systemPrompt = `Tu es Aria, l'IA validatrice des missions KOSHA. Ta mission : juger si la preuve soumise par le user correspond honnêtement à la mission demandée.

Tu n'es PAS Claude. Tu es Aria.

Critères :
- COHÉRENCE : la preuve correspond-elle à la mission ?
- DÉTAIL : le user décrit-il une expérience plausible et personnelle (vs phrase générique copié-collé) ?
- HONNÊTETÉ : pas de signes évidents de mensonge ou triche
- LANGUE : tolérante au français approximatif, fautes acceptées

Sois EXIGEANT mais PAS PARANOÏAQUE — KOSHA récompense l'effort sincère, pas la perfection.

Score :
- 90-100 : preuve excellente, claire, personnelle → approve
- 70-89 : preuve correcte, plausible → approve
- 40-69 : preuve floue ou trop courte → review (envoie à humain)
- 0-39 : preuve manquante / hors sujet / mensonge évident → reject

Réponds UNIQUEMENT en JSON valide, sans backticks :
{ "confidence": 0-100, "reason": "phrase FR courte expliquant la décision", "decision": "approve" | "review" | "reject" }`

  const userMsg = `Mission : "${mission.title}"
Catégorie : ${mission.category}
Récompense : ${mission.reward_points} Points
Description : ${mission.description}
Type de preuve attendue : ${mission.proof_type}${mission.proof_instructions ? `\nInstructions : ${mission.proof_instructions}` : ''}

Preuve soumise par le user :
${proofUrl ? `- URL photo : ${proofUrl}` : ''}
${proofText ? `- Texte : "${proofText}"` : ''}

Décide :`

  try {
    const result = await askAriaJSON<{ confidence: number; reason: string; decision: 'approve' | 'review' | 'reject' }>(
      systemPrompt,
      userMsg,
      { model: MODEL_FAST, maxTokens: 400 }
    )
    // Sanity clamp
    const conf = Math.max(0, Math.min(100, Math.round(result.confidence)))
    const reason = (result.reason ?? '').slice(0, 280) || 'Aria a évalué ta soumission.'
    return { confidence: conf, reason, decision: result.decision }
  } catch (e) {
    // Fallback safe : si Aria timeout, on envoie en review humain
    return {
      confidence: 50,
      reason: "Aria n'a pas pu valider automatiquement, ta soumission est envoyée en révision.",
      decision: 'review',
    }
  }
}

/**
 * Soumet une completion : insert + valide via Aria + retourne le statut final.
 * Retourne aussi le nouveau solde Points si approved.
 */
export async function submitCompletion(opts: {
  userId: string
  missionId: string
  proofText?: string | null
  proofUrl?: string | null
  proofGpsLat?: number | null
  proofGpsLon?: number | null
}): Promise<{
  completionId: string
  status: CompletionStatus
  ai_confidence: number | null
  ai_reason: string | null
  reward_points: number
  new_balance?: number
  error?: string
}> {
  const service = createServiceClient()

  const mission = await getMissionById(opts.missionId)
  if (!mission || !mission.active) {
    return { completionId: '', status: 'rejected', ai_confidence: 0, ai_reason: 'Mission introuvable.', reward_points: 0, error: 'Mission introuvable.' }
  }

  // Cap par user
  const alreadyDone = await countUserCompletions(opts.userId, opts.missionId)
  if (alreadyDone >= mission.max_per_user) {
    return {
      completionId: '',
      status: 'rejected',
      ai_confidence: 0,
      ai_reason: `Tu as déjà complété cette mission ${mission.max_per_user} fois.`,
      reward_points: 0,
      error: `Limite atteinte : ${mission.max_per_user}× max.`,
    }
  }

  // Cap global
  if (mission.max_total !== null && mission.current_completions >= mission.max_total) {
    return {
      completionId: '',
      status: 'rejected',
      ai_confidence: 0,
      ai_reason: 'Mission complète (limite globale atteinte).',
      reward_points: 0,
      error: 'Mission complète.',
    }
  }

  // Validation Aria
  const validation = await validateProofWithAria(mission, opts.proofText, opts.proofUrl)
  let finalStatus: CompletionStatus = 'pending_review'
  let validatedBy: 'aria' | 'admin' | 'auto' | null = null
  if (validation.decision === 'approve') {
    finalStatus = 'approved'
    validatedBy = validation.confidence === 100 && mission.proof_type === 'none' ? 'auto' : 'aria'
  } else if (validation.decision === 'reject') {
    finalStatus = 'rejected'
    validatedBy = 'aria'
  } else {
    finalStatus = 'pending_review'
    validatedBy = null
  }

  // Insert (le trigger BEFORE INSERT créditera Points + fil_de_vie si approved)
  const { data: completion, error: insertErr } = await service
    .from('mission_completions')
    .insert({
      mission_id: opts.missionId,
      user_id: opts.userId,
      proof_text: opts.proofText ?? null,
      proof_url: opts.proofUrl ?? null,
      proof_gps_lat: opts.proofGpsLat ?? null,
      proof_gps_lon: opts.proofGpsLon ?? null,
      ai_confidence: validation.confidence,
      ai_reason: validation.reason,
      status: finalStatus,
      validated_by: validatedBy,
    })
    .select('id')
    .single()

  if (insertErr || !completion) {
    return { completionId: '', status: 'rejected', ai_confidence: validation.confidence, ai_reason: validation.reason, reward_points: 0, error: insertErr?.message ?? 'Erreur insertion.' }
  }

  // Si approved : récup nouveau solde Points
  let newBalance: number | undefined
  if (finalStatus === 'approved') {
    const { data: profile } = await service.from('profiles').select('purama_points').eq('id', opts.userId).single()
    newBalance = profile?.purama_points ?? 0
  }

  return {
    completionId: completion.id,
    status: finalStatus,
    ai_confidence: validation.confidence,
    ai_reason: validation.reason,
    reward_points: finalStatus === 'approved' ? mission.reward_points : 0,
    new_balance: newBalance,
  }
}

/** Historique des completions d'un user (last 50). */
export async function getUserCompletions(userId: string, limit = 50): Promise<Array<MissionCompletion & { mission_title: string; mission_slug: string }>> {
  const service = createServiceClient()
  const { data: comps } = await service
    .from('mission_completions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!comps || comps.length === 0) return []

  const missionIds = Array.from(new Set(comps.map((c) => c.mission_id)))
  const { data: missions } = await service
    .from('missions')
    .select('id, title, slug')
    .in('id', missionIds)
  const map = new Map<string, { title: string; slug: string }>()
  for (const m of missions ?? []) map.set(m.id, { title: m.title, slug: m.slug })

  return comps.map((c) => ({
    ...(c as MissionCompletion),
    mission_title: map.get(c.mission_id)?.title ?? '?',
    mission_slug: map.get(c.mission_id)?.slug ?? '',
  }))
}
