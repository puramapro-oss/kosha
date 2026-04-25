/**
 * POST /api/silence/update
 * Upsert le mode silence du user. Zod-validé.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { SilenceUpdateSchema } from '@/lib/silence'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let body
  try {
    body = SilenceUpdateSchema.parse(await req.json())
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Données invalides'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const service = createServiceClient()
  const { error } = await service.from('silence_mode').upsert(
    {
      user_id: user.id,
      enabled: body.enabled,
      start_hour: body.start_hour ?? null,
      end_hour: body.end_hour ?? null,
      days_of_week: body.days_of_week ?? [0, 1, 2, 3, 4, 5, 6],
      paused_until: body.paused_until ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  if (error) {
    console.error('[silence/update] upsert error', error.message)
    return NextResponse.json({ error: 'Impossible de sauvegarder.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
