import { createServiceClient } from './supabase'

// Types des actions enregistrables (matche CHECK contraint SQL)
export type FilDeVieActionType =
  | 'onboarding_completed'
  | 'profile_created'
  | 'cagnotte_created'
  | 'cagnotte_contributed'
  | 'cagnotte_completed'
  | 'mission_completed'
  | 'rituel_participated'
  | 'parrain_first_payment'
  | 'cercle_created'
  | 'cercle_joined'
  | 'story_shared'
  | 'newsletter_action'
  | 'aria_first_chat'
  | 'wallet_first_withdrawal'
  | 'first_post'
  | 'reaction_given'
  | 'reaction_received'
  | 'referral_signup'
  | 'referral_subscribed'
  | 'streak_7'
  | 'streak_30'

export interface FilDeVieImpact {
  kg_dechets?: number
  arbres?: number
  l_eau?: number
  personnes?: number
}

export interface LogFilDeVieParams {
  userId: string
  actionType: FilDeVieActionType
  actionLabel: string                      // texte court visible user
  impact?: FilDeVieImpact
  sourceUrl?: string                       // lien interne
}

export interface FilDeVieEntry {
  id: string
  user_id: string
  action_type: FilDeVieActionType
  action_label: string
  impact_data: FilDeVieImpact
  source_url: string | null
  created_at: string
}

/**
 * Log une nouvelle action positive dans le Fil de Vie de l'utilisateur.
 * Le trigger SQL `after_fil_de_vie_insert` :
 *   1. incrémente profiles.fil_de_vie_count
 *   2. recalcule profiles.score_humanite
 *   3. snapshot dans score_humanite_history (upsert sur user_id+date)
 *
 * Server-side uniquement (utilise service role pour bypass RLS lorsque
 * appelé depuis API routes serveur — cas user agissant pour soi reste OK).
 *
 * BRIEF règle sacrée #5 (argent vivant) + #7 (continuité de vie irréversible).
 */
export async function logFilDeVie(params: LogFilDeVieParams): Promise<{ ok: boolean; entry?: FilDeVieEntry; error?: string }> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('fil_de_vie')
    .insert({
      user_id: params.userId,
      action_type: params.actionType,
      action_label: params.actionLabel,
      impact_data: params.impact ?? {},
      source_url: params.sourceUrl ?? null,
    })
    .select()
    .single()

  if (error) {
    return { ok: false, error: error.message }
  }
  return { ok: true, entry: data as FilDeVieEntry }
}

/**
 * Récupère les N dernières entrées du Fil de Vie d'un user.
 * RLS s'assure user ne voit que sa propre data.
 */
export async function getRecentFilDeVie(
  userId: string,
  limit = 20
): Promise<FilDeVieEntry[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('fil_de_vie')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[fil-de-vie] fetch error', error.message)
    return []
  }
  return (data ?? []) as FilDeVieEntry[]
}

/**
 * Total impact agrégé pour un user (BRIEF §3 module 6 — Conscious Action Layer).
 */
export async function getUserImpactTotals(userId: string): Promise<FilDeVieImpact> {
  const entries = await getRecentFilDeVie(userId, 1000)
  return entries.reduce<FilDeVieImpact>(
    (acc, e) => ({
      kg_dechets: (acc.kg_dechets ?? 0) + (e.impact_data?.kg_dechets ?? 0),
      arbres: (acc.arbres ?? 0) + (e.impact_data?.arbres ?? 0),
      l_eau: (acc.l_eau ?? 0) + (e.impact_data?.l_eau ?? 0),
      personnes: (acc.personnes ?? 0) + (e.impact_data?.personnes ?? 0),
    }),
    { kg_dechets: 0, arbres: 0, l_eau: 0, personnes: 0 }
  )
}

// Mapping action_type → emoji + couleur (pour timeline)
export const ACTION_VISUALS: Record<
  FilDeVieActionType,
  { emoji: string; color: string; humanLabel: string }
> = {
  onboarding_completed: { emoji: '✦', color: '#7C3AED', humanLabel: 'Premier pas' },
  profile_created: { emoji: '◇', color: '#06B6D4', humanLabel: 'Profil né' },
  cagnotte_created: { emoji: '◈', color: '#F59E0B', humanLabel: 'Cagnotte créée' },
  cagnotte_contributed: { emoji: '◉', color: '#10B981', humanLabel: 'Tu as donné' },
  mission_completed: { emoji: '▲', color: '#3B82F6', humanLabel: 'Mission accomplie' },
  rituel_participated: { emoji: '◯', color: '#EC4899', humanLabel: 'Rituel partagé' },
  parrain_first_payment: { emoji: '✧', color: '#7C3AED', humanLabel: 'Parrainage actif' },
  cercle_created: { emoji: '◐', color: '#06B6D4', humanLabel: 'Cercle ouvert' },
  cercle_joined: { emoji: '◑', color: '#06B6D4', humanLabel: 'Cercle rejoint' },
  story_shared: { emoji: '⊹', color: '#EC4899', humanLabel: 'Histoire partagée' },
  newsletter_action: { emoji: '✉', color: '#10B981', humanLabel: 'Action via newsletter' },
  aria_first_chat: { emoji: '◊', color: '#7C3AED', humanLabel: 'Premier échange Aria' },
  wallet_first_withdrawal: { emoji: '€', color: '#F59E0B', humanLabel: 'Premier retrait' },
  cagnotte_completed: { emoji: '⬢', color: '#10B981', humanLabel: 'Cagnotte atteinte' },
  first_post: { emoji: '✎', color: '#06B6D4', humanLabel: 'Première parole' },
  reaction_given: { emoji: '⟡', color: '#EC4899', humanLabel: 'Tu as soutenu' },
  reaction_received: { emoji: '⟡', color: '#EC4899', humanLabel: 'Tu as été soutenu' },
  referral_signup: { emoji: '✶', color: '#7C3AED', humanLabel: 'Filleul inscrit' },
  referral_subscribed: { emoji: '✶', color: '#10B981', humanLabel: 'Filleul abonné' },
  streak_7: { emoji: '⊛', color: '#F59E0B', humanLabel: '7 jours d\'affilée' },
  streak_30: { emoji: '⊛', color: '#F59E0B', humanLabel: '30 jours d\'affilée' },
}
