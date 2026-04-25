import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { getRecentFilDeVie, getUserImpactTotals, type FilDeVieEntry } from '@/lib/fil-de-vie'
import { getCurrentScore } from '@/lib/score'
import ScoreHumaniteJauge from '@/components/ScoreHumaniteJauge'
import FilDeVieTimeline from '@/components/FilDeVieTimeline'
import UniversPersonnelRadar from '@/components/UniversPersonnelRadar'
import { getInitials, stringToColor, formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/profile')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, score_humanite, fil_de_vie_count, plan, awakening_level, referral_code, created_at')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const fullName = profile.full_name || user.email?.split('@')[0] || 'Voyageur'

  // Parallel fetch
  const service = createServiceClient()
  const [{ score, components }, entries, impactTotals, universData] = await Promise.all([
    getCurrentScore(user.id),
    getRecentFilDeVie(user.id, 50),
    getUserImpactTotals(user.id),
    fetchUniverseData(user.id),
  ])

  return (
    <main className="min-h-screen px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(124,58,237,0.08), transparent 60%), radial-gradient(ellipse 50% 40% at 90% 100%, rgba(6,182,212,0.06), transparent 60%), #0A0A0F',
        }}
      />

      <div className="max-w-5xl mx-auto space-y-8">
        <Link href="/dashboard" className="inline-block text-white/50 hover:text-white/85 text-sm transition-colors">
          ← Dashboard
        </Link>

        {/* Identity card */}
        <header className="glass rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-display font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${stringToColor(fullName)}, #06B6D4)` }}
            aria-hidden
          >
            {getInitials(fullName)}
          </div>
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-white">{fullName}</h1>
            <p className="text-white/50 text-sm mt-1">{user.email}</p>
            <p className="text-white/40 text-xs mt-2">
              Membre depuis {formatDate(profile.created_at)} • Plan {profile.plan}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-white/55">
            <Link href="/settings" className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              Réglages
            </Link>
          </div>
        </header>

        {/* Score + radar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="glass rounded-2xl p-6 flex flex-col items-center">
            <h2 className="text-lg font-display font-semibold text-white/85 mb-4">Score d&apos;Humanité</h2>
            <ScoreHumaniteJauge score={Number(score)} components={components} size={220} />
          </section>

          <section className="glass rounded-2xl p-6">
            <h2 className="text-lg font-display font-semibold text-white/85 mb-4">Univers personnel</h2>
            <UniversPersonnelRadar data={universData} height={260} />
          </section>
        </div>

        {/* Impact totals */}
        <section className="glass rounded-2xl p-6">
          <h2 className="text-lg font-display font-semibold text-white/85 mb-4">Empreinte d&apos;impact</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <ImpactStat label="Déchets retirés" value={impactTotals.kg_dechets ?? 0} unit="kg" color="#10B981" />
            <ImpactStat label="Arbres protégés" value={impactTotals.arbres ?? 0} unit="" color="#10B981" />
            <ImpactStat label="Eau préservée" value={impactTotals.l_eau ?? 0} unit="L" color="#06B6D4" />
            <ImpactStat label="Personnes touchées" value={impactTotals.personnes ?? 0} unit="" color="#EC4899" />
          </div>
        </section>

        {/* Fil de Vie complet */}
        <section className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-display font-semibold text-white/85">Fil de Vie</h2>
              <p className="text-xs text-white/40 mt-1">Ce qui est gravé ici n&apos;est jamais effacé.</p>
            </div>
            <span className="text-xs text-white/55 font-mono">
              {profile.fil_de_vie_count} action{profile.fil_de_vie_count > 1 ? 's' : ''}
            </span>
          </div>
          <FilDeVieTimeline entries={entries as FilDeVieEntry[]} />
        </section>

        {/* Code parrainage (preview pour P6) */}
        <section className="glass rounded-2xl p-6">
          <h2 className="text-lg font-display font-semibold text-white/85 mb-2">Ton code de parrainage</h2>
          <p className="text-white/55 text-xs mb-4">
            Partage-le. Tes filleuls auront -50% le premier mois et tu recevras 50% du premier paiement + 10% à vie.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 font-mono text-sm text-white/90">
              {profile.referral_code}
            </code>
            <span className="text-xs text-white/40">kosha.purama.dev/i/{profile.referral_code}</span>
          </div>
        </section>
      </div>
    </main>
  )
}

async function fetchUniverseData(userId: string) {
  const service = createServiceClient()
  const { data } = await service
    .from('universe_personnel')
    .select('niveau_conscience, energie, equilibre, contribution')
    .eq('user_id', userId)
    .maybeSingle()
  return (
    data ?? {
      niveau_conscience: 1,
      energie: 5,
      equilibre: 5,
      contribution: 1,
    }
  )
}

function ImpactStat({
  label,
  value,
  unit,
  color,
}: {
  label: string
  value: number
  unit: string
  color: string
}) {
  return (
    <div className="text-center sm:text-left">
      <p
        className="text-2xl md:text-3xl font-display font-bold"
        style={{ color }}
      >
        {value.toLocaleString('fr-FR')}
        {unit && <span className="text-base text-white/50 ml-1">{unit}</span>}
      </p>
      <p className="text-xs text-white/45 mt-1">{label}</p>
    </div>
  )
}
