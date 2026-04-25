import { createServiceClient } from './supabase'
import { SCORE_HUMANITE_INITIAL } from './constants'

export interface ScoreComponents {
  fiabilite: number      // 0-10
  entraide: number       // 0-10
  regularite: number     // 0-10
  impact: number         // 0-10
}

export interface ScoreHumaniteSnapshot {
  user_id: string
  date: string                              // YYYY-MM-DD
  score: number                             // 0.0-10.0
  components: ScoreComponents
  computed_at: string
}

/**
 * Récupère le score actuel + composants depuis le dernier snapshot.
 * Si pas de snapshot → retourne défaut médian.
 */
export async function getCurrentScore(userId: string): Promise<{
  score: number
  components: ScoreComponents
  fresh: boolean                             // true si snapshot du jour
}> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('score_humanite_history')
    .select('score, components, date')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data) {
    return {
      score: SCORE_HUMANITE_INITIAL,
      components: { fiabilite: 5, entraide: 5, regularite: 5, impact: 5 },
      fresh: false,
    }
  }

  const today = new Date().toISOString().slice(0, 10)
  return {
    score: Number(data.score),
    components: data.components as ScoreComponents,
    fresh: data.date === today,
  }
}

/**
 * Force un recalcul + snapshot du score (utilise les fonctions Postgres).
 * À utiliser après un événement critique (cron quotidien, action majeure).
 */
export async function recomputeScore(userId: string): Promise<{
  score: number
  components: ScoreComponents
}> {
  const supabase = createServiceClient()

  // RPC vers les fonctions Postgres
  const { data: scoreData } = await supabase.rpc('compute_score_humanite', { p_user_id: userId })
  const { data: compData } = await supabase.rpc('compute_score_components', { p_user_id: userId })

  const score = Number(scoreData ?? SCORE_HUMANITE_INITIAL)
  const components = (compData ?? { fiabilite: 5, entraide: 5, regularite: 5, impact: 5 }) as ScoreComponents

  // Update profiles + snapshot
  await supabase.from('profiles').update({ score_humanite: score }).eq('id', userId)
  await supabase.from('score_humanite_history').upsert({
    user_id: userId,
    date: new Date().toISOString().slice(0, 10),
    score,
    components,
  })

  return { score, components }
}

/**
 * Niveau d'éveil (1-10) dérivé du score.
 * BRIEF §3 module 1 : profil identitaire évolutif (niveau de conscience).
 */
export function deriveAwakeningLevel(score: number, filDeVieCount: number): number {
  if (filDeVieCount < 3) return 1
  if (score < 4) return Math.max(1, Math.floor(filDeVieCount / 5))
  if (score < 6) return Math.min(5, Math.max(2, Math.floor(filDeVieCount / 4)))
  if (score < 8) return Math.min(8, Math.max(4, Math.floor(filDeVieCount / 3)))
  return Math.min(10, Math.max(7, Math.floor(filDeVieCount / 2)))
}

/**
 * Texte explicatif transparent (BRIEF règle sacrée #3 — transparence totale).
 * Affiché à l'utilisateur sous le score.
 */
export function getScoreExplanation(score: number, components: ScoreComponents): string {
  const sorted = [
    { label: 'fiabilité', value: components.fiabilite },
    { label: 'entraide', value: components.entraide },
    { label: 'régularité', value: components.regularite },
    { label: 'impact', value: components.impact },
  ].sort((a, b) => b.value - a.value)

  const top = sorted[0]
  if (!top) return `Score ${score.toFixed(1)}/10`

  if (score < 4) {
    return `Score ${score.toFixed(1)}/10 — tes premiers pas comptent`
  }
  if (score < 7) {
    return `Score ${score.toFixed(1)}/10 — ton ${top.label} ressort (${top.value.toFixed(1)})`
  }
  return `Score ${score.toFixed(1)}/10 grâce à ton ${top.label} (${top.value.toFixed(1)})`
}
