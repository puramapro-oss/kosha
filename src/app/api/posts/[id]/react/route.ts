/**
 * POST /api/posts/[id]/react
 * Toggle d'une réaction. Body { type: 'energie'|'gratitude'|'soutien' }.
 *
 * Logique : si la réaction existe déjà → DELETE (toggle off), sinon INSERT.
 * Trigger SQL gère reactions_count + fil_de_vie.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { ReactionToggleSchema } from '@/lib/posts'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id: postId } = await ctx.params

  let body
  try {
    body = ReactionToggleSchema.parse(await req.json())
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Type de réaction invalide'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const service = createServiceClient()

  // Vérifier que le post est published
  const { data: post } = await service.from('posts').select('id, status').eq('id', postId).maybeSingle()
  if (!post || post.status !== 'published') {
    return NextResponse.json({ error: 'Ce post n\'est pas accessible.' }, { status: 404 })
  }

  // Existe ?
  const { data: existing } = await service
    .from('reactions')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .eq('type', body.type)
    .maybeSingle()

  if (existing) {
    await service.from('reactions').delete().eq('id', existing.id)
    return NextResponse.json({ ok: true, action: 'removed' })
  }

  const { error } = await service.from('reactions').insert({
    post_id: postId,
    user_id: user.id,
    type: body.type,
  })

  if (error) {
    console.error('[posts/react] insert error', error.message)
    return NextResponse.json({ error: 'Impossible d\'envoyer ta vibration.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, action: 'added' })
}
