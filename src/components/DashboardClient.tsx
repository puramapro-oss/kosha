'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Heart, Sparkles, Compass, MessageSquare, Users, Moon, Leaf } from 'lucide-react'
import ScoreHumaniteJauge from './ScoreHumaniteJauge'
import FilDeVieTimeline from './FilDeVieTimeline'
import MomentWow from './MomentWow'
import { useFilDeVie } from '@/hooks/useFilDeVie'
import { useScoreHumanite } from '@/hooks/useScoreHumanite'
import { getGreeting } from '@/lib/utils'
import type { ScoreComponents } from '@/lib/score'
import type { FilDeVieEntry } from '@/lib/fil-de-vie'

// Defer the Lucide imports check
const FALLBACK_COMPONENTS: ScoreComponents = { fiabilite: 5, entraide: 5, regularite: 5, impact: 5 }

interface Props {
  userId: string
  firstName: string
  initialScore: number
  initialComponents: ScoreComponents
  initialEntries: FilDeVieEntry[]
  initialFilDeVieCount: number
  estimatedMonthlyEarnings: number
  liveCommunityImpact: number
}

export default function DashboardClient({
  userId,
  firstName,
  initialScore,
  initialComponents,
  initialEntries,
  initialFilDeVieCount,
  estimatedMonthlyEarnings,
  liveCommunityImpact,
}: Props) {
  // Realtime hooks (initial data côté serveur, push live ensuite)
  const { entries: liveEntries } = useFilDeVie(userId, 8)
  const { score: liveScore, components: liveComponents } = useScoreHumanite(userId)

  // Préfère valeurs realtime quand disponibles, sinon initial server
  const score = liveScore || initialScore
  const components = liveComponents.fiabilite ? liveComponents : (initialComponents ?? FALLBACK_COMPONENTS)
  const entries = liveEntries.length > 0 ? liveEntries : initialEntries

  const hasFirstAction = initialFilDeVieCount > 0 || entries.length > 0

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-white/50 text-sm">{getGreeting(firstName)}</p>
          <h1 className="text-3xl md:text-4xl font-display font-bold gradient-text-kosha mt-1">
            Ton univers KOSHA
          </h1>
        </div>
        <Link
          href="/profile"
          className="inline-flex items-center gap-1.5 text-sm text-white/55 hover:text-white/85 transition-colors"
        >
          Voir mon profil complet →
        </Link>
      </header>

      {/* MOMENT WOW (BRIEF §2) */}
      <MomentWow
        estimatedMonthlyEarnings={estimatedMonthlyEarnings}
        liveCommunityImpact={liveCommunityImpact}
        suggestedActionLabel={hasFirstAction ? 'Découvrir une cagnotte' : 'Faire ma première action'}
        suggestedActionHref={hasFirstAction ? '/cagnottes' : '/actions/premiere'}
      />

      {/* Grid : Score + Fil de Vie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="glass rounded-2xl p-6 lg:col-span-1 flex flex-col items-center">
          <h2 className="text-lg font-display font-semibold mb-4 text-white/85">Score d&apos;Humanité</h2>
          <ScoreHumaniteJauge score={score} components={components} size={200} />

          <div className="grid grid-cols-2 gap-2 mt-6 w-full">
            <ScoreLine label="Fiabilité" value={components.fiabilite} />
            <ScoreLine label="Entraide" value={components.entraide} />
            <ScoreLine label="Régularité" value={components.regularite} />
            <ScoreLine label="Impact" value={components.impact} />
          </div>
        </section>

        <section className="glass rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-display font-semibold text-white/85">Ton Fil de Vie</h2>
            <Link href="/profile" className="text-xs text-white/40 hover:text-white/70">
              Tout voir →
            </Link>
          </div>
          <FilDeVieTimeline entries={entries} maxItems={8} />
        </section>
      </div>

      {/* Modules vivants */}
      <section className="glass rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-display font-semibold text-white/85">L&apos;univers vivant</h2>
        <p className="text-white/55 text-sm leading-relaxed">
          Chaque module arrive et reste — ton Fil de Vie t&apos;accompagne dans tous.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <LiveLink href="/cagnottes" icon={<Heart className="w-4 h-4" />} title="Cagnottes" desc="5 types, IA Aria, blockchain Bitcoin" />
          <LiveLink href="/feed" icon={<MessageSquare className="w-4 h-4" />} title="Le fil paisible" desc="3 vibrations, 0 toxicité" />
          <LiveLink href="/cercles" icon={<Users className="w-4 h-4" />} title="Cercles de Vie" desc="Max 12 voyageurs, 1 intention" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <LiveLink href="/missions" icon={<Leaf className="w-4 h-4" />} title="Missions" desc="Actions positives → Points (1 pt = 0,01 €)" />
          <LiveLink href="/impact-mondial" icon={<Compass className="w-4 h-4" />} title="Impact mondial" desc="La constellation des intentions" />
          <LiveLink href="/aria" icon={<Sparkles className="w-4 h-4" />} title="Aria" desc="Comprend, propose, exécute, apprend" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <LiveLink href="/silence" icon={<Moon className="w-4 h-4" />} title="Mode Silence" desc="Couper Aria et le monde" />
        </div>
      </section>

      <footer className="pt-6 border-t border-white/5 flex items-center justify-between">
        <p className="text-white/30 text-xs">
          KOSHA — Aucune pub. Aucune toxicité. Aucune comparaison.
        </p>
        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            className="text-white/40 hover:text-white/70 text-xs transition-colors"
          >
            Se déconnecter
          </button>
        </form>
      </footer>
    </div>
  )
}

function ScoreLine({ label, value }: { label: string; value: number }) {
  const ratio = Math.min(1, Math.max(0, value / 10))
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/50">{label}</span>
        <span className="text-white/80 font-mono">{value.toFixed(1)}</span>
      </div>
      <div className="h-1 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-700"
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  )
}

function ComingSoon({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <div className="rounded-xl bg-white/[0.025] border border-white/8 p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="w-7 h-7 rounded-lg bg-violet-500/15 text-violet-300 flex items-center justify-center">
          {icon}
        </span>
        <span className="text-sm font-semibold text-white/85">{title}</span>
        <span className="ml-auto text-[10px] uppercase tracking-wider text-white/30">Bientôt</span>
      </div>
      <p className="text-xs text-white/55 leading-relaxed">{desc}</p>
    </div>
  )
}

function LiveLink({
  href,
  icon,
  title,
  desc,
}: {
  href: string
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl bg-white/[0.04] border border-white/10 p-4 hover:bg-white/[0.08] hover:border-white/20 transition-colors block focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/30 to-cyan-500/20 text-white flex items-center justify-center">
          {icon}
        </span>
        <span className="text-sm font-semibold text-white">{title}</span>
        <span className="ml-auto text-white/40 group-hover:text-white/85 text-xs transition-colors">→</span>
      </div>
      <p className="text-xs text-white/55 leading-relaxed">{desc}</p>
    </Link>
  )
}

// Re-export for SSR-safe dynamic if needed
export { dynamic as nextDynamic }
