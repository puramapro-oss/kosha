/**
 * GET  /api/aria/conversations  → liste les conversations non-archivées du user
 * POST /api/aria/conversations  → crée une nouvelle conversation vide
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const service = createServiceClient()
  const { data, error } = await service
    .from('aria_conversations')
    .select('id, title, last_message_at, created_at')
    .eq('user_id', user.id)
    .eq('archived', false)
    .order('last_message_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: 'Impossible de charger tes conversations.' }, { status: 500 })
  }

  return NextResponse.json({ conversations: data ?? [] })
}

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const service = createServiceClient()
  const { data, error } = await service
    .from('aria_conversations')
    .insert({ user_id: user.id })
    .select('id, title, last_message_at, created_at')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Impossible de créer la conversation.' }, { status: 500 })
  }

  return NextResponse.json({ conversation: data })
}
