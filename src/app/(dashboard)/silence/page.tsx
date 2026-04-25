import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import SilenceClient from '@/components/SilenceClient'
import type { SilenceConfig } from '@/lib/silence'

export const dynamic = 'force-dynamic'

export default async function SilencePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/silence')

  const service = createServiceClient()
  const { data } = await service.from('silence_mode').select('*').eq('user_id', user.id).maybeSingle()

  const initial: SilenceConfig = data
    ? {
        user_id: user.id,
        enabled: Boolean(data.enabled),
        start_hour: data.start_hour ?? null,
        end_hour: data.end_hour ?? null,
        days_of_week: Array.isArray(data.days_of_week) ? (data.days_of_week as number[]) : [0, 1, 2, 3, 4, 5, 6],
        paused_until: (data.paused_until as string | null) ?? null,
      }
    : {
        user_id: user.id,
        enabled: false,
        start_hour: 22,
        end_hour: 7,
        days_of_week: [0, 1, 2, 3, 4, 5, 6],
        paused_until: null,
      }

  return (
    <main className="min-h-screen px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(124,58,237,0.10), transparent 60%), #0A0A0F',
        }}
      />

      <div className="max-w-xl mx-auto space-y-6">
        <Link href="/dashboard" className="inline-block text-white/45 hover:text-white/85 text-sm transition-colors">
          ← Dashboard
        </Link>

        <header>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-1.5">Mode Silence</p>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white">Le silence est sacré.</h1>
          <p className="text-white/55 text-sm mt-2 leading-relaxed">
            Aucune notification ne percera ces heures. Aria attendra. Le monde aussi.
          </p>
        </header>

        <SilenceClient initial={initial} />
      </div>
    </main>
  )
}
