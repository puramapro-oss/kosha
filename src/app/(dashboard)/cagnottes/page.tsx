import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import {
  getActiveCagnottes,
  getImpactGlobal,
  CAGNOTTE_TYPE_LABELS,
  formatEur,
  type CagnotteType,
} from '@/lib/cagnottes'
import CagnotteCard from '@/components/CagnotteCard'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ type?: string }>
}

export default async function CagnottesIndexPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/cagnottes')

  const params = await searchParams
  const filterType = isCagnotteType(params.type) ? params.type : undefined

  const [cagnottes, impactGlobal] = await Promise.all([getActiveCagnottes({ type: filterType }), getImpactGlobal()])

  const totalRaisedCents = (impactGlobal?.total_collected_cents as number | undefined) ?? 0
  const totalContributors = (impactGlobal?.contributors_unique as number | undefined) ?? 0
  const completedCount = (impactGlobal?.cagnottes_completed as number | undefined) ?? 0

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

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div>
            <Link href="/dashboard" className="inline-block text-white/45 hover:text-white/85 text-sm transition-colors mb-3">
              ← Dashboard
            </Link>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-white">Cagnottes vivantes</h1>
            <p className="text-white/55 text-sm mt-2 max-w-xl leading-relaxed">
              Chaque cagnotte est un acte traçable. 70% va au projet, 15% aux contributeurs, 5% à la sécurité, 10% au fonds VIDA.
              Aucun centime n&apos;est invisible.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/impact-mondial"
              className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/85 hover:bg-white/10 transition-colors text-sm"
            >
              ✶ Impact mondial
            </Link>
            <Link
              href="/cagnottes/nouvelle"
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold hover:from-violet-500 hover:to-cyan-400 transition-all shadow-lg shadow-violet-500/20 glow-violet text-sm"
            >
              ✦ Lancer une cagnotte
            </Link>
          </div>
        </header>

        {/* Stats globales */}
        <section className="glass rounded-2xl p-5 grid grid-cols-2 sm:grid-cols-3 gap-6">
          <Stat label="Collecté ensemble" value={formatEur(totalRaisedCents)} accent="#7C3AED" />
          <Stat label="Voyageurs contributeurs" value={totalContributors.toLocaleString('fr-FR')} accent="#06B6D4" />
          <Stat label="Cagnottes atteintes" value={completedCount.toLocaleString('fr-FR')} accent="#10B981" />
        </section>

        {/* Filtres types */}
        <nav aria-label="Filtres" className="flex flex-wrap gap-2">
          <FilterPill href="/cagnottes" label="Toutes" active={!filterType} />
          {(Object.keys(CAGNOTTE_TYPE_LABELS) as CagnotteType[]).map((t) => (
            <FilterPill
              key={t}
              href={`/cagnottes?type=${t}`}
              label={`${CAGNOTTE_TYPE_LABELS[t].emoji} ${CAGNOTTE_TYPE_LABELS[t].label}`}
              active={filterType === t}
            />
          ))}
        </nav>

        {/* Grid cagnottes */}
        {cagnottes.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4 opacity-50" aria-hidden>
              ◯
            </div>
            <h2 className="text-lg font-display font-semibold text-white/85">
              {filterType ? 'Aucune cagnotte de ce type pour le moment.' : 'Aucune cagnotte active.'}
            </h2>
            <p className="text-white/55 text-sm mt-2 max-w-md mx-auto leading-relaxed">
              Ouvre la voie. La première cagnotte fait éclore les suivantes.
            </p>
            <Link
              href="/cagnottes/nouvelle"
              className="inline-block mt-5 px-5 py-2.5 rounded-xl bg-white/8 border border-white/15 text-white text-sm hover:bg-white/14 transition-colors"
            >
              ✦ Lancer la première
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {cagnottes.map((c, i) => (
              <CagnotteCard key={c.id} cagnotte={c} index={i} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function isCagnotteType(s: string | undefined): s is CagnotteType {
  return s === 'communautaire' || s === 'projet_vie' || s === 'action_immediate' || s === 'humanitaire' || s === 'hybride'
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div>
      <p className="text-2xl md:text-3xl font-display font-bold" style={{ color: accent }}>
        {value}
      </p>
      <p className="text-xs text-white/50 mt-1">{label}</p>
    </div>
  )
}

function FilterPill({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors border ${
        active
          ? 'bg-violet-500/20 border-violet-400/40 text-white'
          : 'bg-white/5 border-white/10 text-white/65 hover:bg-white/10 hover:text-white/85'
      }`}
    >
      {label}
    </Link>
  )
}
