import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { getRecentFilDeVie, type FilDeVieEntry } from '@/lib/fil-de-vie'
import { getCurrentScore } from '@/lib/score'
import { isSuperAdmin as isSuperAdminEmail } from '@/lib/constants'
import DashboardClient from '@/components/DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/dashboard')

  // Read profile (auto-created par trigger SQL au signup)
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, score_humanite, fil_de_vie_count, plan, awakening_level, onboarding_completed')
    .eq('id', user.id)
    .single()

  // Force onboarding si pas complété
  if (profile && profile.onboarding_completed === false) {
    redirect('/onboarding')
  }

  const firstName = profile?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'voyageur'

  // Initial data parallèle (server-side)
  const [{ score, components }, entries, communityImpact] = await Promise.all([
    getCurrentScore(user.id),
    getRecentFilDeVie(user.id, 8),
    getLiveCommunityImpact(),
  ])

  // Estimation gains mensuel (BRIEF §6 — Phase 1 simulation, Phase 2 cash réel)
  // Formule : score (0-10) × 4 € de pool projeté (transparent : "estimation simulation")
  const estimatedMonthlyEarnings = Math.round(score * 4 * 100) / 100

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
      <div className="max-w-5xl mx-auto">
        <DashboardClient
          userId={user.id}
          firstName={firstName}
          initialScore={Number(score)}
          initialComponents={components}
          initialEntries={entries as FilDeVieEntry[]}
          initialFilDeVieCount={profile?.fil_de_vie_count ?? 0}
          estimatedMonthlyEarnings={estimatedMonthlyEarnings}
          liveCommunityImpact={communityImpact}
          isSuperAdmin={isSuperAdminEmail(user.email)}
        />
      </div>
    </main>
  )
}

async function getLiveCommunityImpact(): Promise<number> {
  try {
    const service = createServiceClient()
    const { count, error } = await service
      .from('fil_de_vie')
      .select('*', { count: 'exact', head: true })
    if (error) return 0
    return count ?? 0
  } catch {
    return 0
  }
}
