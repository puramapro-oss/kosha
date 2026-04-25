'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Send, Sparkles, ArrowLeft, Trash2 } from 'lucide-react'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  model?: string | null
  pending?: boolean
}

interface AriaChatClientProps {
  conversationId: string
  initialTitle: string | null
  initialMessages: Array<{ id: string; role: 'user' | 'assistant'; content: string; model: string | null }>
  archived: boolean
}

const SUGGESTIONS = [
  'Aide-moi à créer une cagnotte qui inspire confiance.',
  'Comment retirer mes gains du Wallet ?',
  'Suggère-moi un cercle qui correspond à mes valeurs.',
  "Qu'est-ce qui rend KOSHA différent des réseaux toxiques ?",
]

export default function AriaChatClient({
  conversationId,
  initialTitle,
  initialMessages,
  archived,
}: AriaChatClientProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initialTitle)
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Auto-scroll en bas à chaque nouveau message ou token streamé
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Focus input au mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || streaming || archived) return
      setError(null)

      const userMsg: ChatMessage = {
        id: 'user-' + Date.now(),
        role: 'user',
        content: text,
      }
      const assistantMsg: ChatMessage = {
        id: 'assistant-streaming',
        role: 'assistant',
        content: '',
        pending: true,
      }
      setMessages((prev) => [...prev, userMsg, assistantMsg])
      setInput('')
      setStreaming(true)

      const ctrl = new AbortController()
      abortRef.current = ctrl

      try {
        const resp = await fetch('/api/aria/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversation_id: conversationId, message: text }),
          signal: ctrl.signal,
        })

        if (!resp.ok || !resp.body) {
          const errorData = (await resp.json().catch(() => ({}))) as { error?: string }
          throw new Error(errorData.error ?? `Erreur HTTP ${resp.status}`)
        }

        const reader = resp.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let assembledContent = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          // Parse SSE events (séparés par double newline)
          const events = buffer.split('\n\n')
          buffer = events.pop() ?? ''

          for (const evtBlock of events) {
            if (!evtBlock.trim()) continue
            const lines = evtBlock.split('\n')
            const eventLine = lines.find((l) => l.startsWith('event: '))
            const dataLine = lines.find((l) => l.startsWith('data: '))
            if (!eventLine || !dataLine) continue
            const eventName = eventLine.slice(7).trim()
            const dataStr = dataLine.slice(6)

            if (eventName === 'token') {
              const delta = JSON.parse(dataStr) as string
              assembledContent += delta
              setMessages((prev) => {
                const copy = [...prev]
                const last = copy[copy.length - 1]
                if (last && last.id === 'assistant-streaming') {
                  copy[copy.length - 1] = { ...last, content: assembledContent }
                }
                return copy
              })
            } else if (eventName === 'done') {
              const meta = JSON.parse(dataStr) as {
                messageId: string | null
                model: string
                title: string | null
              }
              setMessages((prev) => {
                const copy = [...prev]
                const last = copy[copy.length - 1]
                if (last && last.id === 'assistant-streaming') {
                  copy[copy.length - 1] = {
                    id: meta.messageId ?? 'assistant-' + Date.now(),
                    role: 'assistant',
                    content: assembledContent,
                    model: meta.model,
                    pending: false,
                  }
                }
                return copy
              })
              if (meta.title && !title) {
                setTitle(meta.title)
                router.refresh()
              }
            } else if (eventName === 'error') {
              const errMsg = (JSON.parse(dataStr) as { message: string }).message
              throw new Error(errMsg)
            }
          }
        }
      } catch (e) {
        if ((e as Error).name === 'AbortError') return
        const msg = e instanceof Error ? e.message : 'Erreur inconnue'
        setError(msg)
        setMessages((prev) => {
          const copy = [...prev]
          const last = copy[copy.length - 1]
          if (last && last.id === 'assistant-streaming') {
            copy[copy.length - 1] = { ...last, id: 'assistant-error', content: 'Aria a rencontré un souci. Réessaie dans un instant.', pending: false }
          }
          return copy
        })
      } finally {
        setStreaming(false)
        abortRef.current = null
        inputRef.current?.focus()
      }
    },
    [conversationId, streaming, archived, title, router]
  )

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  async function archiveConversation() {
    if (!confirm('Archiver cette conversation ? (réversible côté admin)')) return
    const r = await fetch(`/api/aria/conversations/${conversationId}`, { method: 'DELETE' })
    if (r.ok) router.push('/aria')
  }

  return (
    <div className="flex flex-col h-screen bg-[#0A0A0F]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(124,58,237,0.12), transparent 60%), radial-gradient(ellipse 50% 40% at 90% 100%, rgba(6,182,212,0.06), transparent 60%), #0A0A0F',
        }}
      />

      {/* Header */}
      <header className="border-b border-white/[0.06] px-4 py-3 flex items-center gap-3 sticky top-0 bg-[#0A0A0F]/80 backdrop-blur-xl z-10">
        <Link
          href="/aria"
          className="p-2 -ml-2 rounded-lg text-white/55 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Retour aux conversations"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)' }}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-sm md:text-base font-display font-semibold text-white truncate">
            {title || <span className="italic text-white/55">Nouvelle conversation</span>}
          </h1>
        </div>
        <button
          onClick={archiveConversation}
          className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-white/5 transition-colors"
          aria-label="Archiver"
          disabled={streaming}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </header>

      {/* Messages scroll area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && !streaming && (
            <div className="text-center pt-12 pb-6">
              <div
                className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)', boxShadow: '0 12px 40px -12px rgba(124,58,237,0.5)' }}
              >
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-display font-bold text-white mb-2">Bonjour, je suis Aria.</h2>
              <p className="text-white/55 text-sm max-w-md mx-auto leading-relaxed">
                Je suis ton assistante personnelle de KOSHA.
                <br />
                Pose-moi n&apos;importe quoi — j&apos;apprends de chaque conversation.
              </p>

              <div className="mt-8 grid sm:grid-cols-2 gap-2 max-w-xl mx-auto">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-left text-sm text-white/70 px-4 py-3 rounded-xl glass hover:bg-white/[0.07] hover:text-white transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-white/[0.06] px-4 py-4 bg-[#0A0A0F]/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto">
          {error && (
            <p className="text-xs text-red-300/85 mb-2 px-1">⚠ {error}</p>
          )}
          {archived ? (
            <p className="text-center text-white/40 text-sm py-2">Cette conversation est archivée.</p>
          ) : (
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Écris à Aria..."
                rows={1}
                disabled={streaming}
                className="flex-1 resize-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/35 focus:outline-none focus:border-[#7C3AED]/50 focus:bg-white/[0.07] transition-colors max-h-32"
                style={{ minHeight: '46px' }}
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || streaming}
                className="h-[46px] px-4 rounded-xl text-white font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
                  boxShadow: streaming ? 'none' : '0 6px 20px -6px rgba(124,58,237,0.55)',
                }}
                aria-label="Envoyer"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">{streaming ? '…' : 'Envoyer'}</span>
              </button>
            </div>
          )}
          <p className="text-[10px] text-white/30 text-center mt-2">
            Aria peut se tromper — vérifie les infos importantes. Aucun mensonge, aucune manipulation, aucune pub.
          </p>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? 'text-white'
            : 'text-white/90 bg-white/[0.04] border border-white/[0.06]'
        }`}
        style={
          isUser
            ? {
                background: 'linear-gradient(135deg, #7C3AED 0%, #5b21b6 100%)',
                boxShadow: '0 4px 16px -6px rgba(124,58,237,0.4)',
              }
            : undefined
        }
      >
        {message.content}
        {message.pending && message.content.length === 0 && (
          <span className="inline-flex items-center gap-1.5 text-white/40">
            <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: '0.15s' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: '0.3s' }} />
          </span>
        )}
        {message.pending && message.content.length > 0 && (
          <span className="inline-block w-1.5 h-3.5 ml-0.5 align-middle bg-white/60 animate-pulse" />
        )}
      </div>
    </div>
  )
}
