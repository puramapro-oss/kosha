/**
 * POST /api/missions/[slug]/complete
 * Body : { proof_text?, proof_url?, proof_gps_lat?, proof_gps_lon? }
 * → Validation Aria → status final
 */
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase-server'
import { getMissionBySlug, submitCompletion } from '@/lib/missions'

export const runtime = 'nodejs'
export const maxDuration = 30

const Body = z.object({
  proof_text: z.string().min(5).max(1000).optional().nullable(),
  proof_url: z.string().url().max(500).optional().nullable(),
  proof_gps_lat: z.number().min(-90).max(90).optional().nullable(),
  proof_gps_lon: z.number().min(-180).max(180).optional().nullable(),
})

export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const { slug } = await ctx.params
  const mission = await getMissionBySlug(slug)
  if (!mission) return NextResponse.json({ error: 'Mission introuvable.' }, { status: 404 })

  let body
  try {
    body = Body.parse(await req.json())
  } catch (e) {
    return NextResponse.json({ error: 'Données invalides. Vérifie ta preuve (texte 5-1000 caractères ou URL valide).' }, { status: 400 })
  }

  // Au moins une preuve si requise
  if (mission.proof_type !== 'none' && !body.proof_text && !body.proof_url) {
    return NextResponse.json({ error: 'Tu dois fournir une preuve (texte ou photo) pour cette mission.' }, { status: 400 })
  }

  const result = await submitCompletion({
    userId: user.id,
    missionId: mission.id,
    proofText: body.proof_text,
    proofUrl: body.proof_url,
    proofGpsLat: body.proof_gps_lat,
    proofGpsLon: body.proof_gps_lon,
  })

  return NextResponse.json({
    status: result.status,
    ai_confidence: result.ai_confidence,
    ai_reason: result.ai_reason,
    reward_points: result.reward_points,
    new_balance: result.new_balance,
    error: result.error,
  })
}
