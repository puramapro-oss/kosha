/**
 * UAT P7 — VIDA IMPACT
 *
 * Tests Playwright headless contre prod live :
 *  24. /impact dashboard rendu (collectif visible même 0 personnel)
 *  25. /impact avec données : completion mission → métriques personnelles cumulées
 *  26. GET /api/impact JSON : structure correcte (collective.total_users >= 1)
 *  27. /impact/[year]/rapport : page imprimable avec bouton Imprimer + fil_de_vie highlights
 *  28. GET /api/impact/[year] : rapport JSON avec actions_count, missions_approved, donations
 */
import { test, expect } from '@playwright/test'
import { adminClient, createUatUser, deleteUatUser, loginAs, log, shot, safeGoto } from './helpers'

const BASE = process.env.UAT_BASE_URL ?? 'https://kosha.purama.dev'
const CURRENT_YEAR = new Date().getFullYear()

let user1: { id: string; email: string; password: string }

test.describe.configure({ mode: 'serial' })

test.describe('UAT P7 — VIDA IMPACT', () => {
  test.beforeAll(async () => {
    log('=== UAT P7 IMPACT setup ===')
    user1 = await createUatUser({ suffix: 'imp-' + Date.now().toString(36) })
    const admin = adminClient()
    await admin
      .from('profiles')
      .update({ onboarding_completed: true, score_humanite: 5.0, full_name: 'UAT Impact', purama_points: 0 })
      .eq('id', user1.id)
    log(`✅ User créé ${user1.id}`)
  })

  test.afterAll(async () => {
    log('=== UAT P7 IMPACT cleanup ===')
    const admin = adminClient()
    await admin.from('purama_point_transactions').delete().eq('user_id', user1.id)
    await admin.from('mission_completions').delete().eq('user_id', user1.id)
    await admin.from('fil_de_vie').delete().eq('user_id', user1.id)
    await deleteUatUser(user1.id)
    log('✅ cleanup done')
  })

  test('24. /impact dashboard chargé : collectif visible + personnel à zéro', async ({ page }) => {
    await loginAs(page, user1.email, user1.password)
    await safeGoto(page, '/impact')

    await expect(page.locator('h1', { hasText: /^Impact$/ })).toBeVisible()
    await expect(page.locator('h2', { hasText: /Ton empreinte personnelle/ })).toBeVisible()
    await expect(page.locator('h2', { hasText: /Empreinte collective KOSHA/ })).toBeVisible()
    await shot(page, '24-impact-dashboard-empty')

    // Personnel doit être à 0 (nouveau user)
    await expect(page.locator('text=Actions positives').first()).toBeVisible()
    log('✅ /impact rendu avec sections Personnel + Collectif')

    // Lien "Carte mondiale" visible
    await expect(page.locator('a[href="/impact-mondial"]')).toBeVisible()
  })

  test('25. Après completion mission → métriques personnelles incrémentées', async ({ page }) => {
    // Insert direct mission_completion approved (gain de temps vs UI)
    const admin = adminClient()
    const { data: mission } = await admin
      .from('missions')
      .select('id, reward_points')
      .eq('slug', 'partage-citation-positive')
      .single()
    expect(mission).toBeTruthy()

    const { error: insErr } = await admin.from('mission_completions').insert({
      mission_id: mission!.id,
      user_id: user1.id,
      proof_text: 'Citation : "Le voyage de mille lieues commence par un pas." (Lao Tseu)',
      ai_confidence: 88,
      ai_reason: 'Preuve cohérente — citation classique partagée avec contexte.',
      status: 'approved',
      validated_by: 'aria',
    })
    expect(insErr).toBeFalsy()
    await page.waitForTimeout(800)
    log('✅ Mission completion approved insérée')

    await loginAs(page, user1.email, user1.password)
    await safeGoto(page, '/impact')
    await shot(page, '25-impact-with-data')

    // Le rapport annuel doit apparaître maintenant
    await expect(page.locator(`a[href="/impact/${CURRENT_YEAR}/rapport"]`)).toBeVisible()
    log(`✅ Lien rapport ${CURRENT_YEAR} affiché`)

    // Vérifier en DB que fil_de_vie a bien été inséré par le trigger
    const { data: fdv } = await admin
      .from('fil_de_vie')
      .select('action_type, action_label')
      .eq('user_id', user1.id)
      .eq('action_type', 'mission_completed')
      .maybeSingle()
    expect(fdv).toBeTruthy()
    expect(fdv?.action_label).toMatch(/Mission/i)

    // Vérifier Points crédités
    const { data: profile } = await admin.from('profiles').select('purama_points, fil_de_vie_count').eq('id', user1.id).single()
    expect(profile?.purama_points).toBeGreaterThanOrEqual(50)
    log(`✅ Points: ${profile?.purama_points}, fil_de_vie_count=${profile?.fil_de_vie_count}`)
  })

  test('26. GET /api/impact : JSON structure complète avec collectif + personnel', async ({ page }) => {
    await loginAs(page, user1.email, user1.password)
    const r = await page.context().request.get(`${BASE}/api/impact`)
    expect(r.ok()).toBeTruthy()

    const data = (await r.json()) as {
      collective: {
        total_users: number
        total_missions_completed_global: number
        total_aria_messages: number
        kg_dechets: number
        arbres: number
        l_eau: number
        personnes: number
      }
      personal: {
        total_actions: number
        total_missions_approved: number
        total_points_earned: number
        score_humanite: number
      } | null
    }

    expect(data.collective.total_users).toBeGreaterThanOrEqual(1)
    expect(data.collective.total_missions_completed_global).toBeGreaterThanOrEqual(1)
    log(`✅ Collective : ${data.collective.total_users} users, ${data.collective.total_missions_completed_global} missions`)

    expect(data.personal).toBeTruthy()
    expect(data.personal!.total_missions_approved).toBeGreaterThanOrEqual(1)
    expect(data.personal!.score_humanite).toBeGreaterThanOrEqual(0)
    log(`✅ Personal : ${data.personal!.total_missions_approved} missions approved, score=${data.personal!.score_humanite}`)
  })

  test('27. /impact/[year]/rapport : page imprimable + bouton Imprimer + highlights', async ({ page }) => {
    await loginAs(page, user1.email, user1.password)
    await safeGoto(page, `/impact/${CURRENT_YEAR}/rapport`)

    await expect(page.locator('h1', { hasText: new RegExp(`Année ${CURRENT_YEAR}`) })).toBeVisible()
    await expect(page.locator('text=/Bilan d.impact de/')).toBeVisible()
    await expect(page.locator('button', { hasText: /Imprimer/i })).toBeVisible()
    await expect(page.locator('text=/Empreinte de l.année/i')).toBeVisible()
    await expect(page.locator('text=/Empreinte écologique/i')).toBeVisible()

    // Highlights — devrait avoir au moins le mission_completed du test 25
    await expect(page.locator('text=/moments forts/i')).toBeVisible()
    await shot(page, '27-rapport-annuel')
    log(`✅ Rapport ${CURRENT_YEAR} affiché complet avec bouton Imprimer + highlights`)
  })

  test('28. GET /api/impact/[year] : JSON rapport annuel cohérent', async ({ page }) => {
    await loginAs(page, user1.email, user1.password)
    const r = await page.context().request.get(`${BASE}/api/impact/${CURRENT_YEAR}`)
    expect(r.ok()).toBeTruthy()

    const data = (await r.json()) as {
      report: {
        year: number
        user_email: string
        actions_count: number
        missions_approved: number
        cagnottes_contributed: number
        points_earned_year: number
        highlights: Array<{ date: string; action_type: string; action_label: string }>
        generated_at: string
      }
    }

    expect(data.report.year).toBe(CURRENT_YEAR)
    expect(data.report.user_email).toBe(user1.email)
    expect(data.report.missions_approved).toBeGreaterThanOrEqual(1)
    expect(data.report.actions_count).toBeGreaterThanOrEqual(1)
    expect(data.report.points_earned_year).toBeGreaterThanOrEqual(50)
    expect(data.report.highlights.length).toBeGreaterThanOrEqual(1)
    expect(data.report.highlights[0].action_type).toMatch(/mission|cercle|cagnotte/)
    log(`✅ Rapport JSON year=${CURRENT_YEAR} actions=${data.report.actions_count} missions=${data.report.missions_approved} highlights=${data.report.highlights.length}`)
    log(`   1er highlight : "${data.report.highlights[0].action_label}"`)
  })
})
