/**
 * POST /api/posts/create
 * Crée un post après modération Aria.
 *   < 30  → published direct
 *   30-69 → pending_review (caché du feed public, l'auteur peut quand même le voir)
 *   ≥ 70  → blocked + raison expliquée à l'auteur
 *
 * Anti-spam : 10 posts max par user dans les dernières 60 min.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { PostCreateSchema } from '@/lib/posts'
import { moderatePost } from '@/lib/moderation'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let body
  try {
    body = PostCreateSchema.parse(await req.json())
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Données invalides'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const service = createServiceClient()

  // Anti-spam : 10 posts / 60 min
  const sinceIso = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count } = await service
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', user.id)
    .gte('created_at', sinceIso)
  if ((count ?? 0) >= 10) {
    return NextResponse.json(
      { error: 'Tu as déjà publié 10 fois dans la dernière heure. Laisse l\'espace respirer un peu.' },
      { status: 429 }
    )
  }

  // Si cercle_id fourni, vérifier que l'user en est membre
  if (body.cercle_id) {
    const { data: membership } = await service
      .from('cercle_membres')
      .select('user_id')
      .eq('cercle_id', body.cercle_id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!membership) {
      return NextResponse.json({ error: 'Tu n\'es pas membre de ce cercle.' }, { status: 403 })
    }
  }

  // Modération IA
  const moderation = await moderatePost(body.content, { type: body.type })

  // Insert avec status correspondant
  const { data: created, error } = await service
    .from('posts')
    .insert({
      author_id: user.id,
      cercle_id: body.cercle_id ?? null,
      content: body.content,
      type: body.type,
      media_url: body.media_url ?? null,
      status: moderation.status,
      ai_moderation_score: moderation.score,
      ai_moderation_reason: moderation.reason,
      ai_moderation_categories: moderation.categories,
    })
    .select('id, status, ai_moderation_score, ai_moderation_reason')
    .single()

  if (error || !created) {
    console.error('[posts/create] insert error', error?.message)
    return NextResponse.json({ error: 'Publication impossible. Réessaie.' }, { status: 500 })
  }

  return NextResponse.json({
    id: created.id,
    status: created.status,
    moderation: {
      score: created.ai_moderation_score,
      reason: created.ai_moderation_reason,
    },
  })
}
