/**
 * GET /api/legal/my-data — export complet des données personnelles au format JSON
 * (droit à la portabilité, art. 20 RGPD ; page « Ma mémoire »). RÉELLEMENT lit les tables,
 * jamais un stub `{success:true}`.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

const EXTRA_TABLES: Array<{ table: string; userIdColumn: string }> = [
  { table: 'fil_de_vie', userIdColumn: 'user_id' },
  { table: 'score_humanite_history', userIdColumn: 'user_id' },
  { table: 'universe_personnel', userIdColumn: 'user_id' },
  { table: 'onboarding_responses', userIdColumn: 'user_id' },
  { table: 'purama_point_transactions', userIdColumn: 'user_id' },
  { table: 'mission_completions', userIdColumn: 'user_id' },
  { table: 'cagnottes', userIdColumn: 'owner_id' },
  { table: 'cagnotte_contributions', userIdColumn: 'contributor_id' },
  { table: 'argent_memoire', userIdColumn: 'from_user_id' },
  { table: 'posts', userIdColumn: 'author_id' },
  { table: 'reactions', userIdColumn: 'user_id' },
  { table: 'cercle_membres', userIdColumn: 'user_id' },
  { table: 'silence_mode', userIdColumn: 'user_id' },
  { table: 'aria_conversations', userIdColumn: 'user_id' },
  { table: 'aria_messages', userIdColumn: 'user_id' },
  { table: 'aria_user_memory', userIdColumn: 'user_id' },
  { table: 'aria_actions_log', userIdColumn: 'user_id' },
  { table: 'rituel_participations', userIdColumn: 'user_id' },
  { table: 'newsletter_subscribers', userIdColumn: 'user_id' },
]

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })

  const [{ data: profile }, { data: acceptances }, { data: cookieConsent }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('legal_acceptances').select('doc_type, version, accepted_at').eq('user_id', user.id),
    supabase.from('cookie_consents').select('*').eq('user_id', user.id).maybeSingle(),
  ])

  const extra: Record<string, unknown> = {}
  for (const { table, userIdColumn } of EXTRA_TABLES) {
    const { data } = await supabase.from(table).select('*').eq(userIdColumn, user.id)
    extra[table] = data ?? []
  }

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    compte: { id: user.id, email: user.email, createdAt: user.created_at },
    profile: profile ?? null,
    acceptationsLegales: acceptances ?? [],
    consentementCookies: cookieConsent ?? null,
    ...extra,
  }

  return new NextResponse(JSON.stringify(exportPayload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="mes-donnees.json"',
    },
  })
}
