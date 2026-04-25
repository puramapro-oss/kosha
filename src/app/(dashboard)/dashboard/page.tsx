import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { APP_NAME } from '@/lib/constants'
import { getGreeting } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/dashboard')

  // Read profile (auto-créé par trigger SQL au signup)
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, score_humanite, fil_de_vie_count, plan, awakening_level')
    .eq('id', user.id)
    .single()

  const firstName = profile?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'voyageur'

  return (
    <main className="min-h-screen px-4 py-12">
      {/* Cosmic bg */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(124,58,237,0.08), transparent 60%), radial-gradient(ellipse 50% 40% at 90% 100%, rgba(6,182,212,0.06), transparent 60%), #0A0A0F',
        }}
      />

      <div className="max-w-4xl mx-auto space-y-8">
        <header className="space-y-2">
          <p className="text-white/50 text-sm">{getGreeting(firstName)}</p>
          <h1 className="text-4xl md:text-5xl font-display font-bold gradient-text-kosha">
            Bienvenue chez {APP_NAME}
          </h1>
        </header>

        {/* Moment WOW (BRIEF §2 — placeholder P1, vrais KPIs en P2) */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass rounded-2xl p-5">
            <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Score d&apos;Humanité</p>
            <p className="text-3xl font-display font-bold gradient-text-kosha">
              {(profile?.score_humanite ?? 5.0).toFixed(1)}
              <span className="text-base text-white/40">/10</span>
            </p>
            <p className="text-white/40 text-xs mt-2">Tu démarres au médian</p>
          </div>
          <div className="glass rounded-2xl p-5">
            <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Fil de Vie</p>
            <p className="text-3xl font-display font-bold gradient-text-kosha">
              {profile?.fil_de_vie_count ?? 0}
            </p>
            <p className="text-white/40 text-xs mt-2">action(s) positive(s)</p>
          </div>
          <div className="glass rounded-2xl p-5">
            <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Niveau d&apos;éveil</p>
            <p className="text-3xl font-display font-bold gradient-text-kosha">
              {profile?.awakening_level ?? 1}
              <span className="text-base text-white/40">/10</span>
            </p>
            <p className="text-white/40 text-xs mt-2">Plan : {profile?.plan ?? 'free'}</p>
          </div>
        </section>

        {/* Roadmap KOSHA — features arrivent dans les phases P2-P10 */}
        <section className="glass rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-display font-semibold">L&apos;univers se construit</h2>
          <p className="text-white/65 text-sm leading-relaxed">
            Tu es parmi les premiers. Les modules arrivent un par un :
          </p>
          <ul className="space-y-2 text-sm text-white/70">
            <li className="flex items-start gap-2">
              <span className="text-violet-400 mt-1">●</span>
              <span><strong className="text-white">Fil de Vie & Score d&apos;Humanité</strong> — tracking irréversible de tes actions positives</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-1">●</span>
              <span><strong className="text-white">Cagnottes</strong> — 5 types, IA reformulation, redistribution Treezor SEPA</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-1">●</span>
              <span><strong className="text-white">Aria</strong> — assistante IA universelle qui agit, pas juste qui répond</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-1">●</span>
              <span><strong className="text-white">Missions</strong> — 8 sources de gains réels (parrainage, redistribution mensuelle CA)</span>
            </li>
          </ul>
        </section>

        <SignOutButton />
      </div>
    </main>
  )
}

function SignOutButton() {
  return (
    <form action="/api/auth/signout" method="post">
      <button
        type="submit"
        className="text-white/40 hover:text-white/70 text-sm transition-colors"
      >
        Se déconnecter
      </button>
    </form>
  )
}
