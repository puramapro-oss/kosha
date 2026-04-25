/**
 * POST /api/aria/chat
 * Body : { conversation_id: string, message: string }
 * Réponse : Server-Sent Events stream
 *   event: token, data: "<delta>"
 *   event: done,  data: { messageId, model, tokensIn, tokensOut, title? }
 *   event: error, data: { message }
 *
 * Pipeline :
 * 1. Auth + valide conversation appartient au user
 * 2. INSERT message user
 * 3. Charge profil + mémoire + 20 derniers messages → compose system prompt
 * 4. Stream Anthropic SDK → écrit chunks SSE + assemble la réponse
 * 5. INSERT message assistant final + log aria_actions_log
 * 6. Si conversation a >=5 assistant messages et title est null → auto-génère titre Haiku
 */
import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import {
  detectComplexity,
  selectModel,
  streamAria,
  askAria,
  getAriaSystemPrompt,
  MODEL_FAST,
} from '@/lib/claude'
import { getUserMemory, memoryToSystemFragment } from '@/lib/aria-memory'

export const runtime = 'nodejs'
export const maxDuration = 60

const Body = z.object({
  conversation_id: z.string().uuid(),
  message: z.string().min(1).max(8000),
})

type AriaModelTag = 'haiku' | 'sonnet' | 'opus'
function modelTag(model: string): AriaModelTag {
  if (model.includes('haiku')) return 'haiku'
  if (model.includes('opus')) return 'opus'
  return 'sonnet'
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Non authentifié' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }

  let body: z.infer<typeof Body>
  try {
    body = Body.parse(await req.json())
  } catch (e) {
    const msg = e instanceof z.ZodError ? 'Message invalide.' : 'Corps de requête invalide.'
    return new Response(JSON.stringify({ error: msg }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  const service = createServiceClient()

  // Vérifie que la conversation appartient au user
  const { data: conv } = await service
    .from('aria_conversations')
    .select('id, user_id, title, archived')
    .eq('id', body.conversation_id)
    .maybeSingle()

  if (!conv || conv.user_id !== user.id) {
    return new Response(JSON.stringify({ error: 'Conversation introuvable.' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
  }
  if (conv.archived) {
    return new Response(JSON.stringify({ error: 'Conversation archivée.' }), { status: 410, headers: { 'Content-Type': 'application/json' } })
  }

  // INSERT message user
  await service.from('aria_messages').insert({
    conversation_id: body.conversation_id,
    user_id: user.id,
    role: 'user',
    content: body.message,
  })

  // Charge profil + mémoire + historique
  const [profileResult, memory, historyResult] = await Promise.all([
    service
      .from('profiles')
      .select('full_name, plan, score_humanite, fil_de_vie_count, awakening_level')
      .eq('id', user.id)
      .maybeSingle(),
    getUserMemory(user.id),
    service
      .from('aria_messages')
      .select('role, content')
      .eq('conversation_id', body.conversation_id)
      .order('created_at', { ascending: true })
      .limit(40),
  ])

  const profile = profileResult.data ?? {}
  const fullHistory = (historyResult.data ?? []).filter((m) => m.role === 'user' || m.role === 'assistant') as Array<{
    role: 'user' | 'assistant'
    content: string
  }>

  // Limite à 20 derniers échanges (40 messages user/assistant) pour cap tokens
  const history = fullHistory.slice(-40)

  // Detecte mode silence
  const { data: silence } = await service
    .from('silence_mode')
    .select('enabled')
    .eq('user_id', user.id)
    .maybeSingle()

  const baseSystem = getAriaSystemPrompt({
    full_name: (profile as { full_name?: string }).full_name ?? null,
    plan: (profile as { plan?: string }).plan ?? null,
    score_humanite: (profile as { score_humanite?: number }).score_humanite ?? null,
    fil_de_vie_count: (profile as { fil_de_vie_count?: number }).fil_de_vie_count ?? null,
    awakening_level: (profile as { awakening_level?: number }).awakening_level ?? null,
    preferred_silence: silence?.enabled ?? false,
  })

  const systemPrompt = baseSystem + memoryToSystemFragment(memory)

  // Sélection modèle auto
  const complexity = detectComplexity(body.message)
  const isPremium = (profile as { plan?: string }).plan === 'premium'
  const model = selectModel(complexity, isPremium)

  // Construit le stream SSE
  const encoder = new TextEncoder()
  let assistantContent = ''
  let tokensIn = 0
  let tokensOut = 0
  let abortedByClient = false

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        } catch {
          // Stream closed
        }
      }

      try {
        // Anthropic SDK retourne un AsyncIterable — on peut soit await stream.text() (full),
        // soit itérer les events. On utilise les events pour le streaming.
        const ariaStream = streamAria(systemPrompt, history, { model, maxTokens: 2048 })

        for await (const event of ariaStream) {
          if (abortedByClient) break

          if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
            const delta = event.delta.text
            assistantContent += delta
            send('token', delta)
          }
          if (event.type === 'message_delta' && event.usage) {
            tokensOut = event.usage.output_tokens ?? tokensOut
          }
          if (event.type === 'message_start' && event.message?.usage) {
            tokensIn = event.message.usage.input_tokens ?? 0
            tokensOut = event.message.usage.output_tokens ?? 0
          }
        }

        // INSERT message assistant final
        const { data: assistantMsg } = await service
          .from('aria_messages')
          .insert({
            conversation_id: body.conversation_id,
            user_id: user.id,
            role: 'assistant',
            content: assistantContent,
            model: modelTag(model),
            tokens_in: tokensIn,
            tokens_out: tokensOut,
          })
          .select('id')
          .single()

        // Log action chat
        await service.from('aria_actions_log').insert({
          user_id: user.id,
          action_type: 'chat',
          target_id: body.conversation_id,
          result: { model: modelTag(model), tokens_in: tokensIn, tokens_out: tokensOut, complexity },
        })

        // Auto-title : compte messages assistant total
        let generatedTitle: string | null = null
        if (!conv.title) {
          const { count } = await service
            .from('aria_messages')
            .select('id', { count: 'exact', head: true })
            .eq('conversation_id', body.conversation_id)
            .eq('role', 'assistant')

          if ((count ?? 0) >= 1) {
            // À partir du 1er échange complet, on génère un titre court (Haiku rapide)
            try {
              const titleSystem = `Génère un titre TRÈS court (3-6 mots max, en français, sans emoji, sans guillemets) qui résume cette conversation entre un utilisateur et Aria. Réponds UNIQUEMENT par le titre, rien d'autre.`
              const titlePrompt = `Premier message user : "${body.message.slice(0, 200)}"\nDébut réponse Aria : "${assistantContent.slice(0, 200)}"`
              const rawTitle = (await askAria(titleSystem, titlePrompt, { model: MODEL_FAST, maxTokens: 80 })).trim()
              generatedTitle = rawTitle.replace(/^["']|["']$/g, '').slice(0, 80)
              if (generatedTitle) {
                await service.from('aria_conversations').update({ title: generatedTitle }).eq('id', body.conversation_id)
                await service.from('aria_actions_log').insert({
                  user_id: user.id,
                  action_type: 'title_generated',
                  target_id: body.conversation_id,
                  result: { title: generatedTitle },
                })
              }
            } catch {
              // Si Aria ne répond pas pour le titre, on laisse null — pas bloquant
            }
          }
        }

        send('done', {
          messageId: assistantMsg?.id ?? null,
          model: modelTag(model),
          tokensIn,
          tokensOut,
          title: generatedTitle,
        })
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Erreur Aria inconnue.'
        send('error', { message: 'Aria rencontre un souci : ' + msg })
      } finally {
        controller.close()
      }
    },
    cancel() {
      abortedByClient = true
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
      Connection: 'keep-alive',
    },
  })
}
