import { getAdminKpis, listAdminLogs } from '@/lib/admin'
import { Users, Heart, Sparkles, Trophy, Mail, MessageSquare, Leaf, Trees, Droplet } from 'lucide-react'

export const dynamic = 'force-dynamic'

function fmt(n: number | undefined | null): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '0'
  return Number(n).toLocaleString('fr-FR')
}

function fmtEur(cents: number | undefined | null): string {
  if (!cents) return '0 €'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

export default async function AdminDashboard() {
  const [kpis, logs] = await Promise.all([getAdminKpis(), listAdminLogs(8)])

  if (!kpis) {
    return (
      <div className="glass rounded-2xl p-8">
        <p className="text-white/70">Impossible de charger les KPIs pour le moment.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-display font-bold gradient-text-kosha">Pilotage KOSHA</h1>
        <p className="text-white/55 text-sm mt-2">
          Snapshot temps réel — calculé le {new Date(kpis.computed_at).toLocaleString('fr-FR')}
        </p>
      </header>

      {/* Communauté */}
      <Section title="Communauté">
        <Kpi icon={<Users className="w-4 h-4" />} label="Utilisateurs total" value={fmt(kpis.users_total)} />
        <Kpi icon={<Sparkles className="w-4 h-4" />} label="Actifs (7 derniers jours)" value={fmt(kpis.users_active_7d)} />
        <Kpi icon={<Heart className="w-4 h-4" />} label="Abonnés payants" value={fmt(kpis.users_paid)} />
        <Kpi icon={<Mail className="w-4 h-4" />} label="Abonnés newsletter" value={fmt(kpis.newsletter_subscribed)} />
      </Section>

      {/* Actions */}
      <Section title="Actions">
        <Kpi icon={<Heart className="w-4 h-4" />} label="Cagnottes ouvertes" value={fmt(kpis.cagnottes_total)} />
        <Kpi icon={<Trophy className="w-4 h-4" />} label="Cagnottes complétées" value={fmt(kpis.cagnottes_completed)} />
        <Kpi icon={<Trophy className="w-4 h-4" />} label="Missions accomplies" value={fmt(kpis.missions_completed)} />
        <Kpi icon={<Sparkles className="w-4 h-4" />} label="Rituels participés" value={fmt(kpis.rituels_participations)} />
      </Section>

      {/* Argent + IA */}
      <Section title="Argent & Aria">
        <Kpi icon={<Heart className="w-4 h-4" />} label="Total donné en cagnottes" value={fmtEur(kpis.total_donated_cents)} />
        <Kpi icon={<Sparkles className="w-4 h-4" />} label="Points distribués (lifetime)" value={fmt(kpis.total_points_lifetime)} />
        <Kpi icon={<MessageSquare className="w-4 h-4" />} label="Messages Aria" value={fmt(kpis.aria_messages)} />
      </Section>

      {/* Impact écologique */}
      <Section title="Empreinte écologique cumulée">
        <Kpi icon={<Leaf className="w-4 h-4" />} label="kg de déchets retirés" value={fmt(kpis.impact_global.kg_dechets)} />
        <Kpi icon={<Trees className="w-4 h-4" />} label="Arbres protégés" value={fmt(kpis.impact_global.arbres)} />
        <Kpi icon={<Droplet className="w-4 h-4" />} label="Litres d'eau préservés" value={fmt(kpis.impact_global.l_eau)} />
        <Kpi icon={<Users className="w-4 h-4" />} label="Personnes touchées" value={fmt(kpis.impact_global.personnes)} />
      </Section>

      {/* Audit logs */}
      <section className="glass rounded-2xl p-6">
        <h2 className="text-lg font-display font-semibold text-white/90 mb-4">Derniers événements admin</h2>
        {logs.length === 0 ? (
          <p className="text-white/55 text-sm">Aucun événement admin enregistré.</p>
        ) : (
          <ul className="divide-y divide-white/5 text-sm">
            {logs.map((l) => (
              <li key={l.id} className="py-2.5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-white/85 font-medium">
                    {l.action_type}
                    {l.target_type && (
                      <span className="text-white/50 font-normal"> · {l.target_type}/{l.target_id?.slice(0, 24)}</span>
                    )}
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">{l.admin_email}</p>
                </div>
                <div className="text-[11px] text-white/40 shrink-0">
                  {new Date(l.created_at).toLocaleString('fr-FR')}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xs uppercase tracking-widest text-white/40 font-medium mb-3">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">{children}</div>
    </section>
  )
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 text-white/55 text-xs">
        <span className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/70">{icon}</span>
        <span>{label}</span>
      </div>
      <p className="text-2xl font-display font-bold mt-2 text-white tabular-nums">{value}</p>
    </div>
  )
}
