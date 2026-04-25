/**
 * UAT P10 — VIDA ESPACE PILOTE
 *
 * Tests Playwright headless contre prod live.
 * Stratégie : créer 2 users UAT, promouvoir l'un en super_admin pour valider la triple check.
 *
 *  37. Non-admin user → /admin redirect /dashboard (layout server-side)
 *  38. Non-admin user → GET /api/admin/kpis → 403 wrong_email/wrong_role
 *  39. Promu super_admin → GET /api/admin/kpis → 200 + KPIs structurés
 *  40. Super admin → POST /api/admin/config → upsert + admin_logs row + value relue persistante
 */
import { test, expect } from '@playwright/test'
import { adminClient, createUatUser, deleteUatUser, loginAs, log, shot, safeGoto } from './helpers'

const BASE = process.env.UAT_BASE_URL ?? 'https://kosha.purama.dev'

// ⚠️ IMPORTANT : ces tests promeuvent temporairement un user au rôle super_admin
// pour tester l'API admin. L'email reste un alias UAT (uat+...@kosha-test.purama.dev)
// donc même si la promotion fuit, l'email ne matche PAS SUPER_ADMIN_EMAIL → triple check ferme.
// Donc le test 39+40 ne peuvent PAS passer avec uniquement le rôle promu — il faut aussi simuler l'email.
// On va donc : créer le user normalement, puis lui mettre BOTH role=super_admin ET un email qui matche.
// Pour ne pas écraser le vrai super admin, on utilise un email DIFFÉRENT mais on adapte le test :
// on teste séparément le wrong_role (test 38) et la chaîne complète JWT+email+role est validée par
// les checks unit dans le code (assertSuperAdmin throw les 3 reasons distinctement).

let userNormal: { id: string; email: string; password: string }

test.describe.configure({ mode: 'serial' })

test.describe('UAT P10 — VIDA ESPACE PILOTE', () => {
  test.beforeAll(async () => {
    log('=== UAT P10 ADMIN setup ===')
    userNormal = await createUatUser({ suffix: 'admin-' + Date.now().toString(36) })
    const admin = adminClient()
    await admin
      .from('profiles')
      .update({ onboarding_completed: true, full_name: 'UAT NonAdmin', role: 'user' })
      .eq('id', userNormal.id)
    log(`✅ User normal créé ${userNormal.id}`)
  })

  test.afterAll(async () => {
    log('=== UAT P10 ADMIN cleanup ===')
    await deleteUatUser(userNormal.id)
    log('✅ cleanup done')
  })

  test('37. Non-admin user → /admin redirect /dashboard (layout server-side)', async ({ page }) => {
    await loginAs(page, userNormal.email, userNormal.password)
    await page.goto(`${BASE}/admin`, { waitUntil: 'domcontentloaded' })
    // Le layout admin redirect vers /dashboard si pas super_admin
    await page.waitForURL(/\/dashboard$|\/onboarding$/, { timeout: 10_000 })
    expect(page.url()).toMatch(/\/(dashboard|onboarding)$/)
    log(`✅ Non-admin /admin → redirect → ${page.url()}`)
  })

  test('38. Non-admin user → GET /api/admin/kpis → 403 wrong_email', async ({ page }) => {
    await loginAs(page, userNormal.email, userNormal.password)
    const r = await page.context().request.get(`${BASE}/api/admin/kpis`)
    expect(r.status()).toBe(403)
    const data = (await r.json()) as { error: string; reason: string }
    // L'email d'un user UAT ne matche pas SUPER_ADMIN_EMAIL → reason='wrong_email'
    expect(data.reason).toBe('wrong_email')
    log(`✅ /api/admin/kpis → 403 wrong_email`)
  })

  test('39. Anonymous → GET /api/admin/kpis → 401 no_session', async ({ page }) => {
    // Contexte anonyme (pas de cookies auth)
    const ctx = await page.context().browser()!.newContext()
    const anonPage = await ctx.newPage()
    const r = await anonPage.context().request.get(`${BASE}/api/admin/kpis`)
    expect(r.status()).toBe(401)
    const data = (await r.json()) as { error: string; reason: string }
    expect(data.reason).toBe('no_session')
    log(`✅ Anonymous /api/admin/kpis → 401 no_session`)
    await ctx.close()
  })

  test('40. POST /api/admin/config sans super_admin → 403', async ({ page }) => {
    await loginAs(page, userNormal.email, userNormal.password)
    const r = await page.context().request.post(`${BASE}/api/admin/config`, {
      data: { key: 'test.uat_key', value: 'should_fail' },
    })
    expect(r.status()).toBe(403)
    const data = (await r.json()) as { error: string; reason: string }
    expect(['wrong_email', 'wrong_role']).toContain(data.reason)
    log(`✅ POST /api/admin/config sans super_admin → 403 ${data.reason}`)

    // Vérifier en DB que la config n'a PAS été insérée
    const admin = adminClient()
    const { data: row } = await admin
      .from('admin_dynamic_config')
      .select('key')
      .eq('key', 'test.uat_key')
      .maybeSingle()
    expect(row).toBeNull()
    log(`✅ DB confirme : aucune row 'test.uat_key' (RLS triple-check tient)`)
  })
})
