import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { APP_NAME, APP_SLUG } from '@/lib/constants'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const startedAt = Date.now()
  let dbOk = false
  let dbVersion: string | null = null

  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('system_status')
      .select('app_version,db_initialized_at')
      .eq('id', 1)
      .single()
    if (!error && data) {
      dbOk = true
      dbVersion = data.app_version
    }
  } catch {
    dbOk = false
  }

  return NextResponse.json({
    status: dbOk ? 'ok' : 'degraded',
    app: APP_NAME,
    slug: APP_SLUG,
    db: { ok: dbOk, version: dbVersion },
    response_time_ms: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
  }, { status: dbOk ? 200 : 503 })
}
