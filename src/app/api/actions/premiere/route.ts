import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { logFilDeVie } from '@/lib/fil-de-vie'

export const runtime = 'nodejs'

export async function POST(_req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  // Vérif : pas déjà fait (action_type 'profile_created' unique par user)
  const service = createServiceClient()
  const { data: existing } = await service
    .from('fil_de_vie')
    .select('id')
    .eq('user_id', user.id)
    .eq('action_type', 'profile_created')
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ ok: true, alreadyDone: true })
  }

  const result = await logFilDeVie({
    userId: user.id,
    actionType: 'profile_created',
    actionLabel: 'Tu as fait ton premier choix conscient',
    impact: { personnes: 1 },
    sourceUrl: '/actions/premiere',
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? 'Erreur' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, entry: result.entry })
}
