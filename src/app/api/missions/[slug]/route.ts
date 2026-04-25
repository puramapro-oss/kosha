/**
 * GET /api/missions/[slug] → détail mission + nb completions du user (si authed)
 */
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { countUserCompletions, getMissionBySlug } from '@/lib/missions'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params
  const mission = await getMissionBySlug(slug)
  if (!mission) return NextResponse.json({ error: 'Mission introuvable.' }, { status: 404 })

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userCompletions = 0
  if (user) {
    userCompletions = await countUserCompletions(user.id, mission.id)
  }

  return NextResponse.json({ mission, userCompletions })
}
