/**
 * GET /api/impact → impact personnel + collectif (anonyme).
 * Authed required pour le personnel ; collectif est public.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getCollectiveImpact, getPersonalImpact } from '@/lib/impact'

export const runtime = 'nodejs'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const collective = await getCollectiveImpact()

  if (!user) {
    return NextResponse.json({ collective, personal: null })
  }

  const personal = await getPersonalImpact(user.id)
  return NextResponse.json({ collective, personal })
}
