/**
 * POST /api/cagnottes/create
 * Crée une cagnotte. Auth + Zod + insert + fil_de_vie 'cagnotte_created'.
 * Pas de fraud-check synchrone ici (latence) — un cron ou trigger le fait après.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { CagnotteCreateSchema } from '@/lib/cagnottes'
import { logFilDeVie } from '@/lib/fil-de-vie'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let body
  try {
    body = CagnotteCreateSchema.parse(await req.json())
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Données invalides'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  // Anti-spam : pas plus de 5 cagnottes actives simultanées par user
  const service = createServiceClient()
  const { count } = await service
    .from('cagnottes')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', user.id)
    .in('status', ['active', 'frozen', 'fraud_check'])

  if ((count ?? 0) >= 5) {
    return NextResponse.json(
      { error: 'Tu as déjà 5 cagnottes actives. Termine ou annule l\'une d\'elles avant d\'en créer une nouvelle.' },
      { status: 429 }
    )
  }

  const { data: created, error } = await service
    .from('cagnottes')
    .insert({
      owner_id: user.id,
      type: body.type,
      title: body.title,
      description: body.description,
      target_amount_cents: body.target_amount_cents,
      ends_at: body.ends_at ?? null,
      geolocation_label: body.geolocation_label ?? null,
      image_url: body.image_url ?? null,
    })
    .select('id')
    .single()

  if (error || !created) {
    console.error('[cagnottes/create] insert error', error?.message)
    return NextResponse.json({ error: 'Création impossible. Réessaie.' }, { status: 500 })
  }

  await logFilDeVie({
    userId: user.id,
    actionType: 'cagnotte_created',
    actionLabel: `Cagnotte « ${body.title.slice(0, 40)}${body.title.length > 40 ? '…' : ''} » créée`,
    sourceUrl: `/cagnottes/${created.id}`,
  })

  return NextResponse.json({ id: created.id })
}
