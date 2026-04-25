/**
 * UAT P8 — VIDA RITUELS
 *
 * Tests Playwright headless contre prod live :
 *  29. /rituels rendu : hero + bouton + calendrier 6 prochains
 *  30. POST /api/rituels/[id]/participate : Points + fil_de_vie + count++
 *  31. Anti-double : 2e participate → 409 already_participated
 *  32. GET /api/rituels/current : JSON avec current + state + upcoming[]
 */
import { test, expect } from '@playwright/test'
import { adminClient, createUatUser, deleteUatUser, loginAs, log, shot, safeGoto } from './helpers'

const BASE = process.env.UAT_BASE_URL ?? 'https://kosha.purama.dev'

let user1: { id: string; email: string; password: string }
let currentRituelId: string | null = null

test.describe.configure({ mode: 'serial' })

test.describe('UAT P8 — VIDA RITUELS', () => {
  test.beforeAll(async () => {
    log('=== UAT P8 RITUELS setup ===')
    user1 = await createUatUser({ suffix: 'rit-' + Date.now().toString(36) })
    const admin = adminClient()
    await admin
      .from('profiles')
      .update({ onboarding_completed: true, full_name: 'UAT Rituel', purama_points: 0 })
      .eq('id', user1.id)
    log(`✅ User créé ${user1.id}`)
  })

  test.afterAll(async () => {
    log('=== UAT P8 RITUELS cleanup ===')
    const admin = adminClient()
    if (currentRituelId) {
      await admin.from('rituel_participations').delete().eq('user_id', user1.id).eq('rituel_id', currentRituelId)
    }
    await admin.from('purama_point_transactions').delete().eq('user_id', user1.id)
    await admin.from('fil_de_vie').delete().eq('user_id', user1.id)
    await deleteUatUser(user1.id)
    log('✅ cleanup done')
  })

  test('29. /rituels rendu : hero + calendrier 6 thèmes + lien dashboard', async ({ page }) => {
    await loginAs(page, user1.email, user1.password)
    await safeGoto(page, '/rituels')

    await expect(page.locator('a[href="/dashboard"]')).toBeVisible()
    // Hero contient au moins un thème connu (Pardon est W17 selon seed mais peut varier)
    const heroH1 = page.locator('h1').first()
    await expect(heroH1).toBeVisible()
    const heroText = (await heroH1.textContent()) || ''
    expect(heroText.length).toBeGreaterThan(3)

    // Section calendrier 6 prochains
    await expect(page.locator('h2', { hasText: /6 prochaines semaines/ })).toBeVisible()
    // Section "Tes rituels"
    await expect(page.locator('h2', { hasText: /Tes rituels/ })).toBeVisible()

    await shot(page, '29-rituels-hero')
    log(`✅ /rituels rendu avec hero "${heroText.slice(0, 50)}..."`)
  })

  test('30. POST /api/rituels/[id]/participate : Points + fil_de_vie + count++', async ({ page }) => {
    await loginAs(page, user1.email, user1.password)

    // 1) Récupérer le rituel courant via l'API
    const r1 = await page.context().request.get(`${BASE}/api/rituels/current`)
    expect(r1.ok()).toBeTruthy()
    const data = (await r1.json()) as {
      current: { id: string; theme_label: string; participants_count: number }
      state: 'live' | 'upcoming' | 'ended'
    }
    expect(data.current.id).toBeTruthy()
    currentRituelId = data.current.id
    log(`Rituel courant : ${data.current.theme_label} (state=${data.state})`)

    // Si pas live (peu probable mais possible si on vient de basculer minuit UTC), skip avec marker
    if (data.state !== 'live') {
      log(`⚠️ Rituel non-live (${data.state}) — test 30 skippé (cas limite minuit UTC)`)
      test.skip(true, 'Rituel courant pas en état live à cet instant')
      return
    }

    const before = data.current.participants_count

    // 2) Participer
    const r2 = await page.context().request.post(`${BASE}/api/rituels/${currentRituelId}/participate`, {
      data: { intention_text: 'UAT — semer une intention de pardon.' },
    })
    expect(r2.ok()).toBeTruthy()
    const part = (await r2.json()) as {
      ok: boolean
      participation: { id: string; points_awarded: number }
      participants_count: number
    }
    expect(part.ok).toBe(true)
    expect(part.participation.points_awarded).toBe(30)
    expect(part.participants_count).toBeGreaterThanOrEqual(before + 1)
    log(`✅ Participation OK — count ${before} → ${part.participants_count}, +30 pts`)

    // 3) Vérifier en DB : fil_de_vie + Points crédités
    const admin = adminClient()
    const { data: fdv } = await admin
      .from('fil_de_vie')
      .select('action_type, action_label, impact_data')
      .eq('user_id', user1.id)
      .eq('action_type', 'rituel_joined')
      .maybeSingle()
    expect(fdv).toBeTruthy()
    expect(fdv?.action_label).toContain(data.current.theme_label)
    expect((fdv?.impact_data as { points: number } | null)?.points).toBe(30)

    const { data: profile } = await admin
      .from('profiles')
      .select('purama_points, purama_points_lifetime')
      .eq('id', user1.id)
      .single()
    expect(profile?.purama_points).toBe(30)
    expect(profile?.purama_points_lifetime).toBe(30)
    log(`✅ DB : fil_de_vie inséré + Points balance=${profile?.purama_points} lifetime=${profile?.purama_points_lifetime}`)
  })

  test('31. Anti-double : 2e participate → 409 already_participated', async ({ page }) => {
    await loginAs(page, user1.email, user1.password)
    if (!currentRituelId) {
      test.skip(true, 'Pas de currentRituelId du test précédent')
      return
    }
    const r = await page.context().request.post(`${BASE}/api/rituels/${currentRituelId}/participate`, {
      data: { intention_text: 'tentative double' },
    })
    expect(r.status()).toBe(409)
    const data = (await r.json()) as { error: string; already_participated?: boolean }
    expect(data.already_participated).toBe(true)
    log(`✅ 409 retourné avec already_participated=true : "${data.error}"`)
  })

  test('32. GET /api/rituels/current : structure JSON complète', async ({ page }) => {
    await loginAs(page, user1.email, user1.password)
    const r = await page.context().request.get(`${BASE}/api/rituels/current`)
    expect(r.ok()).toBeTruthy()
    const data = (await r.json()) as {
      current: {
        id: string
        week_iso: string
        theme_index: number
        theme_slug: string
        theme_label: string
        intention: string
        mission_label: string
        starts_at_utc: string
        ends_at_utc: string
        participants_count: number
      }
      state: string
      user_participated: boolean
      upcoming: Array<{ id: string; week_iso: string; theme_label: string }>
    }
    expect(data.current.id).toBeTruthy()
    expect(data.current.week_iso).toMatch(/^\d{4}-W\d{2}$/)
    expect(data.current.theme_index).toBeGreaterThanOrEqual(1)
    expect(data.current.theme_index).toBeLessThanOrEqual(6)
    expect(['depollution', 'paix', 'amour', 'pardon', 'gratitude', 'abondance']).toContain(data.current.theme_slug)
    expect(['live', 'upcoming', 'ended']).toContain(data.state)
    expect(data.upcoming.length).toBeGreaterThanOrEqual(1)
    expect(data.upcoming.length).toBeLessThanOrEqual(6)
    // Si user_participated=true (test 30 a fonctionné en live), c'est cohérent avec state=live
    log(
      `✅ JSON cohérent : current=${data.current.theme_label} state=${data.state} upcoming=${data.upcoming.length} user_participated=${data.user_participated}`
    )
  })
})
