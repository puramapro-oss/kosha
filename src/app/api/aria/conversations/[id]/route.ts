/**
 * GET    /api/aria/conversations/[id]  → 1 conversation + ses messages
 * DELETE /api/aria/conversations/[id]  → archive (soft delete)
 */
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await ctx.params
  const service = createServiceClient()

  const { data: conv } = await service
    .from('aria_conversations')
    .select('id, title, last_message_at, created_at, user_id')
    .eq('id', id)
    .maybeSingle()

  if (!conv || conv.user_id !== user.id) {
    return NextResponse.json({ error: 'Conversation introuvable.' }, { status: 404 })
  }

  const { data: messages } = await service
    .from('aria_messages')
    .select('id, role, content, model, created_at')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })
    .limit(200)

  return NextResponse.json({
    conversation: { id: conv.id, title: conv.title, last_message_at: conv.last_message_at, created_at: conv.created_at },
    messages: messages ?? [],
  })
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await ctx.params
  const service = createServiceClient()

  const { data: conv } = await service.from('aria_conversations').select('user_id').eq('id', id).maybeSingle()
  if (!conv || conv.user_id !== user.id) {
    return NextResponse.json({ error: 'Conversation introuvable.' }, { status: 404 })
  }

  await service.from('aria_conversations').update({ archived: true }).eq('id', id)
  return NextResponse.json({ archived: true })
}
