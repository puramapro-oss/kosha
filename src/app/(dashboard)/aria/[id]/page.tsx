import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import AriaChatClient from '@/components/AriaChatClient'

export const dynamic = 'force-dynamic'

interface AriaConvPageProps {
  params: Promise<{ id: string }>
}

export default async function AriaConversationPage({ params }: AriaConvPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/aria/${id}`)

  const service = createServiceClient()
  const { data: conv } = await service
    .from('aria_conversations')
    .select('id, title, user_id, archived')
    .eq('id', id)
    .maybeSingle()

  if (!conv || conv.user_id !== user.id) notFound()

  const { data: msgs } = await service
    .from('aria_messages')
    .select('id, role, content, model, created_at')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })
    .limit(200)

  const initialMessages = (msgs ?? []).filter((m) => m.role === 'user' || m.role === 'assistant') as Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
    model: string | null
    created_at: string
  }>

  return (
    <AriaChatClient
      conversationId={id}
      initialTitle={conv.title}
      initialMessages={initialMessages}
      archived={conv.archived}
    />
  )
}
