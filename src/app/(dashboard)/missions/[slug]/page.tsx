import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { getMissionBySlug, countUserCompletions } from '@/lib/missions'
import MissionCompleteForm from '@/components/MissionCompleteForm'
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

interface MissionDetailPageProps {
  params: Promise<{ slug: string }>
}

export default async function MissionDetailPage({ params }: MissionDetailPageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/missions/${slug}`)

  const mission = await getMissionBySlug(slug)
  if (!mission) notFound()

  const userCompletions = await countUserCompletions(user.id, mission.id)
  const remaining = Math.max(0, mission.max_per_user - userCompletions)
  const Icon = ICON_MAP[mission.icon ?? ''] ?? Leaf

  return (
    <main className="min-h-screen px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background: `radial-gradient(ellipse 70% 60% at 50% 0%, ${mission.color ? mission.color + '22' : 'rgba(16,185,129,0.10)'}, transparent 60%), #0A0A0F`,
        }}
      />

      <div className="max-w-2xl mx-auto space-y-6">
        <Link href="/missions" className="inline-block text-white/45 hover:text-white text-sm">
          ← Toutes les missions
        </Link>

        {/* Hero */}
        <header className="glass rounded-2xl p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: mission.color ? `linear-gradient(135deg, ${mission.color}, ${mission.color}aa)` : 'linear-gradient(135deg, #7C3AED, #06B6D4)',
                boxShadow: mission.color ? `0 10px 30px -10px ${mission.color}88` : '0 10px 30px -10px rgba(124,58,237,0.5)',
              }}
            >
              <Icon className="w-7 h-7 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-white leading-tight">{mission.title}</h1>
              <div className="flex items-center gap-2 mt-3 text-sm">
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ background: '#10B98122', color: '#10B981' }}
                >
                  +{mission.reward_points} Points
                </span>
                <span className="text-white/40 text-xs">≈ {(mission.reward_points / 100).toFixed(2)} €</span>
              </div>
            </div>
          </div>
          <p className="text-white/75 text-sm leading-relaxed mt-5 whitespace-pre-wrap">{mission.description}</p>
          {mission.proof_instructions && (
            <div className="mt-5 rounded-xl p-4 bg-white/5 border border-white/10">
              <p className="text-xs text-white/45 mb-1.5 font-medium uppercase tracking-wide">Preuve attendue</p>
              <p className="text-white/85 text-sm leading-relaxed">{mission.proof_instructions}</p>
            </div>
          )}
          <div className="mt-5 flex items-center gap-4 text-xs text-white/45">
            <span>Déjà complétée par toi : <strong className="text-white/75">{userCompletions}×</strong></span>
            <span>•</span>
            <span>Reste : <strong className="text-white/75">{remaining}×</strong></span>
          </div>
        </header>

        {/* Form ou message */}
        {remaining === 0 ? (
          <div className="glass rounded-2xl p-6 text-center">
            <p className="text-white/75 text-sm">
              Tu as atteint la limite pour cette mission ({mission.max_per_user}× max).
            </p>
            <p className="text-white/45 text-xs mt-2">
              Découvre d&apos;autres missions — il y en a toujours pour redonner du sens à ta journée.
            </p>
          </div>
        ) : (
          <MissionCompleteForm slug={mission.slug} proofType={mission.proof_type} rewardPoints={mission.reward_points} />
        )}
      </div>
    </main>
  )
}
