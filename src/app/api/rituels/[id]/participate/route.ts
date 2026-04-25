/**
 * POST /api/rituels/[id]/participate
 * Auth requise. Body : { intention_text?: string }
 * - vérifie que le rituel est en cours (state=live)
 * - anti-double via UNIQUE (rituel_id, user_id) + check explicite
 * - trigger SQL crédite +30 Points + insère fil_de_vie + bump participants_count
 */
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { participateSchema, rituelState, type RituelRow } from '@/lib/rituels'

export const runtime = 'nodejs'
export const maxDuration = 15

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let body: { intention_text?: string }
  try {
    body = participateSchema.parse(await req.json().catch(() => ({})))
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Données invalides'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const service = createServiceClient()

  // 1) Charger le rituel
  const { data: rituel, error: rErr } = await service
    .from('rituels_calendar')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (rErr || !rituel) {
    return NextResponse.json({ error: 'Rituel introuvable.' }, { status: 404 })
  }

  // 2) Doit être live
  const state = rituelState(rituel as RituelRow)
  if (state !== 'live') {
    const reason = state === 'upcoming' ? "Ce rituel n'a pas encore commencé." : 'Ce rituel est terminé.'
    return NextResponse.json({ error: reason, state }, { status: 409 })
  }

  // 3) Anti-double check explicite (avant l'INSERT pour message FR plus clair)
  const { data: existing } = await service
    .from('rituel_participations')
    .select('id, points_awarded, intention_text, participated_at')
    .eq('rituel_id', id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (existing) {
    return NextResponse.json(
      {
        error: 'Tu participes déjà à ce rituel cette semaine. Reviens lundi pour le prochain.',
        already_participated: true,
        participation: existing,
      },
      { status: 409 }
    )
  }

  // 4) Insert (le trigger fait le reste)
  const intention = body.intention_text?.trim() || null
  const { data: created, error: insErr } = await service
    .from('rituel_participations')
    .insert({
      rituel_id: id,
      user_id: user.id,
      intention_text: intention,
      // points_awarded laissé à DEFAULT 30
    })
    .select('id, rituel_id, intention_text, points_awarded, participated_at')
    .single()

  if (insErr || !created) {
    // 23505 = unique violation (race condition entre check et insert)
    if (insErr?.code === '23505') {
      return NextResponse.json(
        { error: 'Tu participes déjà à ce rituel cette semaine.', already_participated: true },
        { status: 409 }
      )
    }
    console.error('[rituels/participate] insert failed', insErr?.message)
    return NextResponse.json(
      { error: "Impossible d'enregistrer ta participation. Réessaie dans un instant." },
      { status: 500 }
    )
  }

  // 5) Re-lire le compte mis à jour pour réponse instantanée
  const { data: updated } = await service
    .from('rituels_calendar')
    .select('participants_count')
    .eq('id', id)
    .single()

  return NextResponse.json({
    ok: true,
    participation: created,
    participants_count: updated?.participants_count ?? null,
  })
}
