/**
 * POST /api/cron/rituels-tick
 * Authorization: Bearer ${CRON_SECRET}
 * Idempotent. Appelé chaque lundi 00:05 UTC par n8n :
 * - ensure_rituels_calendar(8) seed les 8 prochaines semaines
 * - regénère 1 variation Aria pour les 2 rituels les plus proches sans variation_text
 */
import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { generateAriaVariation, type RituelRow } from '@/lib/rituels'

export const runtime = 'nodejs'
export const maxDuration = 60

interface CalendarRow {
  out_week_iso: string
  out_theme_index: number
  out_created: boolean
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') || ''
  const expected = `Bearer ${process.env.CRON_SECRET || ''}`
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()

  // 1) Ensure 8 prochaines semaines
  const { data: ensured, error: eErr } = await service.rpc('ensure_rituels_calendar', { weeks_ahead: 8 })
  if (eErr) {
    console.error('[cron/rituels-tick] ensure_rituels_calendar failed', eErr.message)
    return NextResponse.json({ error: 'ensure_rituels_calendar failed', detail: eErr.message }, { status: 500 })
  }
  const created = (ensured ?? []) as CalendarRow[]
  const newlyCreatedCount = created.filter((r) => r.out_created).length

  // 2) Variations Aria pour les 2 rituels à venir sans variation_text
  const nowIso = new Date().toISOString()
  const { data: needVar } = await service
    .from('rituels_calendar')
    .select('*')
    .gte('starts_at_utc', nowIso)
    .is('variation_text', null)
    .order('starts_at_utc', { ascending: true })
    .limit(2)

  let variationsGenerated = 0
  for (const rituel of (needVar ?? []) as RituelRow[]) {
    const variation = await generateAriaVariation(rituel)
    if (variation) {
      await service
        .from('rituels_calendar')
        .update({ variation_text: variation })
        .eq('id', rituel.id)
      variationsGenerated++
    }
  }

  return NextResponse.json({
    ok: true,
    weeks_ensured: created.length,
    weeks_newly_created: newlyCreatedCount,
    variations_generated: variationsGenerated,
    timestamp: new Date().toISOString(),
  })
}
