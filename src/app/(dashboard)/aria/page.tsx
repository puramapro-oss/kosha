import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import AriaNewConversationButton from '@/components/AriaNewConversationButton'
import { formatRelativeDate } from '@/lib/utils'
import { Sparkles, MessageSquare } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AriaListPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/aria')

  const service = createServiceClient()
  const { data: conversations } = await service
    .from('aria_conversations')
    .select('id, title, last_message_at, created_at')
    .eq('user_id', user.id)
    .eq('archived', false)
    .order('last_message_at', { ascending: false })
    .limit(50)

  const list = conversations ?? []

  return (
    <main className="min-h-screen px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(124,58,237,0.12), transparent 60%), radial-gradient(ellipse 50% 40% at 90% 100%, rgba(6,182,212,0.06), transparent 60%), #0A0A0F',
        }}
      />

      <div className="max-w-3xl mx-auto space-y-6">
        <header>
          <Link href="/dashboard" className="inline-block text-white/45 hover:text-white/85 text-sm transition-colors mb-3">
            ← Dashboard
          </Link>
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)' }}
                  aria-hidden
                >
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-white">Aria</h1>
              </div>
              <p className="text-white/55 text-sm max-w-md leading-relaxed">
                Ton assistante personnelle de KOSHA. Comprend, propose, exécute, apprend.
                <br />
                <span className="text-white/40 text-xs">Tutoiement, calme, respectueuse de ton silence.</span>
              </p>
            </div>
            <AriaNewConversationButton />
          </div>
        </header>

        {list.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <MessageSquare className="w-10 h-10 text-white/20 mx-auto mb-4" aria-hidden />
            <p className="text-white/65 text-sm">Aucune conversation pour l&apos;instant.</p>
            <p className="text-white/40 text-xs mt-1">Lance la première — Aria t&apos;attend.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {list.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/aria/${c.id}`}
                  className="glass rounded-xl px-4 py-3.5 flex items-center justify-between gap-4 hover:bg-white/[0.07] transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-white/90 text-sm font-medium truncate group-hover:text-white">
                      {c.title || <span className="italic text-white/50">Conversation sans titre</span>}
                    </p>
                    <p className="text-white/35 text-xs mt-0.5">
                      {formatRelativeDate(c.last_message_at)}
                    </p>
                  </div>
                  <span className="text-white/30 group-hover:text-white/70 transition-colors">→</span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <p className="text-white/30 text-xs text-center pt-6">
          Aria mémorise tes préférences pour personnaliser ses réponses.{' '}
          <Link href="/aria/oubli-moi" className="underline hover:text-white/55">Effacer ma mémoire</Link>
        </p>
      </div>
    </main>
  )
}
