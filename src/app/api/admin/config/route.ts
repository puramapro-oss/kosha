/**
 * GET  /api/admin/config       → liste toutes les clés admin_dynamic_config
 * POST /api/admin/config       → upsert { key, value, description? } (loggé)
 *
 * Triple check super_admin obligatoire.
 */
import { NextResponse, type NextRequest } from 'next/server'
import {
  assertSuperAdmin,
  listDynamicConfig,
  upsertDynamicConfig,
  updateConfigSchema,
  NotAdminError,
} from '@/lib/admin'

export const runtime = 'nodejs'
export const maxDuration = 15

export async function GET() {
  try {
    await assertSuperAdmin()
  } catch (e) {
    const reason = e instanceof NotAdminError ? e.reason : 'unknown'
    return NextResponse.json({ error: 'Forbidden', reason }, { status: reason === 'no_session' ? 401 : 403 })
  }
  const list = await listDynamicConfig()
  return NextResponse.json({ ok: true, items: list })
}

export async function POST(req: NextRequest) {
  let ctx
  try {
    ctx = await assertSuperAdmin()
  } catch (e) {
    const reason = e instanceof NotAdminError ? e.reason : 'unknown'
    return NextResponse.json({ error: 'Forbidden', reason }, { status: reason === 'no_session' ? 401 : 403 })
  }
  let body
  try {
    body = updateConfigSchema.parse(await req.json())
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Invalid' }, { status: 400 })
  }
  const result = await upsertDynamicConfig(ctx, body)
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? 'Upsert failed' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
