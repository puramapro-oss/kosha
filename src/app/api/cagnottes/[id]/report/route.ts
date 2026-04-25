/**
 * POST /api/cagnottes/[id]/report
 * Signalement communautaire d'une cagnotte (anti-fraude).
 * Si ≥ 3 signaux distincts → status='fraud_check' auto.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { CagnotteReportSchema } from '@/lib/cagnottes'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id: cagnotteId } = await ctx.params

  let body
  try {
    body = CagnotteReportSchema.parse(await req.json())
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Données invalides'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const service = createServiceClient()

  // Cagnotte existe ?
  const { data: cagnotte } = await service.from('cagnottes').select('id, owner_id').eq('id', cagnotteId).maybeSingle()
  if (!cagnotte) return NextResponse.json({ error: 'Cagnotte introuvable.' }, { status: 404 })
  if (cagnotte.owner_id === user.id) {
    return NextResponse.json({ error: 'Tu ne peux pas signaler ta propre cagnotte.' }, { status: 403 })
  }

  // Pas de double-signalement par user
  const { data: existing } = await service
    .from('fraud_signals')
    .select('id')
    .eq('cagnotte_id', cagnotteId)
    .eq('reporter_id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ ok: true, alreadyReported: true })
  }

  const { error } = await service.from('fraud_signals').insert({
    cagnotte_id: cagnotteId,
    reporter_id: user.id,
    signal_type: 'community_reported',
    severity: body.severity,
    reason: body.reason,
    details: { source: 'community' },
  })

  if (error) {
    console.error('[cagnottes/report] insert error', error.message)
    return NextResponse.json({ error: 'Signalement impossible.' }, { status: 500 })
  }

  // Compte les signaux non résolus
  const { count } = await service
    .from('fraud_signals')
    .select('id', { count: 'exact', head: true })
    .eq('cagnotte_id', cagnotteId)
    .eq('resolved', false)

  // ≥ 3 signaux distincts → fraud_check auto
  if ((count ?? 0) >= 3) {
    await service.from('cagnottes').update({ status: 'fraud_check' }).eq('id', cagnotteId)
  }

  return NextResponse.json({ ok: true, signals_count: count ?? 0, frozen: (count ?? 0) >= 3 })
}
