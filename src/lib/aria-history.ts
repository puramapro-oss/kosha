import type { createServiceClient } from './supabase'

type Turn = { role: 'user' | 'assistant'; content: string }

/** Réserve la dernière des 40 places au message de cette requête. */
export async function getAriaHistory(
  client: Pick<ReturnType<typeof createServiceClient>, 'from'>,
  conversationId: string,
  currentMessage: string,
): Promise<Turn[] | null> {
  const { data, error } = await client
    .from('aria_messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .in('role', ['user', 'assistant'])
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(39)
    .returns<Turn[]>()

  if (error || !data) return null
  return [...data.reverse(), { role: 'user', content: currentMessage }]
}
