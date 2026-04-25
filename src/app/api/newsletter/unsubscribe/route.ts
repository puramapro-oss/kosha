/**
 * GET  /api/newsletter/unsubscribe?token=XXX → set subscribed=FALSE + 302 vers /u/XXX (page confirmation)
 * POST /api/newsletter/unsubscribe?token=XXX → idem mais retourne JSON {ok:true} (List-Unsubscribe One-Click)
 *
 * Public (pas d'auth — clic depuis email).
 */
import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { APP_URL } from '@/lib/constants'

export const runtime = 'nodejs'
export const maxDuration = 10

async function unsubscribeByToken(token: string): Promise<{ ok: boolean; reason?: string }> {
  if (!token || token.length < 16 || token.length > 80) {
    return { ok: false, reason: 'invalid_token' }
  }
  const service = createServiceClient()
  const { data, error } = await service
    .from('newsletter_subscribers')
    .update({
      subscribed: false,
      unsubscribed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('unsubscribe_token', token)
    .select('user_id')
  if (error) {
    return { ok: false, reason: 'db_error' }
  }
  if (!data || data.length === 0) {
    return { ok: false, reason: 'token_not_found' }
  }
  return { ok: true }
}

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token') ?? ''
  const result = await unsubscribeByToken(token)
  // Toujours rediriger vers la page confirmation, même si token invalide (anti-énumération)
  return NextResponse.redirect(
    `${APP_URL}/u/${encodeURIComponent(token).slice(0, 80)}?ok=${result.ok ? '1' : '0'}`,
    { status: 302 }
  )
}

export async function POST(req: NextRequest) {
  // RFC 8058 List-Unsubscribe One-Click — body peut contenir "List-Unsubscribe=One-Click"
  const token = new URL(req.url).searchParams.get('token') ?? ''
  const result = await unsubscribeByToken(token)
  if (!result.ok) {
    return NextResponse.json({ ok: false, reason: result.reason }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}
