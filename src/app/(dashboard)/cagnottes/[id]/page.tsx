import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import {
  getCagnotteById,
  getCagnotteSplits,
  getRecentContributions,
  CAGNOTTE_TYPE_LABELS,
  CAGNOTTE_STATUS_LABELS,
  formatEur,
  progressPercent,
} from '@/lib/cagnottes'
import CagnotteContributePanel from '@/components/CagnotteContributePanel'
import CagnotteReportButton from '@/components/CagnotteReportButton'
import { stringToColor, getInitials, formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ contribution?: string; created?: string }>
}

export default async function CagnotteDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const sp = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/cagnottes/${id}`)

  const [cagnotte, splits, contributions] = await Promise.all([
    getCagnotteById(id),
    getCagnotteSplits(id),
    getRecentContributions(id, 20),
  ])

  if (!cagnotte) notFound()

  const typeMeta = CAGNOTTE_TYPE_LABELS[cagnotte.type]
  const statusMeta = CAGNOTTE_STATUS_LABELS[cagnotte.status]
  const pct = progressPercent(cagnotte.raised_amount_cents, cagnotte.target_amount_cents)
  const isOwner = cagnotte.owner_id === user.id
  const ownerColor = stringToColor(cagnotte.owner_name ?? cagnotte.id)

  const daysLeft = cagnotte.ends_at
    ? Math.max(0, Math.ceil((new Date(cagnotte.ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  return (
    <main className="min-h-screen px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background: `radial-gradient(ellipse 70% 50% at 50% 0%, ${ownerColor}1f, transparent 60%), radial-gradient(ellipse 50% 40% at 100% 100%, rgba(6,182,212,0.06), transparent 60%), #0A0A0F`,
        }}
      />

      <div className="max-w-5xl mx-auto space-y-6">
        <Link href="/cagnottes" className="inline-block text-white/45 hover:text-white/85 text-sm transition-colors">
          ← Cagnottes
        </Link>

        {/* Confirmation banner */}
        {sp.created === '1' && (
          <div role="status" className="glass rounded-2xl p-4 text-sm text-emerald-300 border border-emerald-500/20 bg-emerald-500/5">
            ✦ Ta cagnotte est ouverte. Elle est dans ton Fil de Vie. Partage-la maintenant.
          </div>
        )}
        {sp.contribution === 'success' && (
          <div role="status" className="glass rounded-2xl p-4 text-sm text-violet-200 border border-violet-500/20 bg-violet-500/5">
            ✶ Merci. Ton don est en route — tu le verras dans ton Fil de Vie d&apos;un instant à l&apos;autre.
          </div>
        )}
        {sp.contribution === 'cancelled' && (
          <div role="status" className="glass rounded-2xl p-4 text-sm text-white/65 border border-white/10">
            Le paiement a été annulé. Tu peux réessayer quand tu veux.
          </div>
        )}

        {/* Hero */}
        <header className="glass rounded-3xl overflow-hidden">
          <div
            className="h-40 sm:h-56 flex items-center justify-center relative"
            style={{ background: `linear-gradient(135deg, ${ownerColor} 0%, #06B6D4 100%)` }}
            aria-hidden
          >
            <span className="text-7xl drop-shadow-lg">{typeMeta.emoji}</span>
            <span className={`absolute top-4 right-4 text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border ${statusMeta.tone}`}>
              {statusMeta.label}
            </span>
          </div>

          <div className="p-6 sm:p-8 space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/45">{typeMeta.label}</p>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mt-1">{cagnotte.title}</h1>
            </div>

            <div className="flex items-center gap-3 text-xs text-white/55">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${ownerColor}, #06B6D4)` }}
                aria-hidden
              >
                {getInitials(cagnotte.owner_name ?? 'V')}
              </div>
              <span>
                Ouverte par <span className="text-white/85">{cagnotte.owner_name ?? 'Voyageur'}</span> le {formatDate(cagnotte.created_at)}
              </span>
              {cagnotte.geolocation_label && <span className="ml-auto opacity-70">📍 {cagnotte.geolocation_label}</span>}
            </div>

            {/* Progression hero */}
            <div className="space-y-2 pt-2">
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background: 'linear-gradient(90deg, #7C3AED, #06B6D4)',
                  }}
                />
              </div>
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <p className="text-3xl font-display font-bold text-white">{formatEur(cagnotte.raised_amount_cents)}</p>
                <p className="text-sm text-white/55">collectés sur {formatEur(cagnotte.target_amount_cents)}</p>
                <p className="ml-auto text-xs font-mono text-white/65">{pct}%</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-white/45">
                <span>{cagnotte.contributors_count} contributeur{cagnotte.contributors_count > 1 ? 's' : ''}</span>
                {daysLeft !== null && <span>{daysLeft > 0 ? `${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''}` : 'Dernier jour'}</span>}
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* Main content */}
          <div className="space-y-6">
            <section className="glass rounded-2xl p-6">
              <h2 className="text-sm font-display font-semibold text-white/85 mb-3">Le récit</h2>
              <p className="text-white/85 text-sm leading-relaxed whitespace-pre-wrap">
                {cagnotte.description_aria || cagnotte.description}
              </p>
            </section>

            {/* Répartition */}
            {splits && (
              <section className="glass rounded-2xl p-6">
                <h2 className="text-sm font-display font-semibold text-white/85 mb-1">Répartition vivante</h2>
                <p className="text-xs text-white/45 mb-4">Chaque centime est tracé. Aucun frais caché.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <SplitTile label="Au projet" value={Number(splits.projet_amount_cents ?? 0)} pct={70} accent="#7C3AED" />
                  <SplitTile label="Aux contributeurs" value={Number(splits.contributors_amount_cents ?? 0)} pct={15} accent="#06B6D4" />
                  <SplitTile label="Sécurité" value={Number(splits.securite_amount_cents ?? 0)} pct={5} accent="#F59E0B" />
                  <SplitTile label="Fonds VIDA" value={Number(splits.fonds_vida_amount_cents ?? 0)} pct={10} accent="#10B981" />
                </div>
              </section>
            )}

            {/* Contributions */}
            <section className="glass rounded-2xl p-6">
              <h2 className="text-sm font-display font-semibold text-white/85 mb-1">Voyageurs qui ont contribué</h2>
              <p className="text-xs text-white/45 mb-4">Chaque don est horodaté en blockchain Bitcoin (« argent à mémoire »).</p>
              {contributions.length === 0 ? (
                <p className="text-sm text-white/45 py-6 text-center italic">
                  Personne n&apos;a encore contribué. Sois la première lumière.
                </p>
              ) : (
                <ul className="space-y-3">
                  {contributions.map((c) => {
                    const colorSeed = c.anonymous ? 'anonyme' : c.contributor_id
                    return (
                      <li key={c.id} className="flex items-start gap-3 text-sm">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                          style={{ background: `linear-gradient(135deg, ${stringToColor(colorSeed)}, #06B6D4)` }}
                          aria-hidden
                        >
                          {c.anonymous ? '?' : getInitials(c.display_name ?? 'V')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="text-white">{c.anonymous ? 'Voyageur anonyme' : c.display_name ?? 'Voyageur'}</span>
                            <span className="font-mono text-xs text-white/55">{formatEur(c.amount_cents)}</span>
                          </div>
                          {c.message && <p className="text-xs text-white/55 mt-0.5 italic">« {c.message} »</p>}
                          <p className="text-[10px] text-white/30 mt-0.5 font-mono">
                            {c.paid_at ? formatDate(c.paid_at) : ''}
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          </div>

          {/* Side panel */}
          <aside className="space-y-4">
            <CagnotteContributePanel
              cagnotteId={cagnotte.id}
              cagnotteStatus={cagnotte.status}
              isOwner={isOwner}
            />
            <div className="text-center">
              <CagnotteReportButton cagnotteId={cagnotte.id} isOwner={isOwner} />
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}

function SplitTile({ label, value, pct, accent }: { label: string; value: number; pct: number; accent: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/3 p-3">
      <p className="text-[10px] uppercase tracking-[0.15em] text-white/45 mb-1">{label}</p>
      <p className="text-sm font-mono font-semibold" style={{ color: accent }}>
        {formatEur(value)}
      </p>
      <p className="text-[10px] text-white/35 mt-0.5">{pct}%</p>
    </div>
  )
}
