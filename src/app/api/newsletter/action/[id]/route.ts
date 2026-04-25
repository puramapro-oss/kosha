/**
 * GET /api/newsletter/action/[id]?next=/url-relative
 * Tracker d'action — log action_taken_at + 302 redirect.
 * Public (pas d'auth — clic depuis email).
 */
import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { APP_URL } from '@/lib/constants'

export const runtime = 'nodejs'
export const maxDuration = 10

function safeNext(raw: string | null): string {
  // Anti open-redirect : on n'autorise QUE des paths internes
  if (!raw) return '/dashboard'
  try {
    const decoded = decodeURIComponent(raw)
    if (!decoded.startsWith('/') || decoded.startsWith('//')) return '/dashboard'
    if (decoded.length > 200) return '/dashboard'
    return decoded
  } catch {
    return '/dashboard'
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const url = new URL(req.url)
  const next = safeNext(url.searchParams.get('next'))

  // Validation UUID basique
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRe.test(id)) {
    const service = createServiceClient()
    // 1er click only
    await service
      .from('newsletter_emails')
      .update({ action_taken_at: new Date().toISOString() })
      .eq('id', id)
      .is('action_taken_at', null)
      .then(() => undefined, (e) => {
        console.error('[newsletter/action] track failed', e instanceof Error ? e.message : e)
      })
  }

  // Redirect — toujours, même si log échoue
  return NextResponse.redirect(`${APP_URL}${next}`, { status: 302 })
}
