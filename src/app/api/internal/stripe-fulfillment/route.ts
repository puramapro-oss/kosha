/**
 * POST /api/internal/stripe-fulfillment
 * Reçoit les événements Stripe VÉRIFIÉS par karma (dispatcher central).
 * Authentifié par INTERNAL_WEBHOOK_SECRET + re-vérifie signature Stripe (défense en profondeur).
 *
 * Événements gérés :
 *   - checkout.session.completed : si metadata.kind = cagnotte_contribution
 *     → INSERT cagnotte_contributions (succeeded) → trigger SQL fait le reste
 *     → INSERT argent_memoire (OpenTimestamps stamp en background)
 *
 *  Réponse rapide (< 5s) — work async ne bloque pas l'ack.
 */
import { NextResponse, type NextRequest } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase'
import { hashPayload, stampHash } from '@/lib/opentimestamps'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  // 1. Vérif secret interne partagé w/ karma
  const internalSecret = req.headers.get('x-internal-secret')
  if (internalSecret !== process.env.INTERNAL_WEBHOOK_SECRET) {
    console.warn('[stripe-fulfillment] invalid internal secret')
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  // 2. Défense en profondeur : re-vérifier signature Stripe
  const sig = req.headers.get('x-stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  const rawBody = await req.text()

  if (!sig || !secret) {
    console.warn('[stripe-fulfillment] missing signature or secret')
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, secret)
  } catch (e) {
    console.warn('[stripe-fulfillment] signature verification failed', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const md = session.metadata ?? {}

    if (md.kind === 'cagnotte_contribution' && md.cagnotte_id && md.contributor_id && session.amount_total) {
      try {
        await handleCagnotteContribution(session, md)
      } catch (e) {
        console.error('[stripe/webhook] handleCagnotteContribution failed', e instanceof Error ? e.message : e)
      }
    }
  }

  // ack rapide
  return NextResponse.json({ received: true })
}

async function handleCagnotteContribution(
  session: Stripe.Checkout.Session,
  md: Stripe.Metadata
): Promise<void> {
  const service = createServiceClient()
  const cagnotteId = md.cagnotte_id as string
  const contributorId = md.contributor_id as string
  const anonymous = md.anonymous === '1'
  const message = (md.message as string | undefined) ?? null
  const amountCents = session.amount_total ?? 0

  // Idempotence : si on a déjà cette session_id, on skip
  const { data: existing } = await service
    .from('cagnotte_contributions')
    .select('id')
    .eq('stripe_session_id', session.id)
    .maybeSingle()

  if (existing) {
    console.warn('[stripe/webhook] duplicate session, skipping', session.id)
    return
  }

  // Cagnotte (titre pour memoire)
  const { data: cagnotte } = await service
    .from('cagnottes')
    .select('title')
    .eq('id', cagnotteId)
    .maybeSingle()

  if (!cagnotte) {
    console.error('[stripe/webhook] cagnotte not found', cagnotteId)
    return
  }

  // INSERT contribution succeeded → trigger SQL gère raised_amount + split + fil_de_vie + impact_global
  const paidAt = new Date().toISOString()
  const { data: contribution, error } = await service
    .from('cagnotte_contributions')
    .insert({
      cagnotte_id: cagnotteId,
      contributor_id: contributorId,
      amount_cents: amountCents,
      message: message?.slice(0, 280) ?? null,
      anonymous,
      paid_via: 'stripe',
      stripe_session_id: session.id,
      stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
      status: 'succeeded',
      paid_at: paidAt,
    })
    .select('id')
    .single()

  if (error || !contribution) {
    console.error('[stripe/webhook] contribution insert failed', error?.message)
    return
  }

  // Argent à mémoire — OpenTimestamps stamp (async, ne bloque pas)
  const actionLabel = `Don à « ${(cagnotte.title as string).slice(0, 60)} »`
  const payload = {
    contribution_id: contribution.id,
    from_user_id: contributorId,
    to_cagnotte_id: cagnotteId,
    amount_cents: amountCents,
    action_label: actionLabel,
    timestamp_iso: paidAt,
  }
  const hash = hashPayload(payload)

  // Stamp en background — log entry quoi qu'il arrive
  stampAndPersist(contribution.id, contributorId, cagnotteId, amountCents, actionLabel, hash, paidAt).catch((e) => {
    console.error('[stripe/webhook] stamp persistence failed', e)
  })
}

async function stampAndPersist(
  contributionId: string,
  fromUserId: string,
  toCagnotteId: string,
  amountCents: number,
  actionLabel: string,
  hash: string,
  stampedAt: string
): Promise<void> {
  const service = createServiceClient()
  const stamp = await stampHash(hash, { timeoutMs: 4000 })

  await service.from('argent_memoire').insert({
    contribution_id: contributionId,
    from_user_id: fromUserId,
    to_cagnotte_id: toCagnotteId,
    action_label: actionLabel,
    amount_cents: amountCents,
    hash_sha256: hash,
    ots_proof_base64: stamp.ots_proof_base64,
    stamped_at: stampedAt,
  })
}
