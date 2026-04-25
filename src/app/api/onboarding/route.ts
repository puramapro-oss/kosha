import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { logFilDeVie } from '@/lib/fil-de-vie'

export const runtime = 'nodejs'

const Body = z.object({
  q1_motivation: z.enum(['aider', 'gagner', 'apprendre', 'rencontrer']),
  q2_priorite: z.enum(['argent', 'impact', 'communaute', 'apaisement']),
  q3_disponibilite: z.enum(['5min', '15min', '30min', 'flow']),
})

export async function POST(req: NextRequest) {
  // Auth check (V7.2 §1 API BULLETPROOF)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // Input validation Zod
  let body
  try {
    body = Body.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Réponses invalides' }, { status: 400 })
  }

  const service = createServiceClient()

  // Upsert onboarding response
  const { error: insertError } = await service
    .from('onboarding_responses')
    .upsert(
      {
        user_id: user.id,
        q1_motivation: body.q1_motivation,
        q2_priorite: body.q2_priorite,
        q3_disponibilite: body.q3_disponibilite,
      },
      { onConflict: 'user_id' }
    )

  if (insertError) {
    console.error('[onboarding] insert error', insertError.message)
    return NextResponse.json({ error: 'Impossible de sauvegarder. Réessaie.' }, { status: 500 })
  }

  // Mark profile as onboarded
  await service.from('profiles').update({ onboarding_completed: true }).eq('id', user.id)

  // Log first Fil de Vie entry (immutable)
  await logFilDeVie({
    userId: user.id,
    actionType: 'onboarding_completed',
    actionLabel: 'Premier pas dans KOSHA',
    impact: { personnes: 1 }, // toi-même, c'est déjà ça
  })

  return NextResponse.json({ ok: true })
}
