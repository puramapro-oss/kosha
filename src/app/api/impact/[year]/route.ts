/**
 * GET /api/impact/[year] → rapport annuel personnel JSON
 */
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getYearlyReport } from '@/lib/impact'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ year: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const { year } = await ctx.params
  const yearInt = parseInt(year, 10)
  if (Number.isNaN(yearInt) || yearInt < 2025 || yearInt > new Date().getFullYear() + 1) {
    return NextResponse.json({ error: 'Année invalide.' }, { status: 400 })
  }

  try {
    const report = await getYearlyReport(user.id, yearInt)
    return NextResponse.json({ report })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur génération rapport.' }, { status: 500 })
  }
}
