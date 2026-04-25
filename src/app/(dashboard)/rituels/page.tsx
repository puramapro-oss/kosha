import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import {
  getCurrentRituel,
  getUpcomingRituels,
  getUserParticipations,
  hasParticipated,
  rituelState,
} from '@/lib/rituels'
import RituelsClient from '@/components/RituelsClient'

export const dynamic = 'force-dynamic'

export default async function RituelsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/rituels')

  const [current, upcoming, participations] = await Promise.all([
    getCurrentRituel(),
    getUpcomingRituels(6),
    getUserParticipations(user.id, 8),
  ])

  if (!current) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-display font-bold gradient-text-kosha">Rituels</h1>
        <div className="glass rounded-2xl p-10 text-center">
          <p className="text-white/70">Aucun rituel programmé pour le moment.</p>
          <p className="text-white/50 text-sm mt-2">Le calendrier sera mis à jour très bientôt.</p>
        </div>
      </div>
    )
  }

  const initialState = rituelState(current)
  const userParticipated = initialState === 'live' ? await hasParticipated(user.id, current.id) : false

  return (
    <RituelsClient
      userId={user.id}
      current={current}
      initialState={initialState}
      userParticipated={userParticipated}
      upcoming={upcoming}
      participations={participations}
    />
  )
}
