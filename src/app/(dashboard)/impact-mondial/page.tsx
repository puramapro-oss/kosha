import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { getImpactGlobal } from '@/lib/cagnottes'
import ImpactMondialClient from '@/components/ImpactMondialClient'

export const dynamic = 'force-dynamic'

export default async function ImpactMondialPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/impact-mondial')

  const [impactGlobal, recent] = await Promise.all([getImpactGlobal(), getRecentSucceededContributions()])

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

      <div className="max-w-5xl mx-auto space-y-6">
        <Link href="/dashboard" className="inline-block text-white/45 hover:text-white/85 text-sm transition-colors">
          ← Dashboard
        </Link>

        <header>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-1.5">Impact vivant</p>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white">La constellation des intentions.</h1>
          <p className="text-white/55 text-sm mt-2 max-w-xl leading-relaxed">
            Chaque don allume un point. Chaque point est ancré en blockchain Bitcoin.
            Ce qui est fait ici est gravé pour toujours.
          </p>
        </header>

        <ImpactMondialClient
          initial={{
            total_collected_cents: Number(impactGlobal?.total_collected_cents ?? 0),
            contributors_unique: Number(impactGlobal?.contributors_unique ?? 0),
            cagnottes_completed: Number(impactGlobal?.cagnottes_completed ?? 0),
            cagnottes_active: Number(impactGlobal?.cagnottes_active ?? 0),
            recent,
          }}
        />
      </div>
    </main>
  )
}

async function getRecentSucceededContributions() {
  const service = createServiceClient()
  const { data } = await service
    .from('cagnotte_contributions')
    .select('id, amount_cents, paid_at, cagnotte_id')
    .eq('status', 'succeeded')
    .order('paid_at', { ascending: false })
    .limit(20)

  if (!data || data.length === 0) return []

  const cagnotteIds = Array.from(new Set(data.map((r) => r.cagnotte_id as string)))
  const { data: cagnottes } = await service
    .from('cagnottes')
    .select('id, title, geolocation_label')
    .in('id', cagnotteIds)

  const cagMap = new Map<string, { title: string; geolocation_label: string | null }>()
  for (const c of cagnottes ?? []) {
    cagMap.set(c.id as string, {
      title: (c.title as string) ?? 'Cagnotte',
      geolocation_label: (c.geolocation_label as string | null) ?? null,
    })
  }

  return data.map((row) => {
    const c = cagMap.get(row.cagnotte_id as string)
    return {
      id: row.id as string,
      amount_cents: row.amount_cents as number,
      paid_at: row.paid_at as string | null,
      cagnotte_title: c?.title ?? 'Cagnotte',
      cagnotte_geo: c?.geolocation_label ?? null,
    }
  })
}
