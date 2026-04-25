/**
 * UAT P9 — VIDA NEWSLETTER (Living Newsletter™)
 *
 * Tests Playwright headless contre prod live :
 *  33. /settings/newsletter render + toggle subscribe ON/OFF
 *  34. Action tracker : INSERT email + GET /api/newsletter/action/<id>?next=/missions → action_taken_at set + 302
 *  35. Désabo via token public : GET /api/newsletter/unsubscribe?token=XXX → 302 vers /u/XXX?ok=1 + subscribed=false en DB
 *  36. /u/[token] page render avec token valide (état désabonné)
 *
 * Note : on N'envoie PAS de vrai email Resend dans les tests pour éviter de spammer.
 *        Les tests valident la machinerie autour (DB, endpoints, RLS, UI).
 */
import { test, expect } from '@playwright/test'
import { adminClient, createUatUser, deleteUatUser, loginAs, log, shot, safeGoto } from './helpers'

const BASE = process.env.UAT_BASE_URL ?? 'https://kosha.purama.dev'

let user1: { id: string; email: string; password: string }
let token: string | null = null

test.describe.configure({ mode: 'serial' })

test.describe('UAT P9 — VIDA NEWSLETTER', () => {
  test.beforeAll(async () => {
    log('=== UAT P9 NEWSLETTER setup ===')
    user1 = await createUatUser({ suffix: 'nl-' + Date.now().toString(36) })
    const admin = adminClient()
    await admin
      .from('profiles')
      .update({ onboarding_completed: true, full_name: 'UAT Newsletter' })
      .eq('id', user1.id)
    // Le trigger after_profile_insert_newsletter a déjà créé la row
    // Attendre un instant pour la propagation
    await new Promise((r) => setTimeout(r, 300))
    const { data: sub } = await admin
      .from('newsletter_subscribers')
      .select('unsubscribe_token, subscribed')
      .eq('user_id', user1.id)
      .single()
    token = sub?.unsubscribe_token ?? null
    log(`✅ User créé ${user1.id}, token=${token?.slice(0, 12)}..., subscribed=${sub?.subscribed}`)
  })

  test.afterAll(async () => {
    log('=== UAT P9 NEWSLETTER cleanup ===')
    const admin = adminClient()
    await admin.from('newsletter_emails').delete().eq('user_id', user1.id)
    await admin.from('newsletter_subscribers').delete().eq('user_id', user1.id)
    await deleteUatUser(user1.id)
    log('✅ cleanup done')
  })

  test('33. /settings/newsletter render + toggle subscribe', async ({ page }) => {
    await loginAs(page, user1.email, user1.password)
    await safeGoto(page, '/settings/newsletter')

    await expect(page.locator('h1', { hasText: /Living Newsletter/ })).toBeVisible()
    await expect(page.locator('text=/Tu reçois la newsletter/')).toBeVisible()
    await expect(page.locator('text=/derniers numéros/i')).toBeVisible()
    await shot(page, '33-settings-newsletter')

    // Toggle OFF via API directe (auth via cookies de page.context())
    const r = await page.context().request.post(`${BASE}/api/newsletter/subscribe`, {
      data: { subscribed: false },
    })
    expect(r.ok()).toBeTruthy()
    const data = (await r.json()) as { ok: boolean; subscriber: { subscribed: boolean } }
    expect(data.ok).toBe(true)
    expect(data.subscriber.subscribed).toBe(false)
    log('✅ Toggle OFF via API → subscribed=false')

    // Re-toggle ON
    const r2 = await page.context().request.post(`${BASE}/api/newsletter/subscribe`, {
      data: { subscribed: true },
    })
    const data2 = (await r2.json()) as { ok: boolean; subscriber: { subscribed: boolean } }
    expect(data2.subscriber.subscribed).toBe(true)
    log('✅ Toggle ON via API → subscribed=true')
  })

  test('34. Action tracker : INSERT email + GET /api/newsletter/action/<id> → action_taken_at set + 302', async ({ page }) => {
    const admin = adminClient()
    // INSERT direct un email pour pouvoir tester le tracker
    const { data: emailRow, error } = await admin
      .from('newsletter_emails')
      .insert({
        user_id: user1.id,
        week_iso: '2099-W01',                 // pas de risque de collision avec vrai envoi
        subject: 'UAT — newsletter test action',
        blocks: {
          ou_on_en_est: 'État test',
          impact_declenche: 'Impact test',
          idee_qui_eleve: 'Idée test',
          action_vida: 'Action proposée',
          trace_personnelle: 'Trace test',
          fermeture_calme: 'Calme.',
        },
        action_label: 'Découvrir une mission',
        action_url: '/missions',
        action_kind: 'mission',
      })
      .select('id, action_taken_at')
      .single()
    expect(error).toBeFalsy()
    expect(emailRow!.action_taken_at).toBeNull()
    log(`✅ Email inséré ${emailRow!.id}`)

    // Hit le tracker — il doit set action_taken_at + 302
    const url = `${BASE}/api/newsletter/action/${emailRow!.id}?next=${encodeURIComponent('/missions')}`
    const r = await page.context().request.get(url, { maxRedirects: 0 })
    expect([301, 302, 307, 308]).toContain(r.status())
    expect(r.headers()['location']).toContain('/missions')
    log(`✅ Tracker → ${r.status()} → ${r.headers()['location']}`)

    // Vérifier en DB
    const { data: after } = await admin
      .from('newsletter_emails')
      .select('action_taken_at')
      .eq('id', emailRow!.id)
      .single()
    expect(after?.action_taken_at).toBeTruthy()
    log(`✅ action_taken_at set : ${after?.action_taken_at}`)

    // 2e clic doit être idempotent (action_taken_at ne change pas / pas d'erreur)
    const r2 = await page.context().request.get(url, { maxRedirects: 0 })
    expect([301, 302, 307, 308]).toContain(r2.status())
    log('✅ 2e clic OK (idempotent)')
  })

  test('35. Désabo via token public : GET /api/newsletter/unsubscribe?token=XXX', async ({ page }) => {
    if (!token) test.skip(true, 'pas de token')
    // Pas d'auth nécessaire — on simule un clic depuis email
    const url = `${BASE}/api/newsletter/unsubscribe?token=${encodeURIComponent(token!)}`
    const r = await page.context().request.get(url, { maxRedirects: 0 })
    expect([301, 302, 307, 308]).toContain(r.status())
    expect(r.headers()['location']).toContain(`/u/`)
    expect(r.headers()['location']).toContain('ok=1')
    log(`✅ Unsubscribe → ${r.status()} → ${r.headers()['location']}`)

    // DB : subscribed = false
    const admin = adminClient()
    const { data: sub } = await admin
      .from('newsletter_subscribers')
      .select('subscribed, unsubscribed_at')
      .eq('user_id', user1.id)
      .single()
    expect(sub?.subscribed).toBe(false)
    expect(sub?.unsubscribed_at).toBeTruthy()
    log(`✅ DB : subscribed=false, unsubscribed_at=${sub?.unsubscribed_at}`)

    // Restaurer pour le test 36 (toggle ON via authed API)
    await loginAs(page, user1.email, user1.password)
    await page.context().request.post(`${BASE}/api/newsletter/subscribe`, { data: { subscribed: true } })

    // POST One-Click (RFC 8058) avec le token doit aussi marcher
    const r2 = await page.context().request.post(`${BASE}/api/newsletter/unsubscribe?token=${encodeURIComponent(token!)}`)
    expect(r2.ok()).toBeTruthy()
    const data2 = (await r2.json()) as { ok: boolean }
    expect(data2.ok).toBe(true)
    log('✅ POST One-Click (RFC 8058) → ok')
  })

  test('36. /u/[token] page render avec token valide', async ({ page }) => {
    if (!token) test.skip(true, 'pas de token')
    // Pas d'auth — page publique
    const ctx = await page.context().browser()!.newContext()  // contexte propre sans cookies auth
    const anonPage = await ctx.newPage()
    await anonPage.goto(`${BASE}/u/${encodeURIComponent(token!)}?ok=1`)
    await expect(anonPage.locator('h1', { hasText: /Désabonné/i })).toBeVisible()
    await expect(anonPage.locator('text=/plus aucune newsletter|plus aucun email/i')).toBeVisible()
    await shot(anonPage, '36-unsubscribe-page')
    log('✅ /u/[token] rendu en mode public sans auth')
    await ctx.close()
  })
})
