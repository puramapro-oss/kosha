/**
 * POST /api/aria/fraud-check
 * Calcule le score d'arnaque (0-100) d'une cagnotte via Aria (Haiku rapide).
 * Persiste ai_score_arnaque + ai_score_reason. Si > 70 → status='frozen'.
 * Appelé soit après création (interne), soit par admin manuellement.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { askAriaJSON, MODEL_FAST } from '@/lib/claude'

export const runtime = 'nodejs'
export const maxDuration = 20

const Body = z.object({
  cagnotte_id: z.string().uuid(),
})

interface FraudResult {
  score: number
  reasons: string[]
  recommendation: 'approve' | 'review' | 'freeze'
}

const SYSTEM = `Tu es un détecteur de fraude pour cagnottes solidaires KOSHA.
Score 0-100 (0 = sûr, 100 = arnaque évidente).
Indices : urgence excessive ("URGENT URGENT"), demande d'argent vague, pas de preuves, IBAN externe demandé en commentaire, montants ronds suspects, identité douteuse, fautes en masse, copy-paste générique, langue de bois.
Réponds UNIQUEMENT en JSON valide : { "score": 0-100, "reasons": ["raison 1", "raison 2"], "recommendation": "approve" | "review" | "freeze" }
- score < 30 = approve
- score 30-69 = review
- score >= 70 = freeze (auto-gel)`

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let body
  try {
    body = Body.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Données invalides.' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data: cagnotte, error } = await service
    .from('cagnottes')
    .select('id, owner_id, type, title, description, target_amount_cents')
    .eq('id', body.cagnotte_id)
    .maybeSingle()

  if (error || !cagnotte) return NextResponse.json({ error: 'Cagnotte introuvable.' }, { status: 404 })

  // Owner peut auto-vérifier ; super_admin peut tout vérifier
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (cagnotte.owner_id !== user.id && profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }

  const userMessage = `Analyse cette cagnotte:
Type: ${cagnotte.type}
Titre: ${cagnotte.title}
Description: ${cagnotte.description}
Montant cible: ${(cagnotte.target_amount_cents as number) / 100}€

Renvoie le score d'arnaque, les raisons, et la recommandation.`

  let result: FraudResult
  try {
    result = await askAriaJSON<FraudResult>(SYSTEM, userMessage, { model: MODEL_FAST, maxTokens: 512 })
  } catch (e) {
    console.error('[aria/fraud-check] failed', e)
    return NextResponse.json({ error: 'Vérification IA indisponible. Réessaie plus tard.' }, { status: 503 })
  }

  const score = Math.max(0, Math.min(100, Math.round(result.score)))
  const recommendation: FraudResult['recommendation'] =
    result.recommendation && ['approve', 'review', 'freeze'].includes(result.recommendation)
      ? result.recommendation
      : score >= 70
        ? 'freeze'
        : score >= 30
          ? 'review'
          : 'approve'

  // Persiste sur cagnotte
  await service
    .from('cagnottes')
    .update({
      ai_score_arnaque: score,
      ai_score_reason: (result.reasons ?? []).join(' • ').slice(0, 1000),
      status: recommendation === 'freeze' ? 'frozen' : undefined,
    })
    .eq('id', cagnotte.id)

  // Log fraud_signal si freeze
  if (recommendation === 'freeze') {
    await service.from('fraud_signals').insert({
      cagnotte_id: cagnotte.id,
      reporter_id: null,
      signal_type: 'ai_detected',
      severity: Math.min(10, Math.max(1, Math.round(score / 10))),
      reason: `Aria score ${score}/100 — ${(result.reasons ?? []).join(' • ').slice(0, 400)}`,
      details: { model: MODEL_FAST, recommendation, raw_score: score },
    })
  }

  return NextResponse.json({ score, reasons: result.reasons ?? [], recommendation })
}
