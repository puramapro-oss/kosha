import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { getActiveMissions, type MissionCategory } from '@/lib/missions'
import { Leaf, Wind, Heart, Quote, BookOpen, Footprints, Gift, Sprout } from 'lucide-react'

export const dynamic = 'force-dynamic'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  leaf: Leaf,
  wind: Wind,
  heart: Heart,
  quote: Quote,
  'book-open': BookOpen,
  footprints: Footprints,
  gift: Gift,
  sprout: Sprout,
}

const CATEGORY_LABELS: Record<MissionCategory, string> = {
  ecology: 'Écologie',
  social: 'Social',
  health: 'Santé',
  knowledge: 'Connaissance',
  creativity: 'Créativité',
}

const CATEGORIES: MissionCategory[] = ['ecology', 'social', 'health', 'knowledge', 'creativity']

interface MissionsPageProps {
  searchParams: Promise<{ category?: string }>
}

export default async function MissionsPage({ searchParams }: MissionsPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/missions')

  const { data: profile } = await supabase
    .from('profiles')
    .select('purama_points, purama_points_lifetime')
    .eq('id', user.id)
    .single()

  const params = await searchParams
  const filterCategory = (CATEGORIES as string[]).includes(params.category ?? '') ? (params.category as MissionCategory) : undefined
  const missions = await getActiveMissions(filterCategory)

  return (
    <main className="min-h-screen px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(16,185,129,0.10), transparent 60%), radial-gradient(ellipse 50% 40% at 90% 100%, rgba(124,58,237,0.06), transparent 60%), #0A0A0F',
        }}
      />

      <div className="max-w-5xl mx-auto space-y-8">
        <header>
          <Link href="/dashboard" className="inline-block text-white/45 hover:text-white text-sm mb-3">
            ← Dashboard
          </Link>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-white">Missions</h1>
              <p className="text-white/55 text-sm mt-1.5 max-w-md leading-relaxed">
                Actions positives qui rapportent des Points (1 pt = 0,01 €). Aria valide tes preuves avec bienveillance.
              </p>
            </div>
            <div className="glass rounded-xl px-4 py-3 text-right">
              <p className="text-xs text-white/50">Tes Points</p>
              <p className="text-2xl font-display font-bold" style={{ color: '#10B981' }}>
                {(profile?.purama_points ?? 0).toLocaleString('fr-FR')}
              </p>
              <p className="text-[10px] text-white/35 mt-0.5">≈ {(((profile?.purama_points ?? 0) / 100)).toFixed(2)} €</p>
            </div>
          </div>
        </header>

        {/* Filtres */}
        <div className="flex flex-wrap gap-2">
          <Link
            href="/missions"
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              !filterCategory ? 'bg-white/10 text-white border border-white/15' : 'text-white/55 border border-white/10 hover:text-white hover:border-white/25'
            }`}
          >
            Toutes
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              href={`/missions?category=${c}`}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                filterCategory === c ? 'bg-white/10 text-white border border-white/15' : 'text-white/55 border border-white/10 hover:text-white hover:border-white/25'
              }`}
            >
              {CATEGORY_LABELS[c]}
            </Link>
          ))}
        </div>

        {missions.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-white/65 text-sm">Aucune mission dans cette catégorie pour l&apos;instant.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {missions.map((m) => {
              const Icon = ICON_MAP[m.icon ?? ''] ?? Leaf
              return (
                <li key={m.id}>
                  <Link
                    href={`/missions/${m.slug}`}
                    className="block glass rounded-2xl p-5 hover:bg-white/[0.06] transition-all group h-full"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          background: m.color ? `linear-gradient(135deg, ${m.color}, ${m.color}aa)` : 'linear-gradient(135deg, #7C3AED, #06B6D4)',
                          boxShadow: m.color ? `0 6px 20px -8px ${m.color}88` : '0 6px 20px -8px rgba(124,58,237,0.5)',
                        }}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-white font-display font-semibold text-base group-hover:text-white leading-tight">
                          {m.title}
                        </h2>
                        <p className="text-white/55 text-xs mt-1.5 line-clamp-2 leading-relaxed">{m.description}</p>
                        <div className="flex items-center gap-3 mt-3 text-xs">
                          <span className="text-emerald-300/85 font-semibold">+{m.reward_points} pts</span>
                          <span className="text-white/35">•</span>
                          <span className="text-white/45">{CATEGORY_LABELS[m.category]}</span>
                          <span className="text-white/35">•</span>
                          <span className="text-white/45">{m.max_per_user}× max</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}

        <p className="text-white/30 text-xs text-center pt-4">
          Aria valide chaque preuve avec bienveillance. Points cumulables, jamais expirés.
        </p>
      </div>
    </main>
  )
}
