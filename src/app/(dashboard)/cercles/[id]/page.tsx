import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { getCercleById } from '@/lib/cercles'
import { getCerclePosts } from '@/lib/posts'
import PostComposer from '@/components/PostComposer'
import { FeedList } from '@/components/PostCard'
import CercleJoinButton from '@/components/CercleJoinButton'
import { stringToColor, getInitials, formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ created?: string }>
}

export default async function CercleDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const sp = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/cercles/${id}`)

  const cercle = await getCercleById(id, user.id)
  if (!cercle) notFound()

  const posts = await getCerclePosts(id, user.id, 30)
  const isFull = cercle.members_count >= cercle.max_members
  const seedColor = stringToColor(cercle.id)
  const canPost = cercle.is_member || cercle.is_creator

  return (
    <main className="min-h-screen px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background: `radial-gradient(ellipse 70% 50% at 50% 0%, ${seedColor}1f, transparent 60%), #0A0A0F`,
        }}
      />

      <div className="max-w-3xl mx-auto space-y-6">
        <Link href="/cercles" className="inline-block text-white/45 hover:text-white/85 text-sm transition-colors">
          ← Cercles
        </Link>

        {sp.created === '1' && (
          <div role="status" className="glass rounded-2xl p-4 text-sm text-emerald-300 border border-emerald-500/20 bg-emerald-500/5">
            ✶ Ton cercle est ouvert. Partage le lien pour rassembler tes voyageurs.
          </div>
        )}

        <header className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white shrink-0"
              style={{ background: `linear-gradient(135deg, ${seedColor}, #06B6D4)` }}
              aria-hidden
            >
              ✶
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-display font-bold text-white">{cercle.name}</h1>
              <p className="text-white/55 text-xs mt-1">
                Ouvert le {formatDate(cercle.created_at)} • {cercle.members_count} / {cercle.max_members} membres • {cercle.posts_count} parole{cercle.posts_count > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <p className="text-white/85 text-sm leading-relaxed italic border-l-2 border-violet-400/30 pl-4">
            « {cercle.intention} »
          </p>

          {/* Members */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">Membres</p>
            <div className="flex flex-wrap gap-1.5">
              {cercle.members_preview.map((m) => (
                <div
                  key={m.user_id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/8"
                  title={m.full_name ?? 'Voyageur'}
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${stringToColor(m.user_id)}, #06B6D4)` }}
                    aria-hidden
                  >
                    {getInitials(m.full_name ?? 'V')}
                  </div>
                  <span className="text-[11px] text-white/85">{m.full_name?.split(' ')[0] ?? 'Voyageur'}</span>
                  {m.role === 'captain' && <span className="text-[9px] text-violet-300">⌂</span>}
                </div>
              ))}
            </div>
          </div>

          <CercleJoinButton
            cercleId={cercle.id}
            isMember={cercle.is_member}
            isCreator={cercle.is_creator}
            isFull={isFull}
          />
        </header>

        {canPost ? (
          <PostComposer
            cercleId={cercle.id}
            placeholder={`Une parole pour le cercle « ${cercle.name.slice(0, 32)} »…`}
          />
        ) : (
          <div className="glass rounded-2xl p-5 text-center text-sm text-white/65">
            Rejoins ce cercle pour y déposer une parole.
          </div>
        )}

        <FeedList initialPosts={posts} viewerId={user.id} />
      </div>
    </main>
  )
}
