import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { getCollectiveImpact, getPersonalImpact } from '@/lib/impact'
import { Heart, Leaf, Trees, Droplet, Users as UsersIcon, Sparkles, Trophy, FileText, Globe } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function ImpactPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/impact')

  const [personal, collective] = await Promise.all([getPersonalImpact(user.id), getCollectiveImpact()])

  const currentYear = new Date().getFullYear()
  const showRapport2025 = personal.fil_de_vie_count > 0

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
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white">Impact</h1>
          <p className="text-white/55 text-sm mt-1.5 max-w-md leading-relaxed">
            Ton empreinte personnelle, et celle de la communauté. Tout est transparent — aucun chiffre inventé.
          </p>
        </header>

        {/* === Personnel === */}
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-semibold text-white/85 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-300/85" />
              Ton empreinte personnelle
            </h2>
            <span className="text-xs text-white/45">
              Membre depuis {personal.member_since ? formatDate(personal.member_since) : '?'}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ImpactCard icon={<Leaf className="w-4 h-4" />} value={personal.kg_dechets} unit="kg" label="Déchets retirés" color="#10B981" />
            <ImpactCard icon={<Trees className="w-4 h-4" />} value={personal.arbres} label="Arbres protégés" color="#10B981" />
            <ImpactCard icon={<Droplet className="w-4 h-4" />} value={personal.l_eau} unit="L" label="Eau préservée" color="#06B6D4" />
            <ImpactCard icon={<UsersIcon className="w-4 h-4" />} value={personal.personnes} label="Personnes touchées" color="#EC4899" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ImpactCard icon={<Heart className="w-4 h-4" />} value={personal.total_actions} label="Actions positives" color="#7C3AED" />
            <ImpactCard icon={<Trophy className="w-4 h-4" />} value={personal.total_missions_approved} label="Missions réussies" color="#F59E0B" />
            <ImpactCard
              icon={<Heart className="w-4 h-4" />}
              valueText={formatPrice(personal.total_donated_cents)}
              label="Donné en cagnottes"
              color="#EF4444"
            />
            <ImpactCard
              icon={<Sparkles className="w-4 h-4" />}
              value={personal.total_points_earned}
              suffix="pts"
              label="Points cumulés"
              color="#10B981"
            />
          </div>

          {/* Rapport annuel */}
          {showRapport2025 && (
            <div className="glass rounded-2xl p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)' }}
                >
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-white font-display font-semibold text-sm">Ton rapport {currentYear}</p>
                  <p className="text-white/55 text-xs mt-0.5">Synthèse imprimable de tes contributions de l&apos;année.</p>
                </div>
              </div>
              <Link
                href={`/impact/${currentYear}/rapport`}
                className="text-xs px-4 py-2 rounded-xl text-white font-medium shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
                  boxShadow: '0 6px 20px -8px rgba(124,58,237,0.55)',
                }}
              >
                Voir
              </Link>
            </div>
          )}
        </section>

        {/* === Collectif === */}
        <section className="space-y-5 pt-6">
          <h2 className="text-lg font-display font-semibold text-white/85 flex items-center gap-2">
            <Globe className="w-4 h-4 text-violet-300/85" />
            Empreinte collective KOSHA
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ImpactCard icon={<UsersIcon className="w-4 h-4" />} value={collective.total_users} label="Voyageurs" color="#7C3AED" />
            <ImpactCard
              icon={<Heart className="w-4 h-4" />}
              valueText={formatPrice(collective.total_collected_cents)}
              label="Cagnottes collectées"
              color="#EF4444"
            />
            <ImpactCard icon={<Trophy className="w-4 h-4" />} value={collective.total_missions_completed_global} label="Missions accomplies" color="#F59E0B" />
            <ImpactCard icon={<Sparkles className="w-4 h-4" />} value={collective.total_aria_messages} label="Messages avec Aria" color="#06B6D4" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ImpactCard icon={<Leaf className="w-4 h-4" />} value={collective.kg_dechets} unit="kg" label="Déchets retirés" color="#10B981" />
            <ImpactCard icon={<Trees className="w-4 h-4" />} value={collective.arbres} label="Arbres protégés" color="#10B981" />
            <ImpactCard icon={<Droplet className="w-4 h-4" />} value={collective.l_eau} unit="L" label="Eau préservée" color="#06B6D4" />
            <ImpactCard icon={<UsersIcon className="w-4 h-4" />} value={collective.personnes} label="Personnes touchées" color="#EC4899" />
          </div>

          <p className="text-white/30 text-xs text-center pt-3">
            Cumul mondial mis à jour en temps réel par les triggers SQL — aucune donnée inventée.
            <br />
            Dernière mise à jour : {formatDate(collective.updated_at)}.
          </p>
        </section>

        <div className="pt-4 text-center">
          <Link
            href="/impact-mondial"
            className="inline-flex items-center gap-2 text-sm text-white/55 hover:text-white transition-colors"
          >
            <Globe className="w-4 h-4" />
            Voir la carte mondiale des cagnottes →
          </Link>
        </div>
      </div>
    </main>
  )
}

function ImpactCard({
  icon,
  value,
  valueText,
  unit,
  suffix,
  label,
  color,
}: {
  icon: React.ReactNode
  value?: number
  valueText?: string
  unit?: string
  suffix?: string
  label: string
  color: string
}) {
  const display = valueText ?? (value ?? 0).toLocaleString('fr-FR')
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${color}22`, color }}
        >
          {icon}
        </div>
      </div>
      <p className="text-2xl font-display font-bold leading-none" style={{ color }}>
        {display}
        {unit && <span className="text-base text-white/45 ml-1">{unit}</span>}
        {suffix && <span className="text-sm text-white/45 ml-1">{suffix}</span>}
      </p>
      <p className="text-xs text-white/45 mt-1.5">{label}</p>
    </div>
  )
}
