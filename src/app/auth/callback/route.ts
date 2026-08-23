import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { CURRENT_LEGAL_VERSIONS } from '@/lib/legal/versions'
import { ACCEPTABLE_DOC_TYPES } from '@/lib/legal-config'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=auth_failed', origin))
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(new URL('/login?error=auth_failed', origin))
  }

  // Preuve d'acceptation horodatée (NIYAMA-BRIEF.md §1) — idempotent (UNIQUE user_id/doc_type).
  await supabase.from('legal_acceptances').upsert(
    ACCEPTABLE_DOC_TYPES.map((docType) => ({
      user_id: data.user.id,
      doc_type: docType,
      version: CURRENT_LEGAL_VERSIONS[docType],
      accepted_at: new Date().toISOString(),
    })),
    { onConflict: 'user_id,doc_type' }
  )

  return NextResponse.redirect(new URL(next, origin))
}
