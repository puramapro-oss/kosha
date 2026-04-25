/**
 * UAT P3 — Stripe Webhook E2E (autonome, sans clé test, sans dashboard)
 * Stratégie : on signe nous-mêmes un event Stripe valide avec STRIPE_WEBHOOK_SECRET
 * et on POST sur notre webhook prod. Ça teste 100% de NOTRE code (handler + trigger SQL
 * + idempotence + OTS) sans dépendre du paiement Stripe lui-même.
 *
 * Le test couvre :
 *   12. Signature HMAC valide → contribution succeeded + raised + split 70/15/5/10
 *       + fil_de_vie + impact_global + argent_memoire OTS
 *   13. Re-POST même event → idempotent (skip 2ème, toujours 1 seule contribution)
 *   14. Signature invalide → 400 + zéro effet DB
 */
import { test, expect } from '@playwright/test'
import * as crypto from 'node:crypto'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { adminClient, createUatUser, deleteUatUser, loginAs, log, shot } from './helpers'

const BASE = process.env.UAT_BASE_URL ?? 'https://kosha.purama.dev'

// Charge .env.local pour STRIPE_WEBHOOK_SECRET (Playwright ne le fait pas tout seul)
function loadEnvLocal() {
  const file = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(file)) return
  const lines = fs.readFileSync(file, 'utf8').split('\n')
  for (const line of lines) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
loadEnvLocal()

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET
if (!WEBHOOK_SECRET) {
  throw new Error('STRIPE_WEBHOOK_SECRET manquant — impossible de signer les events de test')
}

let owner: { id: string; email: string; password: string }
let contributor: { id: string; email: string; password: string }
let cagnotteId: string
let firstSessionId: string
let firstEventPayload: string
let firstEventSig: string
let firstAmountCents = 0

function buildSignedEvent(opts: {
  sessionId: string
  amountCents: number
  cagnotteId: string
  contributorId: string
  anonymous?: boolean
  message?: string
}): { payload: string; signature: string; eventId: string } {
  const eventId = 'evt_uat_' + crypto.randomBytes(8).toString('hex')
  const event = {
    id: eventId,
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    type: 'checkout.session.completed',
    livemode: true,
    pending_webhooks: 1,
    request: { id: null, idempotency_key: null },
    data: {
      object: {
        id: opts.sessionId,
        object: 'checkout.session',
        amount_total: opts.amountCents,
        currency: 'eur',
        customer_email: 'uat@kosha-test.purama.dev',
        metadata: {
          kind: 'cagnotte_contribution',
          cagnotte_id: opts.cagnotteId,
          contributor_id: opts.contributorId,
          anonymous: opts.anonymous ? '1' : '0',
          message: opts.message ?? '',
        },
        mode: 'payment',
        payment_intent: 'pi_uat_' + crypto.randomBytes(8).toString('hex'),
        payment_status: 'paid',
        status: 'complete',
      },
    },
  }
  const payload = JSON.stringify(event)
  const timestamp = Math.floor(Date.now() / 1000)
  const signedPayload = `${timestamp}.${payload}`
  const signature = crypto
    .createHmac('sha256', WEBHOOK_SECRET as string)
    .update(signedPayload, 'utf8')
    .digest('hex')
  return { payload, signature: `t=${timestamp},v1=${signature}`, eventId }
}

test.describe.configure({ mode: 'serial' })

test.describe('UAT P3 STRIPE — Webhook autonome (signature HMAC)', () => {
  test.beforeAll(async () => {
    log('=== UAT P3 STRIPE WEBHOOK setup ===')

    owner = await createUatUser({ suffix: 'wbown-' + Date.now().toString(36) })
    contributor = await createUatUser({ suffix: 'wbctr-' + Date.now().toString(36) })

    const admin = adminClient()
    // Profils onboarded
    await admin
      .from('profiles')
      .update({ onboarding_completed: true, score_humanite: 5.0, full_name: 'UAT Owner' })
      .eq('id', owner.id)
    await admin
      .from('profiles')
      .update({ onboarding_completed: true, score_humanite: 5.0, full_name: 'UAT Contributor' })
      .eq('id', contributor.id)

    // Owner crée une cagnotte (target 100€)
    const { data, error } = await admin
      .from('cagnottes')
      .insert({
        owner_id: owner.id,
        title: 'UAT Webhook Stripe ' + Date.now().toString(36),
        description: 'Cagnotte créée par UAT pour tester le webhook Stripe avec signature HMAC valide.',
        type: 'humanitaire',
        target_amount_cents: 10000, // 100 €
        ends_at: new Date(Date.now() + 30 * 86_400_000).toISOString(),
        status: 'active',
      })
      .select('id')
      .single()

    if (error || !data) throw new Error('cagnotte insert failed: ' + error?.message)
    cagnotteId = data.id
    log(`✅ Cagnotte créée ${cagnotteId} (owner=${owner.id})`)
  })

  test.afterAll(async () => {
    log('=== UAT P3 STRIPE WEBHOOK cleanup ===')
    const admin = adminClient()
    await admin.from('argent_memoire').delete().eq('to_cagnotte_id', cagnotteId)
    await admin.from('cagnotte_splits').delete().eq('cagnotte_id', cagnotteId)
    await admin.from('cagnotte_contributions').delete().eq('cagnotte_id', cagnotteId)
    await admin.from('cagnottes').delete().eq('id', cagnotteId)
    await admin.from('fil_de_vie').delete().in('user_id', [owner.id, contributor.id])
    await deleteUatUser(owner.id)
    await deleteUatUser(contributor.id)
    log('✅ cleanup done')
  })

  test('12. Webhook signé HMAC → contribution succeeded + cagnotte raised + split 70/15/5/10 + fil_de_vie + impact', async ({
    page,
  }) => {
    // 1. Login contributor + récupère session Stripe réelle (cs_live_*)
    await loginAs(page, contributor.email, contributor.password)

    firstAmountCents = 1500 // 15 €
    const contribResp = await page.context().request.post(`${BASE}/api/cagnottes/${cagnotteId}/contribute`, {
      data: { amount_cents: firstAmountCents, anonymous: false, message: 'Don UAT webhook' },
      headers: { 'Content-Type': 'application/json' },
    })
    expect(contribResp.status(), 'POST /contribute doit renvoyer 200').toBe(200)
    const contribJson = (await contribResp.json()) as { url: string; session_id: string }
    expect(contribJson.session_id).toMatch(/^cs_(live|test)_/)
    firstSessionId = contribJson.session_id
    log(`✅ Stripe session créée : ${firstSessionId}`)

    // 2. Construit + signe event checkout.session.completed
    const built = buildSignedEvent({
      sessionId: firstSessionId,
      amountCents: firstAmountCents,
      cagnotteId,
      contributorId: contributor.id,
      anonymous: false,
      message: 'Don UAT webhook',
    })
    firstEventPayload = built.payload
    firstEventSig = built.signature
    log(`✅ Event signé HMAC-SHA256 (eventId=${built.eventId})`)

    // 3. POST sur notre webhook
    const webhookResp = await page.context().request.post(`${BASE}/api/stripe/webhook`, {
      data: firstEventPayload,
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': firstEventSig,
      },
    })
    expect(webhookResp.status(), 'webhook doit renvoyer 200').toBe(200)
    const webhookJson = (await webhookResp.json()) as { received?: boolean }
    expect(webhookJson.received).toBe(true)
    log('✅ Webhook signature validée + 200 OK')

    // 4. Wait pour trigger SQL
    await page.waitForTimeout(2000)

    // 5. Vérifications DB
    const admin = adminClient()

    // 5.a contribution succeeded
    const { data: contrib } = await admin
      .from('cagnotte_contributions')
      .select('id, amount_cents, status, contributor_id, anonymous, paid_via, stripe_session_id')
      .eq('stripe_session_id', firstSessionId)
      .single()
    expect(contrib, 'contribution doit exister').toBeTruthy()
    expect(contrib?.status).toBe('succeeded')
    expect(contrib?.amount_cents).toBe(firstAmountCents)
    expect(contrib?.contributor_id).toBe(contributor.id)
    expect(contrib?.anonymous).toBe(false)
    expect(contrib?.paid_via).toBe('stripe')
    log(`✅ Contribution ${contrib?.id} status=succeeded amount=${contrib?.amount_cents}c`)

    // 5.b cagnotte raised + contributors_count
    const { data: cag } = await admin
      .from('cagnottes')
      .select('raised_amount_cents, contributors_count, status')
      .eq('id', cagnotteId)
      .single()
    expect(cag?.raised_amount_cents).toBe(firstAmountCents)
    expect(cag?.contributors_count).toBe(1)
    expect(cag?.status).toBe('active')
    log(`✅ Cagnotte raised=${cag?.raised_amount_cents}c contributors=${cag?.contributors_count}`)

    // 5.c split 70/15/5/10
    const { data: split } = await admin
      .from('cagnotte_splits')
      .select(
        'total_collected_cents, projet_amount_cents, contributors_amount_cents, securite_amount_cents, fonds_vida_amount_cents'
      )
      .eq('cagnotte_id', cagnotteId)
      .single()
    expect(split?.total_collected_cents).toBe(1500)
    expect(split?.projet_amount_cents).toBe(1050) // 70%
    expect(split?.contributors_amount_cents).toBe(225) // 15%
    expect(split?.securite_amount_cents).toBe(75) // 5%
    expect(split?.fonds_vida_amount_cents).toBe(150) // 10%
    log(
      `✅ Split 70/15/5/10 = ${split?.projet_amount_cents}/${split?.contributors_amount_cents}/${split?.securite_amount_cents}/${split?.fonds_vida_amount_cents}`
    )

    // 5.d fil_de_vie 'cagnotte_contributed'
    const { data: fdv } = await admin
      .from('fil_de_vie')
      .select('id, action_type, action_label, impact_data')
      .eq('user_id', contributor.id)
      .eq('action_type', 'cagnotte_contributed')
      .single()
    expect(fdv).toBeTruthy()
    expect(fdv?.action_label).toMatch(/Don à/)
    const fdvData = fdv?.impact_data as { cagnotte_id: string; amount_cents: number }
    expect(fdvData?.cagnotte_id).toBe(cagnotteId)
    expect(fdvData?.amount_cents).toBe(firstAmountCents)
    log(`✅ Fil de Vie cagnotte_contributed inséré : "${fdv?.action_label}"`)

    // 5.e impact_global incrémenté
    const { data: impact } = await admin
      .from('impact_global')
      .select('total_collected_cents, contributors_unique, cagnottes_active')
      .eq('id', 1)
      .single()
    expect(impact?.total_collected_cents ?? 0).toBeGreaterThanOrEqual(firstAmountCents)
    expect(impact?.contributors_unique ?? 0).toBeGreaterThanOrEqual(1)
    log(
      `✅ Impact global total=${impact?.total_collected_cents}c contributors_unique=${impact?.contributors_unique} cagnottes_active=${impact?.cagnottes_active}`
    )

    // 5.f argent_memoire (peut être en cours si OTS calendar lent — wait 4s puis check non-bloquant)
    await page.waitForTimeout(4000)
    const { data: memoire } = await admin
      .from('argent_memoire')
      .select('id, hash_sha256, ots_proof_base64, action_label, amount_cents')
      .eq('contribution_id', contrib?.id ?? '')
      .maybeSingle()
    if (memoire) {
      expect(memoire.hash_sha256).toMatch(/^[0-9a-f]{64}$/)
      expect(memoire.amount_cents).toBe(firstAmountCents)
      log(`✅ Argent Mémoire OTS hash=${memoire.hash_sha256.slice(0, 16)}… proof=${memoire.ots_proof_base64?.length ?? 0}c`)
    } else {
      log('⚠️  Argent Mémoire pas encore créée (OTS calendar timeout — pas bloquant pour ce test)')
    }

    // 6. Page cagnotte montre le nouveau total
    await page.goto(`${BASE}/cagnottes/${cagnotteId}`, { waitUntil: 'load' })
    await shot(page, '12-cagnotte-after-webhook')
  })

  test('13. Idempotence : re-POST même session_id → 1 seule contribution en DB', async ({ page }) => {
    // Re-POST EXACTEMENT le même event (même session_id, même payload)
    const webhookResp = await page.context().request.post(`${BASE}/api/stripe/webhook`, {
      data: firstEventPayload,
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': firstEventSig,
      },
    })
    // Stripe peut renvoyer 400 si signature trop vieille (>5min tolerance) — on accepte 200 OU 400
    // mais l'important c'est qu'il n'y ait PAS de doublon en DB.
    log(`re-POST webhook status=${webhookResp.status()}`)

    await page.waitForTimeout(1500)

    const admin = adminClient()
    const { data: contribs } = await admin
      .from('cagnotte_contributions')
      .select('id')
      .eq('stripe_session_id', firstSessionId)
    expect(contribs?.length, 'idempotence : 1 seule contribution pour ce session_id').toBe(1)
    log(`✅ Idempotence respectée : ${contribs?.length} contribution(s) pour session ${firstSessionId.slice(0, 24)}…`)

    // Vérifier que cagnotte raised n'a pas doublé
    const { data: cag } = await admin
      .from('cagnottes')
      .select('raised_amount_cents, contributors_count')
      .eq('id', cagnotteId)
      .single()
    expect(cag?.raised_amount_cents).toBe(firstAmountCents)
    expect(cag?.contributors_count).toBe(1)
    log(`✅ Cagnotte raised inchangé = ${cag?.raised_amount_cents}c (pas de doublon)`)
  })

  test('14. Signature invalide → 400 + zéro effet DB', async ({ page }) => {
    // Construit un event valide avec une session_id NEUVE
    const fakeSessionId = 'cs_live_uat_fake_' + crypto.randomBytes(12).toString('hex')
    const event = {
      id: 'evt_uat_bad_' + crypto.randomBytes(8).toString('hex'),
      type: 'checkout.session.completed',
      data: {
        object: {
          id: fakeSessionId,
          amount_total: 9999,
          metadata: {
            kind: 'cagnotte_contribution',
            cagnotte_id: cagnotteId,
            contributor_id: contributor.id,
            anonymous: '0',
            message: 'invalid sig test',
          },
        },
      },
    }
    const payload = JSON.stringify(event)
    // SIGNATURE BIDON
    const badSig = `t=${Math.floor(Date.now() / 1000)},v1=${'0'.repeat(64)}`

    const webhookResp = await page.context().request.post(`${BASE}/api/stripe/webhook`, {
      data: payload,
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': badSig,
      },
    })
    expect(webhookResp.status(), 'signature invalide doit renvoyer 400').toBe(400)
    const errJson = (await webhookResp.json()) as { error?: string }
    expect(errJson.error).toMatch(/Invalid signature/i)
    log(`✅ Signature invalide rejetée 400 : "${errJson.error}"`)

    // Vérifie qu'aucune contribution n'a été insérée
    await page.waitForTimeout(1000)
    const admin = adminClient()
    const { data: contribs } = await admin
      .from('cagnotte_contributions')
      .select('id')
      .eq('stripe_session_id', fakeSessionId)
    expect(contribs?.length ?? 0).toBe(0)
    log(`✅ Aucun insert DB pour session bidon (${contribs?.length ?? 0} ligne)`)
  })
})
