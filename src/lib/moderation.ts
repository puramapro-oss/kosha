/**
 * KOSHA — Modération automatique des posts par Aria.
 * BRIEF règles sacrées #2 (zéro toxicité) et #4 (100% naturel, jamais agressif).
 *
 * Score 0-100 : 0 = totalement positif et constructif, 100 = toxique avéré.
 * Catégories : comparaison, FOMO, attaque_personne, haine, spam, mensonge_éclair.
 *
 * Decision :
 *   < 30  → status = 'published'           (publication immédiate)
 *   30-69 → status = 'pending_review'      (en attente, soft-banni du feed public)
 *   ≥ 70  → status = 'blocked'             (refusé, l'auteur voit pourquoi)
 */
import { askAriaJSON, MODEL_FAST } from './claude'

export type ModerationStatus = 'published' | 'pending_review' | 'blocked'

export interface ModerationResult {
  score: number
  status: ModerationStatus
  reason: string
  categories: string[]
  raw_score: number
}

const SYSTEM = `Tu es le modérateur IA de KOSHA — un réseau social inversé qui bannit toxicité, comparaison, FOMO, haine.

Score un post de 0 à 100 :
- 0 = totalement positif et constructif (gratitude, partage, célébration sincère)
- 30-50 = neutre / informationnel (OK)
- 50-69 = ambigu (mention de comparaison subtile, ton un peu agressif)
- 70-100 = toxique avéré (insulte, comparaison ouverte, FOMO, mensonge évident, attaque personne)

Catégories à détecter : comparaison, fomo, attaque_personne, haine, spam, mensonge_eclair, urgence_excessive, vente_externe.

Sois INDULGENT pour la vulnérabilité honnête (un partage de douleur n'est PAS de la toxicité — c'est même le cœur de KOSHA).
Sois STRICT pour les comparaisons négatives ("X est nul vs Y"), les insultes, les fausses promesses.

Réponds UNIQUEMENT en JSON valide :
{ "score": <int 0-100>, "reason": "<phrase courte FR pour l'auteur>", "categories": ["..."] }`

export async function moderatePost(content: string, opts: { type?: string } = {}): Promise<ModerationResult> {
  const userMessage = `Contenu (type=${opts.type ?? 'text'}) :
"""
${content.slice(0, 2000)}
"""
Score-le.`

  let raw: { score?: number; reason?: string; categories?: string[] }
  try {
    raw = await askAriaJSON<{ score?: number; reason?: string; categories?: string[] }>(SYSTEM, userMessage, {
      model: MODEL_FAST,
      maxTokens: 256,
    })
  } catch (e) {
    console.error('[moderation] Aria failed, defaulting to pending_review', e)
    return {
      score: 50,
      status: 'pending_review',
      reason: 'Modération IA temporairement indisponible. Ton post sera relu manuellement.',
      categories: ['ai_unavailable'],
      raw_score: 50,
    }
  }

  const score = Math.max(0, Math.min(100, Math.round(raw.score ?? 50)))
  const status: ModerationStatus = score < 30 ? 'published' : score < 70 ? 'pending_review' : 'blocked'
  return {
    score,
    status,
    reason: (raw.reason ?? '').slice(0, 280),
    categories: Array.isArray(raw.categories) ? raw.categories.map((c) => String(c).slice(0, 30)).slice(0, 8) : [],
    raw_score: score,
  }
}
