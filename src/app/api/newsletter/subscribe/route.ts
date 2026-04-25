/**
 * POST /api/newsletter/subscribe
 * Body : { subscribed: boolean }
 * Auth requise. Toggle l'abonnement de l'utilisateur connecté.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'

export const runtime = 'nodejs'
export const maxDuration = 10

const schema = z.object({
  subscribed: z.boolean(),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let body: { subscribed: boolean }
  try {
    body = schema.parse(await req.json())
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Données invalides'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const service = createServiceClient()
  const patch: Record<string, unknown> = {
    subscribed: body.subscribed,
    updated_at: new Date().toISOString(),
  }
  if (body.subscribed) {
    patch.unsubscribed_at = null
  } else {
    patch.unsubscribed_at = new Date().toISOString()
  }

  const { data, error } = await service
    .from('newsletter_subscribers')
    .upsert({ user_id: user.id, ...patch }, { onConflict: 'user_id' })
    .select('subscribed, unsubscribe_token, last_sent_at')
    .single()

  if (error) {
    console.error('[newsletter/subscribe] upsert failed', error.message)
    return NextResponse.json({ error: 'Mise à jour impossible' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, subscriber: data })
}
