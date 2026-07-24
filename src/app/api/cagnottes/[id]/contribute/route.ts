/**
 * POST /api/cagnottes/[id]/contribute
 * Crée une session Stripe Checkout one-shot et retourne l'URL de redirection.
 * La contribution est PERSISTÉE par le webhook après paiement réussi (atomicité).
 */
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { CagnotteContributeSchema } from '@/lib/cagnottes'
import { getStripe } from '@/lib/stripe'
import { APP_URL } from '@/lib/constants'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id: cagnotteId } = await ctx.params

  let body
  try {
    body = CagnotteContributeSchema.parse(await req.json())
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Données invalides'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  // Vérifie cagnotte active
  const service = createServiceClient()
  const { data: cagnotte } = await service
    .from('cagnottes')
    .select('id, title, status, owner_id')
    .eq('id', cagnotteId)
    .maybeSingle()

  if (!cagnotte) return NextResponse.json({ error: 'Cagnotte introuvable.' }, { status: 404 })
  if (cagnotte.status !== 'active') {
    return NextResponse.json({ error: 'Cette cagnotte n\'accepte plus de contributions.' }, { status: 409 })
  }
  if (cagnotte.owner_id === user.id) {
    return NextResponse.json({ error: 'Tu ne peux pas contribuer à ta propre cagnotte.' }, { status: 403 })
  }

  const stripe = getStripe()
  let session
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: body.amount_cents,
            product_data: {
              name: `Cagnotte KOSHA — ${cagnotte.title.slice(0, 60)}`,
              description: `Contribution à la cagnotte « ${cagnotte.title.slice(0, 80)} »`,
              metadata: { cagnotte_id: cagnotteId, app: 'kosha' },
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        kind: 'cagnotte_contribution',
        cagnotte_id: cagnotteId,
        contributor_id: user.id,
        anonymous: body.anonymous ? '1' : '0',
        message: (body.message ?? '').slice(0, 280),
        app_slug: 'kosha',
      },
      success_url: `${APP_URL}/cagnottes/${cagnotteId}?contribution=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/cagnottes/${cagnotteId}?contribution=cancelled`,
    })
  } catch (e) {
    console.error('[cagnottes/contribute] stripe error', e)
    return NextResponse.json({ error: 'Stripe indisponible. Réessaie dans un instant.' }, { status: 502 })
  }

  if (!session.url) {
    return NextResponse.json({ error: 'Stripe n\'a pas renvoyé d\'URL.' }, { status: 500 })
  }

  return NextResponse.json({ url: session.url, session_id: session.id })
}
