/**
 * Lib IMPACT — agrégations transparentes des contributions personnelles + collectives.
 *
 * Sources de données :
 *   - fil_de_vie.impact_data (jsonb : kg_dechets, arbres, l_eau, personnes)
 *   - mission_completions (status='approved' → catégorie + reward_points)
 *   - cagnotte_contributions (status='succeeded' → cents donnés)
 *   - impact_global (cumul mondial maintenu par triggers)
 *   - profiles.purama_points + purama_points_lifetime
 *
 * Aucune donnée nominative cross-user n'est exposée — l'agrégation collective
 * est anonyme par construction (compteurs cumulés, pas de userId).
 */
import { createServiceClient } from './supabase'

export interface PersonalImpact {
  // Agrégats fil_de_vie
  kg_dechets: number
  arbres: number
  l_eau: number
  personnes: number
  // Compteurs catégoriels
  total_actions: number
  total_missions_approved: number
  total_cagnottes_contributed: number
  total_cagnottes_created: number
  total_cercles_joined: number
  // €/Points
  total_donated_cents: number     // cumul cents donnés en cagnottes
  total_points_earned: number     // lifetime
  total_points_balance: number    // solde courant
  // Score
  score_humanite: number
  // Méta
  member_since: string | null
  fil_de_vie_count: number
}

export interface CollectiveImpact {
  // Mondial (impact_global table)
  total_collected_cents: number
  total_redistributed_cents: number
  cagnottes_active: number
  cagnottes_completed: number
  contributors_unique: number
  kg_dechets: number
  arbres: number
  l_eau: number
  personnes: number
  // Compteurs supplémentaires en live
  total_users: number
  total_missions_completed_global: number
  total_aria_messages: number
  updated_at: string
}

export interface YearlyReportData {
  year: number
  user_id: string
  user_name: string | null
  user_email: string
  member_since: string | null
  // Métriques
  actions_count: number
  missions_approved: number
  cagnottes_contributed: number
  cagnottes_created: number
  cercles_joined: number
  total_donated_cents: number
  points_earned_year: number
  // Impact écologique cumulé année
  kg_dechets: number
  arbres: number
  l_eau: number
  personnes: number
  // Top 5 actions de l'année (timeline)
  highlights: Array<{
    date: string
    action_type: string
    action_label: string
  }>
  generated_at: string
}

/** Cumul personnel d'un user (lifetime). */
export async function getPersonalImpact(userId: string): Promise<PersonalImpact> {
  const service = createServiceClient()

  const [profileResult, fdvResult, missionsResult, contribsResult, cagnottesResult, cerclesResult] = await Promise.all([
    service
      .from('profiles')
      .select('full_name, score_humanite, fil_de_vie_count, purama_points, purama_points_lifetime, created_at')
      .eq('id', userId)
      .maybeSingle(),
    service.from('fil_de_vie').select('impact_data, action_type').eq('user_id', userId),
    service
      .from('mission_completions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'approved'),
    service
      .from('cagnotte_contributions')
      .select('amount_cents')
      .eq('contributor_id', userId)
      .eq('status', 'succeeded'),
    service.from('cagnottes').select('id', { count: 'exact', head: true }).eq('owner_id', userId),
    service.from('cercle_membres').select('id', { count: 'exact', head: true }).eq('user_id', userId),
  ])

  const profile = profileResult.data ?? null
  const fdv = fdvResult.data ?? []
  const totals = fdv.reduce(
    (acc, e) => {
      const d = (e.impact_data ?? {}) as Record<string, number | undefined>
      return {
        kg_dechets: acc.kg_dechets + (d.kg_dechets ?? 0),
        arbres: acc.arbres + (d.arbres ?? 0),
        l_eau: acc.l_eau + (d.l_eau ?? 0),
        personnes: acc.personnes + (d.personnes ?? 0),
      }
    },
    { kg_dechets: 0, arbres: 0, l_eau: 0, personnes: 0 }
  )

  const totalDonatedCents = (contribsResult.data ?? []).reduce(
    (sum, c) => sum + (c.amount_cents ?? 0),
    0
  )

  return {
    ...totals,
    total_actions: fdv.length,
    total_missions_approved: missionsResult.count ?? 0,
    total_cagnottes_contributed: contribsResult.data?.length ?? 0,
    total_cagnottes_created: cagnottesResult.count ?? 0,
    total_cercles_joined: cerclesResult.count ?? 0,
    total_donated_cents: totalDonatedCents,
    total_points_earned: profile?.purama_points_lifetime ?? 0,
    total_points_balance: profile?.purama_points ?? 0,
    score_humanite: Number(profile?.score_humanite ?? 5),
    member_since: profile?.created_at ?? null,
    fil_de_vie_count: profile?.fil_de_vie_count ?? 0,
  }
}

/** Cumul mondial KOSHA (anonyme par construction). */
export async function getCollectiveImpact(): Promise<CollectiveImpact> {
  const service = createServiceClient()

  const [globalResult, usersResult, missionsResult, ariaResult] = await Promise.all([
    service
      .from('impact_global')
      .select('total_collected_cents, total_redistributed_cents, cagnottes_active, cagnottes_completed, contributors_unique, kg_dechets, arbres, l_eau, personnes, updated_at')
      .eq('id', 1)
      .maybeSingle(),
    service.from('profiles').select('id', { count: 'exact', head: true }),
    service
      .from('mission_completions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved'),
    service.from('aria_messages').select('id', { count: 'exact', head: true }).eq('role', 'assistant'),
  ])

  const g = globalResult.data ?? {
    total_collected_cents: 0,
    total_redistributed_cents: 0,
    cagnottes_active: 0,
    cagnottes_completed: 0,
    contributors_unique: 0,
    kg_dechets: 0,
    arbres: 0,
    l_eau: 0,
    personnes: 0,
    updated_at: new Date().toISOString(),
  }

  return {
    total_collected_cents: g.total_collected_cents,
    total_redistributed_cents: g.total_redistributed_cents,
    cagnottes_active: g.cagnottes_active,
    cagnottes_completed: g.cagnottes_completed,
    contributors_unique: g.contributors_unique,
    kg_dechets: g.kg_dechets,
    arbres: g.arbres,
    l_eau: g.l_eau,
    personnes: g.personnes,
    total_users: usersResult.count ?? 0,
    total_missions_completed_global: missionsResult.count ?? 0,
    total_aria_messages: ariaResult.count ?? 0,
    updated_at: g.updated_at,
  }
}

/**
 * Rapport annuel personnel pour une année donnée.
 * Pas de calcul calendaire compliqué : on filtre fil_de_vie + mission_completions
 * + cagnotte_contributions par year via created_at.
 */
export async function getYearlyReport(userId: string, year: number): Promise<YearlyReportData> {
  if (year < 2025 || year > new Date().getFullYear() + 1) {
    throw new Error(`Année invalide : ${year}`)
  }

  const service = createServiceClient()
  const yearStart = `${year}-01-01T00:00:00Z`
  const yearEnd = `${year + 1}-01-01T00:00:00Z`

  const [profileResult, userInfoResult, fdvResult, missionsResult, contribsResult, cagnottesResult, cerclesResult, pointsResult] = await Promise.all([
    service.from('profiles').select('full_name, created_at').eq('id', userId).maybeSingle(),
    service.from('profiles').select('email').eq('id', userId).maybeSingle(),
    service
      .from('fil_de_vie')
      .select('action_type, action_label, impact_data, created_at')
      .eq('user_id', userId)
      .gte('created_at', yearStart)
      .lt('created_at', yearEnd)
      .order('created_at', { ascending: false }),
    service
      .from('mission_completions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'approved')
      .gte('created_at', yearStart)
      .lt('created_at', yearEnd),
    service
      .from('cagnotte_contributions')
      .select('amount_cents')
      .eq('contributor_id', userId)
      .eq('status', 'succeeded')
      .gte('created_at', yearStart)
      .lt('created_at', yearEnd),
    service
      .from('cagnottes')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', userId)
      .gte('created_at', yearStart)
      .lt('created_at', yearEnd),
    service
      .from('cercle_membres')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('joined_at', yearStart)
      .lt('joined_at', yearEnd),
    service
      .from('purama_point_transactions')
      .select('amount')
      .eq('user_id', userId)
      .gt('amount', 0)
      .gte('created_at', yearStart)
      .lt('created_at', yearEnd),
  ])

  const fdv = fdvResult.data ?? []
  const totals = fdv.reduce(
    (acc, e) => {
      const d = (e.impact_data ?? {}) as Record<string, number | undefined>
      return {
        kg_dechets: acc.kg_dechets + (d.kg_dechets ?? 0),
        arbres: acc.arbres + (d.arbres ?? 0),
        l_eau: acc.l_eau + (d.l_eau ?? 0),
        personnes: acc.personnes + (d.personnes ?? 0),
      }
    },
    { kg_dechets: 0, arbres: 0, l_eau: 0, personnes: 0 }
  )

  const pointsEarnedYear = (pointsResult.data ?? []).reduce((sum, t) => sum + Number(t.amount ?? 0), 0)
  const totalDonatedCents = (contribsResult.data ?? []).reduce((sum, c) => sum + (c.amount_cents ?? 0), 0)

  return {
    year,
    user_id: userId,
    user_name: profileResult.data?.full_name ?? null,
    user_email: userInfoResult.data?.email ?? '',
    member_since: profileResult.data?.created_at ?? null,
    actions_count: fdv.length,
    missions_approved: missionsResult.count ?? 0,
    cagnottes_contributed: contribsResult.data?.length ?? 0,
    cagnottes_created: cagnottesResult.count ?? 0,
    cercles_joined: cerclesResult.count ?? 0,
    total_donated_cents: totalDonatedCents,
    points_earned_year: pointsEarnedYear,
    ...totals,
    highlights: fdv.slice(0, 5).map((e) => ({
      date: e.created_at,
      action_type: e.action_type,
      action_label: e.action_label,
    })),
    generated_at: new Date().toISOString(),
  }
}
