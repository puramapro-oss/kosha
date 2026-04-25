/**
 * POST   /api/cercles/[id]/membership   → join
 * DELETE /api/cercles/[id]/membership   → leave
 *
 * Trigger SQL maintient members_count + impose max.
 * fil_de_vie 'cercle_joined' via API (premier join) — cap à 1 entry par cercle/user.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { logFilDeVie } from '@/lib/fil-de-vie'

export const runtime = 'nodejs'

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id: cercleId } = await ctx.params

  const service = createServiceClient()

  // Vérifier cercle existe + pas plein
  const { data: cercle } = await service
    .from('cercles')
    .select('id, name, max_members, members_count, archived, visibility, created_by')
    .eq('id', cercleId)
    .maybeSingle()
  if (!cercle || cercle.archived) return NextResponse.json({ error: 'Cercle introuvable.' }, { status: 404 })
  if (cercle.visibility !== 'public') {
    return NextResponse.json({ error: 'Ce cercle n\'est pas ouvert publiquement.' }, { status: 403 })
  }
  if (cercle.created_by === user.id) {
    return NextResponse.json({ ok: true, alreadyMember: true })
  }
  if (Number(cercle.members_count) >= Number(cercle.max_members)) {
    return NextResponse.json({ error: 'Ce cercle est complet.' }, { status: 409 })
  }

  // Déjà membre ?
  const { data: existing } = await service
    .from('cercle_membres')
    .select('user_id')
    .eq('cercle_id', cercleId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (existing) {
    return NextResponse.json({ ok: true, alreadyMember: true })
  }

  const { error } = await service.from('cercle_membres').insert({
    cercle_id: cercleId,
    user_id: user.id,
    role: 'member',
  })
  if (error) {
    console.error('[cercles/membership] join error', error.message)
    return NextResponse.json({ error: 'Impossible de rejoindre. ' + error.message }, { status: 500 })
  }

  // Premier join de l'utilisateur ?
  const { data: prevJoins } = await service
    .from('fil_de_vie')
    .select('id')
    .eq('user_id', user.id)
    .eq('action_type', 'cercle_joined')
    .limit(1)
  if (!prevJoins || prevJoins.length === 0) {
    await logFilDeVie({
      userId: user.id,
      actionType: 'cercle_joined',
      actionLabel: `Tu as rejoint « ${(cercle.name as string).slice(0, 40)} »`,
      sourceUrl: `/cercles/${cercleId}`,
      impact: { personnes: 1 },
    })
  }

  return NextResponse.json({ ok: true, joined: true })
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id: cercleId } = await ctx.params
  const service = createServiceClient()

  const { data: cercle } = await service.from('cercles').select('id, created_by').eq('id', cercleId).maybeSingle()
  if (!cercle) return NextResponse.json({ error: 'Cercle introuvable.' }, { status: 404 })
  if (cercle.created_by === user.id) {
    return NextResponse.json({ error: 'Tu es le créateur. Tu ne peux pas quitter ton propre cercle (archive-le plutôt).' }, { status: 403 })
  }

  const { error } = await service
    .from('cercle_membres')
    .delete()
    .eq('cercle_id', cercleId)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Impossible de quitter le cercle.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true, left: true })
}
