/**
 * GET /api/admin/users?q=&limit=50
 * Triple check super_admin. Recherche simple par email/full_name.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { assertSuperAdmin, searchUsers, NotAdminError } from '@/lib/admin'

export const runtime = 'nodejs'
export const maxDuration = 15

export async function GET(req: NextRequest) {
  try {
    await assertSuperAdmin()
  } catch (e) {
    const reason = e instanceof NotAdminError ? e.reason : 'unknown'
    return NextResponse.json({ error: 'Forbidden', reason }, { status: reason === 'no_session' ? 401 : 403 })
  }
  const url = new URL(req.url)
  const q = url.searchParams.get('q') ?? ''
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit') ?? '50')))
  const users = await searchUsers(q, limit)
  return NextResponse.json({ ok: true, users })
}
