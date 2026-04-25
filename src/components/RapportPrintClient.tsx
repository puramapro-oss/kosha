'use client'

import Link from 'next/link'
import { Printer, ArrowLeft, Heart, Trophy, Users as UsersIcon, Sparkles, Leaf, Trees, Droplet, FileText } from 'lucide-react'

interface ReportData {
  year: number
  user_id: string
  user_name: string | null
  user_email: string
  member_since: string | null
  actions_count: number
  missions_approved: number
  cagnottes_contributed: number
  cagnottes_created: number
  cercles_joined: number
  total_donated_cents: number
  points_earned_year: number
  kg_dechets: number
  arbres: number
  l_eau: number
  personnes: number
  highlights: Array<{ date: string; action_type: string; action_label: string }>
  generated_at: string
}

function formatDateFR(iso: string | null): string {
  if (!iso) return '?'
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatPriceFR(cents: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

export default function RapportPrintClient({ report }: { report: ReportData }) {
  const userName = report.user_name || report.user_email.split('@')[0] || 'Voyageur'
  const hasContent = report.actions_count > 0 || report.missions_approved > 0 || report.cagnottes_contributed > 0

  return (
    <main className="min-h-screen bg-white text-[#0A0A0F] print:bg-white">
      {/* Toolbar (cachée à l'impression) */}
      <div className="border-b border-zinc-200 px-4 py-3 flex items-center justify-between sticky top-0 bg-white z-10 print:hidden">
        <Link href="/impact" className="inline-flex items-center gap-1.5 text-sm text-zinc-600 hover:text-[#0A0A0F]">
          <ArrowLeft className="w-4 h-4" />
          Retour à Impact
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium text-sm transition-all"
          style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)' }}
        >
          <Printer className="w-4 h-4" />
          Imprimer / sauver en PDF
        </button>
      </div>

      {/* Document — A4 portrait, marges généreuses pour impression */}
      <div className="max-w-[760px] mx-auto px-8 py-12 print:py-6">
        {/* Header */}
        <header className="border-b border-zinc-200 pb-6 mb-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-zinc-500 font-medium mb-2">KOSHA — Rapport Annuel</p>
              <h1 className="text-4xl font-display font-bold tracking-tight">Année {report.year}</h1>
              <p className="text-lg text-zinc-700 mt-1">Bilan d&apos;impact de {userName}</p>
            </div>
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)' }}
            >
              <FileText className="w-7 h-7 text-white" />
            </div>
          </div>
          <p className="text-sm text-zinc-500 mt-4">
            Généré le {formatDateFR(report.generated_at)} • Membre depuis le {formatDateFR(report.member_since)}
          </p>
        </header>

        {/* Intro narrative */}
        <section className="mb-10">
          {hasContent ? (
            <p className="text-lg leading-relaxed text-zinc-800">
              En {report.year}, {userName} a posé {' '}
              <strong className="text-[#0A0A0F]">{report.actions_count} action{report.actions_count > 1 ? 's' : ''} positive{report.actions_count > 1 ? 's' : ''}</strong>
              {' '}qui font une différence. Ce rapport est gravé. Aucun chiffre n&apos;est inventé. Chaque ligne est tracée par les triggers SQL de KOSHA.
            </p>
          ) : (
            <p className="text-base leading-relaxed text-zinc-700 italic">
              Pas encore d&apos;action enregistrée en {report.year}. Le voyage commence à chaque instant.
            </p>
          )}
        </section>

        {/* Métriques majeures */}
        <section className="mb-10">
          <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-medium mb-4">Empreinte de l&apos;année</h2>
          <div className="grid grid-cols-2 gap-4">
            <Metric icon={<Heart className="w-4 h-4" />} value={report.actions_count} label="Actions positives" />
            <Metric icon={<Trophy className="w-4 h-4" />} value={report.missions_approved} label="Missions accomplies" />
            <Metric icon={<Heart className="w-4 h-4" />} valueText={formatPriceFR(report.total_donated_cents)} label="Donné en cagnottes" />
            <Metric icon={<Sparkles className="w-4 h-4" />} value={report.points_earned_year} suffix="pts" label="Points gagnés" />
            <Metric icon={<Heart className="w-4 h-4" />} value={report.cagnottes_contributed} label="Cagnottes soutenues" />
            <Metric icon={<UsersIcon className="w-4 h-4" />} value={report.cercles_joined} label="Cercles rejoints" />
          </div>
        </section>

        {/* Empreinte écologique */}
        <section className="mb-10">
          <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-medium mb-4">Empreinte écologique</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <EcoStat icon={<Leaf className="w-4 h-4" />} value={report.kg_dechets} unit="kg" label="Déchets retirés" />
            <EcoStat icon={<Trees className="w-4 h-4" />} value={report.arbres} label="Arbres protégés" />
            <EcoStat icon={<Droplet className="w-4 h-4" />} value={report.l_eau} unit="L" label="Eau préservée" />
            <EcoStat icon={<UsersIcon className="w-4 h-4" />} value={report.personnes} label="Personnes touchées" />
          </div>
        </section>

        {/* Highlights timeline */}
        {report.highlights.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-medium mb-4">5 moments forts</h2>
            <ul className="space-y-3">
              {report.highlights.map((h, i) => (
                <li key={i} className="flex gap-4 items-start border-l-2 pl-4 py-1" style={{ borderColor: '#7C3AED' }}>
                  <div className="text-[11px] font-mono text-zinc-500 w-24 shrink-0 mt-0.5">
                    {formatDateFR(h.date)}
                  </div>
                  <div className="text-sm text-zinc-800">{h.action_label}</div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Footer signature */}
        <footer className="border-t border-zinc-200 pt-6 mt-12 text-center">
          <p className="text-xs text-zinc-500 leading-relaxed">
            Ce rapport est <strong className="text-[#0A0A0F]">la vérité brute</strong>. Aucune métrique n&apos;est arrondie en ta faveur, aucun chiffre n&apos;est extrapolé.
            <br />
            KOSHA — l&apos;inverse exact des réseaux sociaux toxiques.
            <br />
            <span className="font-mono text-zinc-400 text-[10px] mt-2 inline-block">user_id: {report.user_id.slice(0, 18)}…</span>
          </p>
        </footer>
      </div>

      {/* Print CSS */}
      <style>{`
        @media print {
          @page { size: A4; margin: 1.5cm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </main>
  )
}

function Metric({
  icon,
  value,
  valueText,
  suffix,
  label,
}: {
  icon: React.ReactNode
  value?: number
  valueText?: string
  suffix?: string
  label: string
}) {
  const display = valueText ?? (value ?? 0).toLocaleString('fr-FR')
  return (
    <div className="flex items-start gap-3 py-3 px-4 border border-zinc-200 rounded-xl">
      <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700 shrink-0">{icon}</div>
      <div>
        <p className="text-2xl font-display font-bold text-[#0A0A0F] leading-none">
          {display}
          {suffix && <span className="text-sm text-zinc-500 ml-1">{suffix}</span>}
        </p>
        <p className="text-xs text-zinc-600 mt-1.5">{label}</p>
      </div>
    </div>
  )
}

function EcoStat({ icon, value, unit, label }: { icon: React.ReactNode; value: number; unit?: string; label: string }) {
  return (
    <div className="text-center">
      <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 mb-2">{icon}</div>
      <p className="text-xl font-display font-bold text-[#0A0A0F]">
        {value.toLocaleString('fr-FR')}
        {unit && <span className="text-sm text-zinc-500 ml-1">{unit}</span>}
      </p>
      <p className="text-[11px] text-zinc-600 mt-0.5">{label}</p>
    </div>
  )
}
