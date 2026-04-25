import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { getActiveCercles } from '@/lib/cercles'
import { stringToColor, getInitials } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function CerclesIndexPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/cercles')

  const cercles = await getActiveCercles(user.id, { limit: 60 })

  return (
    <main className="min-h-screen px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(124,58,237,0.10), transparent 60%), #0A0A0F',
        }}
      />

      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div>
            <Link href="/dashboard" className="inline-block text-white/45 hover:text-white/85 text-sm transition-colors mb-2">
              ← Dashboard
            </Link>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-white">Cercles de Vie</h1>
            <p className="text-white/55 text-sm mt-2 max-w-xl leading-relaxed">
              Maximum 12 personnes autour d&apos;une intention partagée. Pas de scroll infini.
              Pas de followers. Juste un cercle, et un capitaine qui l&apos;a ouvert.
            </p>
          </div>
          <Link
            href="/cercles/nouveau"
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold hover:from-violet-500 hover:to-cyan-400 transition-all shadow-lg shadow-violet-500/20 text-sm"
          >
            ✶ Ouvrir un cercle
          </Link>
        </header>

        {cercles.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4 opacity-50" aria-hidden>
              ◯
            </div>
            <h2 className="text-lg font-display font-semibold text-white/85">Aucun cercle ouvert pour l&apos;instant.</h2>
            <p className="text-white/55 text-sm mt-2 max-w-md mx-auto leading-relaxed">
              Sois la première personne à proposer un espace. Une intention, jusqu&apos;à 12 voyageurs.
            </p>
            <Link
              href="/cercles/nouveau"
              className="inline-block mt-5 px-5 py-2.5 rounded-xl bg-white/8 border border-white/15 text-white text-sm hover:bg-white/14 transition-colors"
            >
              ✶ Ouvrir le premier
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {cercles.map((c) => {
              const seedColor = stringToColor(c.id)
              const isFull = c.members_count >= c.max_members
              return (
                <Link
                  key={c.id}
                  href={`/cercles/${c.id}`}
                  className="group glass rounded-2xl p-5 hover:border-white/15 transition-colors flex flex-col gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold text-white shrink-0"
                      style={{ background: `linear-gradient(135deg, ${seedColor}, #06B6D4)` }}
                      aria-hidden
                    >
                      ✶
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {c.is_member && (
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-400/30 text-violet-200">
                          Membre
                        </span>
                      )}
                      <span className={`text-[10px] font-mono ${isFull ? 'text-amber-300' : 'text-white/50'}`}>
                        {c.members_count} / {c.max_members}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-base font-display font-semibold text-white line-clamp-1">{c.name}</h2>
                    <p className="text-xs text-white/55 mt-1 line-clamp-3 leading-relaxed">{c.intention}</p>
                  </div>

                  {/* Members preview */}
                  <div className="flex items-center gap-1.5 mt-auto pt-2">
                    {c.members_preview.slice(0, 5).map((m) => (
                      <div
                        key={m.user_id}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white -ml-1 first:ml-0 border-2 border-[#0A0A0F]"
                        style={{ background: `linear-gradient(135deg, ${stringToColor(m.user_id)}, #06B6D4)` }}
                        aria-hidden
                      >
                        {getInitials(m.full_name ?? 'V')}
                      </div>
                    ))}
                    {c.members_count > 5 && (
                      <span className="text-[10px] text-white/45 ml-1 font-mono">+{c.members_count - 5}</span>
                    )}
                    <span className="ml-auto text-[10px] text-white/45 font-mono">{c.posts_count} parole{c.posts_count > 1 ? 's' : ''}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
