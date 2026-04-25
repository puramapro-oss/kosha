/**
 * GET /api/rituels/current
 * Renvoie le rituel courant (live ou prochain), les 6 prochains, et l'état de l'user
 * (a-t-il déjà participé au rituel courant).
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getCurrentRituel, getUpcomingRituels, hasParticipated, rituelState } from '@/lib/rituels'

export const runtime = 'nodejs'
export const maxDuration = 15

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const [current, upcoming] = await Promise.all([getCurrentRituel(), getUpcomingRituels(6)])
  if (!current) {
    return NextResponse.json(
      { error: 'Aucun rituel disponible. Le calendrier sera mis à jour sous peu.' },
      { status: 503 }
    )
  }

  const state = rituelState(current)
  const userParticipated = state === 'live' ? await hasParticipated(user.id, current.id) : false

  return NextResponse.json({
    current,
    state,
    user_participated: userParticipated,
    upcoming,
  })
}
