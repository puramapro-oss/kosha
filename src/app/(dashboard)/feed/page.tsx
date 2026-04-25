import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { getPublicFeed } from '@/lib/posts'
import PostComposer from '@/components/PostComposer'
import { FeedList } from '@/components/PostCard'

export const dynamic = 'force-dynamic'

export default async function FeedPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/feed')

  const posts = await getPublicFeed(user.id, 30)

  return (
    <main className="min-h-screen px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(124,58,237,0.10), transparent 60%), radial-gradient(ellipse 50% 40% at 90% 100%, rgba(6,182,212,0.06), transparent 60%), #0A0A0F',
        }}
      />

      <div className="max-w-2xl mx-auto space-y-6">
        <header className="flex items-end justify-between gap-4">
          <div>
            <Link href="/dashboard" className="inline-block text-white/45 hover:text-white/85 text-sm transition-colors mb-2">
              ← Dashboard
            </Link>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-white">Le fil paisible.</h1>
            <p className="text-white/55 text-sm mt-1.5 max-w-md leading-relaxed">
              Aucun like. Aucun follower. Aucun classement. Juste 3 vibrations possibles : énergie, gratitude, soutien.
            </p>
          </div>
          <Link
            href="/cercles"
            className="hidden sm:inline-block px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/85 hover:bg-white/10 transition-colors text-sm"
          >
            ✶ Cercles
          </Link>
        </header>

        <PostComposer />

        <FeedList initialPosts={posts} viewerId={user.id} />
      </div>
    </main>
  )
}
