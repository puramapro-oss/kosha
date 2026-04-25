/**
 * POST /api/cercles/create
 * Crée un cercle. Auto-join créateur en captain via trigger SQL.
 * Anti-spam : un user ne peut pas créer plus de 5 cercles actifs.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { CercleCreateSchema } from '@/lib/cercles'
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
    body = CercleCreateSchema.parse(await req.json())
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Données invalides'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const service = createServiceClient()

  // Anti-spam : 5 cercles actifs max par user
  const { count } = await service
    .from('cercles')
    .select('id', { count: 'exact', head: true })
    .eq('created_by', user.id)
    .eq('archived', false)
  if ((count ?? 0) >= 5) {
    return NextResponse.json(
      { error: 'Tu as déjà 5 cercles actifs. Archive-en un avant d\'en ouvrir un nouveau.' },
      { status: 429 }
    )
  }

  const { data: created, error } = await service
    .from('cercles')
    .insert({
      name: body.name,
      intention: body.intention,
      visibility: body.visibility,
      max_members: body.max_members,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error || !created) {
    console.error('[cercles/create] insert error', error?.message)
    return NextResponse.json({ error: 'Création impossible.' }, { status: 500 })
  }

  await logFilDeVie({
    userId: user.id,
    actionType: 'cercle_created',
    actionLabel: `Cercle « ${body.name.slice(0, 40)} » ouvert`,
    sourceUrl: `/cercles/${created.id}`,
    impact: { personnes: 1 },
  })

  return NextResponse.json({ id: created.id })
}
