/**
 * POST /api/cron/newsletter-weekly
 * Authorization: Bearer ${CRON_SECRET}
 * Idempotent (anti-doublon par UNIQUE (user_id, week_iso))
 * Lundi 09h00 Europe/Paris (n8n converti UTC).
 *
 * Boucle sur tous subscribed=TRUE, frequency='weekly', envoie via Resend, log dans newsletter_emails.
 * Limit param: ?limit=50 (défaut 200) pour limiter le batch — utile pour spread la charge Aria.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { sendWeeklyNewsletter, currentWeekIso } from '@/lib/newsletter'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') || ''
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const limit = Math.min(500, Math.max(1, Number(url.searchParams.get('limit') ?? '200')))
  const dryRun = url.searchParams.get('dry_run') === '1'

  const service = createServiceClient()
  const week = currentWeekIso()

  const { data: subs, error } = await service
    .from('newsletter_subscribers')
    .select('user_id')
    .eq('subscribed', true)
    .eq('frequency', 'weekly')
    .order('user_id', { ascending: true })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: 'load_subs_failed', detail: error.message }, { status: 500 })
  }

  if (dryRun) {
    return NextResponse.json({ ok: true, dry_run: true, week, candidates: subs?.length ?? 0 })
  }

  const results = { sent: 0, skipped: 0, errored: 0, details: [] as Array<{ user_id: string; ok: boolean; reason?: string }> }
  for (const row of subs ?? []) {
    const r = await sendWeeklyNewsletter(row.user_id, week)
    if (r.ok) {
      results.sent++
      results.details.push({ user_id: row.user_id, ok: true })
    } else if (r.skipped_reason) {
      results.skipped++
      results.details.push({ user_id: row.user_id, ok: false, reason: r.skipped_reason })
    } else {
      results.errored++
      results.details.push({ user_id: row.user_id, ok: false, reason: r.error ?? 'unknown' })
    }
  }

  return NextResponse.json({
    ok: true,
    week_iso: week,
    candidates: subs?.length ?? 0,
    sent: results.sent,
    skipped: results.skipped,
    errored: results.errored,
    details: results.details,
  })
}
