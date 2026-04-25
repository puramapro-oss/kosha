/**
 * GET /api/admin/kpis
 * Triple check super_admin. Renvoie les KPIs globaux agrégés.
 */
import { NextResponse } from 'next/server'
import { assertSuperAdmin, getAdminKpis, NotAdminError } from '@/lib/admin'

export const runtime = 'nodejs'
export const maxDuration = 15

export async function GET() {
  try {
    await assertSuperAdmin()
  } catch (e) {
    const reason = e instanceof NotAdminError ? e.reason : 'unknown'
    const status = reason === 'no_session' ? 401 : 403
    return NextResponse.json({ error: 'Forbidden', reason }, { status })
  }
  const kpis = await getAdminKpis()
  if (!kpis) {
    return NextResponse.json({ error: 'KPIs unavailable' }, { status: 500 })
  }
  return NextResponse.json({ ok: true, kpis })
}
