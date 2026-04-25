/**
 * POST /api/aria/oubli-moi
 * RGPD : reset mémoire personnelle d'Aria + archive toutes conversations.
 * Conserve aria_actions_log (audit légal).
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { forgetUserMemory } from '@/lib/aria-memory'

export const runtime = 'nodejs'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  await forgetUserMemory(user.id)

  const service = createServiceClient()
  await service.from('aria_conversations').update({ archived: true }).eq('user_id', user.id)

  return NextResponse.json({ ok: true, message: "Aria a oublié tes infos personnelles. Tes conversations sont archivées." })
}
