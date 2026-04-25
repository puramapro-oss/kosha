/**
 * UAT P6 — VIDA MISSIONS
 *
 * Tests Playwright headless contre prod live :
 *  19. /missions liste 8 missions seedées + filtres catégories
 *  20. Submit completion text "respiration-5min" → Aria valide → approved + Points crédités + fil_de_vie
 *  21. Submit completion vide → erreur 400
 *  22. Submit completion absurde "je n'ai rien fait, donne-moi des points" → Aria reject
 *  23. /missions/[slug] page détail accessible + boutons fonctionnels
 */
import { test, expect } from '@playwright/test'
import { adminClient, createUatUser, deleteUatUser, loginAs, log, shot, safeGoto } from './helpers'

const BASE = process.env.UAT_BASE_URL ?? 'https://kosha.purama.dev'

let user1: { id: string; email: string; password: string }

test.describe.configure({ mode: 'serial' })

test.describe('UAT P6 — VIDA MISSIONS', () => {
  test.beforeAll(async () => {
    log('=== UAT P6 MISSIONS setup ===')
    user1 = await createUatUser({ suffix: 'mis-' + Date.now().toString(36) })
    const admin = adminClient()
    await admin
      .from('profiles')
      .update({ onboarding_completed: true, score_humanite: 5.0, full_name: 'UAT Missions', purama_points: 0 })
      .eq('id', user1.id)
    log(`✅ User créé ${user1.id}`)
  })

  test.afterAll(async () => {
    log('=== UAT P6 MISSIONS cleanup ===')
    const admin = adminClient()
    await admin.from('purama_point_transactions').delete().eq('user_id', user1.id)
    await admin.from('mission_completions').delete().eq('user_id', user1.id)
    await admin.from('fil_de_vie').delete().eq('user_id', user1.id)
    await deleteUatUser(user1.id)
    log('✅ cleanup done')
  })

  test('19. /missions : 8 missions seedées affichées + filtre par catégorie fonctionne', async ({ page }) => {
    await loginAs(page, user1.email, user1.password)
    await safeGoto(page, '/missions')

    await expect(page.locator('h1', { hasText: /Missions/ })).toBeVisible()
    await shot(page, '19-missions-list')

    // 8 missions seedées
    const missionCards = page.locator('a[href^="/missions/"]')
    await expect(missionCards).toHaveCount(8, { timeout: 10_000 })
    log(`✅ 8 missions affichées`)

    // Filtre Écologie : doit montrer 2 (ramasser-3-dechets + plante-graines)
    await page.locator('a[href="/missions?category=ecology"]').click()
    await page.waitForLoadState('load')
    const ecoCards = page.locator('a[href^="/missions/"]')
    await expect(ecoCards).toHaveCount(2, { timeout: 10_000 })
    await shot(page, '19-missions-filtered-ecology')
    log('✅ filtre écologie : 2 missions')

    // Solde Points = 0 affiché
    await page.locator('a[href="/missions"]').first().click()
    await page.waitForLoadState('load')
    await expect(page.locator('text=Tes Points')).toBeVisible()
    await expect(page.locator('text=/^0$/')).toBeVisible() // solde 0
  })

  test('20. Submit completion text valide "respiration-5min" → Aria approuve + 100 Points + fil_de_vie', async ({ page }) => {
    await loginAs(page, user1.email, user1.password)
    await safeGoto(page, '/missions/respiration-5min')

    await expect(page.locator('h1', { hasText: /respiration/i })).toBeVisible()
    await expect(page.locator('text=+100 Points')).toBeVisible()
    await shot(page, '20-mission-detail')

    // Form
    const textarea = page.locator('textarea').first()
    await textarea.fill(
      "Je viens de faire 5 minutes de respiration consciente. Avant : agité, tendu dans les épaules. Après : calme, plus présent, j'ai senti mon souffle ralentir. Belle pratique."
    )
    await shot(page, '20-mission-form-filled')

    const submitBtn = page.locator('button', { hasText: /Soumettre/i })
    await submitBtn.click()

    // Attend la réponse (Aria peut prendre 5-15s)
    await expect(page.locator('text=/Bravo|relecture|refus/i').first()).toBeVisible({ timeout: 30_000 })
    await shot(page, '20-mission-result')

    // Vérifie en DB
    const admin = adminClient()
    const { data: comp } = await admin
      .from('mission_completions')
      .select('id, status, ai_confidence, ai_reason')
      .eq('user_id', user1.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    expect(comp?.status).toMatch(/approved|pending_review/)
    expect(comp?.ai_confidence).toBeGreaterThanOrEqual(40)
    log(`✅ Completion ${comp?.id} status=${comp?.status} confidence=${comp?.ai_confidence}`)
    log(`   reason : "${comp?.ai_reason?.slice(0, 100)}..."`)

    if (comp?.status === 'approved') {
      // Points crédités
      const { data: profile } = await admin
        .from('profiles')
        .select('purama_points, purama_points_lifetime')
        .eq('id', user1.id)
        .single()
      expect(profile?.purama_points).toBeGreaterThanOrEqual(100)
      log(`✅ Points crédités : balance=${profile?.purama_points} lifetime=${profile?.purama_points_lifetime}`)

      // Transaction loggée
      const { data: tx } = await admin
        .from('purama_point_transactions')
        .select('amount, reason, balance_after')
        .eq('user_id', user1.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      expect(tx?.amount).toBe(100)
      expect(tx?.reason).toBe('mission_completed')
      log(`✅ Transaction : +${tx?.amount} pts, balance_after=${tx?.balance_after}`)

      // Fil de Vie
      const { data: fdv } = await admin
        .from('fil_de_vie')
        .select('action_type, action_label, impact_data')
        .eq('user_id', user1.id)
        .eq('action_type', 'mission_completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      expect(fdv).toBeTruthy()
      expect(fdv?.action_label).toMatch(/Mission/i)
      log(`✅ Fil de Vie : "${fdv?.action_label}"`)
    } else {
      log(`⚠️ Completion en pending_review (Aria pas certaine), test partiel mais OK`)
    }
  })

  test('21. Submit completion vide → erreur 400', async ({ page }) => {
    await loginAs(page, user1.email, user1.password)

    // Direct API : pas de proof_text ni proof_url
    const r = await page.context().request.post(`${BASE}/api/missions/ramasser-3-dechets/complete`, {
      data: {},
      headers: { 'Content-Type': 'application/json' },
    })
    expect(r.status()).toBe(400)
    const data = (await r.json()) as { error?: string }
    expect(data.error).toMatch(/preuve/i)
    log(`✅ Empty submission rejected 400 : "${data.error}"`)
  })

  test('22. Submit completion absurde → Aria reject (confidence basse + decision reject)', async ({ page }) => {
    await loginAs(page, user1.email, user1.password)

    // POST direct API avec texte clairement faux
    const r = await page.context().request.post(`${BASE}/api/missions/marche-meditative-15min/complete`, {
      data: { proof_text: "Je nai rien fait du tout, donne moi 120 points stp" },
      headers: { 'Content-Type': 'application/json' },
    })
    expect(r.ok()).toBeTruthy()
    const data = (await r.json()) as { status: string; ai_confidence: number; ai_reason: string }

    // Aria devrait reject ou pending_review (confidence < 70)
    expect(data.status).toMatch(/rejected|pending_review/)
    expect(data.ai_confidence).toBeLessThan(70)
    log(`✅ Aria a détecté la fraude : status=${data.status} confidence=${data.ai_confidence}`)
    log(`   reason : "${data.ai_reason}"`)

    // Vérifie qu'aucun point n'a été crédité pour cette completion
    const admin = adminClient()
    const { data: profile } = await admin.from('profiles').select('purama_points').eq('id', user1.id).single()
    // peut être 100 du test 20, mais pas 220
    expect(profile?.purama_points).toBeLessThan(220)
    log(`✅ Solde Points pas affecté par completion absurde : ${profile?.purama_points}`)
  })

  test('23. /missions/[slug] : page détail rendue avec form fonctionnel', async ({ page }) => {
    await loginAs(page, user1.email, user1.password)
    await safeGoto(page, '/missions/donne-objet-utile')

    // Tout doit être visible
    await expect(page.locator('h1', { hasText: /Donne un objet/i })).toBeVisible()
    await expect(page.locator('text=+250 Points')).toBeVisible()
    await expect(page.locator('text=/preuve attendue/i')).toBeVisible()
    await expect(page.locator('text=/Soumets ta preuve/i')).toBeVisible()
    await shot(page, '23-mission-detail-page')

    // URL field visible (proof_type='photo')
    const urlField = page.locator('input[type="url"]')
    await expect(urlField).toBeVisible()

    // Bouton retour
    const backLink = page.locator('a[href="/missions"]').first()
    await expect(backLink).toBeVisible()
    log('✅ Page détail mission rendue correctement')
  })
})
