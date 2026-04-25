/**
 * POST /api/aria/reformulate
 * Reformule (titre + description) une cagnotte via Aria pour clarté/confiance.
 * Pas d'écriture DB ici — juste un endpoint stateless appelé par le wizard.
 * Auth requis (anti-abus). Pas de cagnotte sauvée encore.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase-server'
import { askAriaJSON, getAriaSystemPrompt, MODEL_MAIN } from '@/lib/claude'

export const runtime = 'nodejs'
export const maxDuration = 30

const Body = z.object({
  type: z.enum(['communautaire', 'projet_vie', 'action_immediate', 'humanitaire', 'hybride']),
  title: z.string().trim().min(4).max(80),
  description: z.string().trim().min(20).max(2000),
})

interface AriaReformulation {
  title: string
  description: string
  impact_phrase: string
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let body
  try {
    body = Body.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Données invalides.' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, plan, score_humanite, fil_de_vie_count')
    .eq('id', user.id)
    .single()

  const systemPrompt = getAriaSystemPrompt({
    full_name: profile?.full_name ?? null,
    plan: profile?.plan ?? null,
    score_humanite: profile?.score_humanite ?? null,
    fil_de_vie_count: profile?.fil_de_vie_count ?? null,
  })

  const userMessage = `Reformule cette cagnotte pour clarté et confiance, sans dénaturer l'intention.

Type: ${body.type}
Titre brut: ${body.title}
Description brute: ${body.description}

Réponds en JSON: { "title": "...", "description": "...", "impact_phrase": "ce que ton don change concrètement" }
- Garde l'authenticité de l'auteur
- Maximum 80 caractères pour le titre
- Maximum 600 caractères pour la description
- impact_phrase = 1 phrase concrète et tangible (pas vague), max 140 caractères
- N'invente AUCUN chiffre ou témoignage`

  try {
    const result = await askAriaJSON<AriaReformulation>(systemPrompt, userMessage, {
      model: MODEL_MAIN,
      maxTokens: 1024,
    })
    return NextResponse.json({
      title: String(result.title || body.title).slice(0, 80),
      description: String(result.description || body.description).slice(0, 600),
      impact_phrase: String(result.impact_phrase || '').slice(0, 140),
    })
  } catch (e) {
    console.error('[aria/reformulate] failed', e)
    // Mode dégradé : on retourne la version brute pour ne pas bloquer
    return NextResponse.json(
      {
        title: body.title,
        description: body.description,
        impact_phrase: '',
        degraded: true,
      },
      { status: 200 }
    )
  }
}
