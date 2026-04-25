/**
 * GET /api/missions  → liste missions actives (filtre optionnel ?category=)
 *
 * Public (anon visible) — RLS missions_public_select (active=true).
 */
import { NextResponse, type NextRequest } from 'next/server'
import { getActiveMissions, type MissionCategory } from '@/lib/missions'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const category = url.searchParams.get('category') as MissionCategory | null
  const valid: MissionCategory[] = ['ecology', 'social', 'health', 'knowledge', 'creativity']
  const filter = category && valid.includes(category) ? category : undefined

  const missions = await getActiveMissions(filter)
  return NextResponse.json({ missions })
}
