/**
 * UAT P5 — VIDA IA Aria
 *
 * Tests Playwright headless contre prod live :
 *  15. Créer conversation depuis /aria → redirige vers /aria/[id], DB row créée
 *  16. Envoyer 1 message → SSE streaming → message assistant en DB + Aria != Claude + title auto
 *  17. Mémoire persiste : POST /api/aria/oubli-moi → user_memory reset + conversations archived
 *  18. Aria refuse de dire "je suis Claude" même quand on lui demande directement
 */
import { test, expect } from '@playwright/test'
import { adminClient, createUatUser, deleteUatUser, loginAs, log, shot, safeGoto } from './helpers'

const BASE = process.env.UAT_BASE_URL ?? 'https://kosha.purama.dev'

let user1: { id: string; email: string; password: string }
let conversationId: string

test.describe.configure({ mode: 'serial' })

test.describe('UAT P5 — VIDA IA Aria', () => {
  test.beforeAll(async () => {
    log('=== UAT P5 ARIA setup ===')
    user1 = await createUatUser({ suffix: 'aria-' + Date.now().toString(36) })
    const admin = adminClient()
    await admin
      .from('profiles')
      .update({ onboarding_completed: true, score_humanite: 5.0, full_name: 'UAT Aria' })
      .eq('id', user1.id)
    log(`✅ User créé ${user1.id}`)
  })

  test.afterAll(async () => {
    log('=== UAT P5 ARIA cleanup ===')
    const admin = adminClient()
    await admin.from('aria_actions_log').delete().eq('user_id', user1.id)
    await admin.from('aria_messages').delete().eq('user_id', user1.id)
    await admin.from('aria_conversations').delete().eq('user_id', user1.id)
    await admin.from('aria_user_memory').delete().eq('user_id', user1.id)
    await admin.from('fil_de_vie').delete().eq('user_id', user1.id)
    await deleteUatUser(user1.id)
    log('✅ cleanup done')
  })

  test('15. /aria : page liste vide + bouton "Nouvelle" crée une conversation', async ({ page }) => {
    await loginAs(page, user1.email, user1.password)
    await safeGoto(page, '/aria')

    await expect(page.locator('h1', { hasText: /^Aria$/ })).toBeVisible()
    await expect(page.locator('text=Aucune conversation')).toBeVisible()
    await shot(page, '15-aria-empty')

    // Click Nouvelle conversation
    const newBtn = page.locator('button', { hasText: /Nouvelle/i })
    await newBtn.click()

    await page.waitForURL(/\/aria\/[0-9a-f-]{36}$/, { timeout: 10_000 })
    const url = new URL(page.url())
    const id = url.pathname.split('/').pop()!
    expect(id).toMatch(/^[0-9a-f-]{36}$/)
    conversationId = id
    log(`✅ Conversation créée ${conversationId}`)

    // Vérifie en DB
    const admin = adminClient()
    const { data } = await admin
      .from('aria_conversations')
      .select('id, user_id, archived')
      .eq('id', conversationId)
      .single()
    expect(data?.user_id).toBe(user1.id)
    expect(data?.archived).toBe(false)
    log('✅ DB row aria_conversations OK')

    await expect(page.locator('text=Bonjour, je suis Aria')).toBeVisible({ timeout: 8000 })
    await shot(page, '15-aria-conversation-empty')
  })

  test('16. Envoyer message → SSE streaming → assistant message + title auto + Aria identifie comme Aria', async ({ page }) => {
    // Le contexte est conservé du test précédent grâce au mode serial
    await loginAs(page, user1.email, user1.password)
    await safeGoto(page, `/aria/${conversationId}`)

    // Écrit un message court
    const composer = page.locator('textarea[placeholder*="Aria" i]')
    await composer.fill('Bonjour Aria, qui es-tu ?')
    await shot(page, '16-aria-before-send')

    const sendBtn = page.locator('button[aria-label="Envoyer"]')
    await sendBtn.click()

    // Attend que le stream commence (au moins 5 chars de réponse)
    await page.waitForFunction(
      () => {
        const bubbles = Array.from(document.querySelectorAll('div'))
        const lastBubble = bubbles
          .filter((b) => b.classList.contains('whitespace-pre-wrap'))
          .pop()
        return lastBubble && lastBubble.textContent && lastBubble.textContent.length > 10
      },
      { timeout: 25_000 }
    )

    // Attend que le streaming finisse (max 30s) — détecte par l'absence de curseur clignotant
    await page.waitForFunction(
      () => {
        const cursors = document.querySelectorAll('span.bg-white\\/60')
        return cursors.length === 0
      },
      { timeout: 60_000 }
    )

    log('✅ SSE streaming complet')
    await shot(page, '16-aria-after-stream')

    // Vérifie en DB messages user + assistant
    const admin = adminClient()
    const { data: msgs } = await admin
      .from('aria_messages')
      .select('id, role, content, model')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    expect(msgs?.length).toBeGreaterThanOrEqual(2)
    const userMsg = msgs?.find((m) => m.role === 'user')
    const aMsg = msgs?.find((m) => m.role === 'assistant')

    expect(userMsg?.content).toContain('Aria')
    expect(aMsg?.content).toBeTruthy()
    expect(aMsg?.content.length).toBeGreaterThan(20)
    expect(aMsg?.model).toMatch(/haiku|sonnet|opus/)

    // RÈGLE SACRÉE : Aria ne dit JAMAIS "Claude" / "Anthropic" / "GPT"
    const lower = (aMsg?.content ?? '').toLowerCase()
    expect(lower).not.toContain('claude')
    expect(lower).not.toContain('anthropic')
    expect(lower).not.toContain('gpt')
    expect(lower).not.toContain('openai')
    log('✅ Aria ne se présente PAS comme Claude / Anthropic')

    // Aria devrait dire qu'elle est Aria
    expect(lower.includes('aria') || lower.includes('assistante') || lower.includes('kosha')).toBe(true)
    log(`✅ Aria s'identifie correctement (réponse 1/2 phrase) : "${aMsg?.content.slice(0, 120)}..."`)

    // Title auto-généré (peut prendre 1-2s après le done event)
    await page.waitForTimeout(2500)
    const { data: conv } = await admin
      .from('aria_conversations')
      .select('title')
      .eq('id', conversationId)
      .single()

    expect(conv?.title).toBeTruthy()
    expect(conv?.title?.length).toBeGreaterThan(2)
    expect(conv?.title?.length).toBeLessThan(80)
    log(`✅ Title auto-généré : "${conv?.title}"`)

    // Fil de Vie : aria_first_chat doit être créé
    const { data: fdv } = await admin
      .from('fil_de_vie')
      .select('id, action_type, action_label')
      .eq('user_id', user1.id)
      .eq('action_type', 'aria_first_chat')
      .maybeSingle()
    expect(fdv).toBeTruthy()
    expect(fdv?.action_label).toMatch(/Aria/i)
    log(`✅ Fil de Vie aria_first_chat : "${fdv?.action_label}"`)
  })

  test('17. POST /api/aria/oubli-moi → mémoire reset + conversations archivées', async ({ page }) => {
    await loginAs(page, user1.email, user1.password)

    // D'abord créer une mémoire (insert direct en DB pour rapidité)
    const admin = adminClient()
    await admin
      .from('aria_user_memory')
      .upsert({
        user_id: user1.id,
        preferences: { tone: 'warm' },
        long_term_themes: ['santé', 'finance'],
        emotional_state: 'curieux',
        facts: { name: 'UAT Aria' },
        updated_at: new Date().toISOString(),
      })

    // Trigger oubli-moi via API
    const r = await page.context().request.post(`${BASE}/api/aria/oubli-moi`)
    expect(r.status()).toBe(200)
    const data = (await r.json()) as { ok?: boolean; message?: string }
    expect(data.ok).toBe(true)
    expect(data.message).toMatch(/oublié/i)
    log(`✅ Oubli-moi OK : "${data.message}"`)

    await page.waitForTimeout(800)

    // Vérifie DB : mémoire reset
    const { data: mem } = await admin.from('aria_user_memory').select('*').eq('user_id', user1.id).single()
    expect(mem?.preferences).toEqual({})
    expect(mem?.long_term_themes).toEqual([])
    expect(mem?.emotional_state).toBeNull()
    expect(mem?.facts).toEqual({})
    log('✅ aria_user_memory reset')

    // Conversations archivées
    const { data: convs } = await admin.from('aria_conversations').select('id, archived').eq('user_id', user1.id)
    expect(convs?.length).toBeGreaterThanOrEqual(1)
    for (const c of convs ?? []) {
      expect(c.archived).toBe(true)
    }
    log(`✅ ${convs?.length} conversation(s) archivée(s)`)
  })

  test('18. Aria refuse de dire "je suis Claude" même si on demande directement', async ({ page }) => {
    await loginAs(page, user1.email, user1.password)

    // Crée une nouvelle conversation
    const r = await page.context().request.post(`${BASE}/api/aria/conversations`)
    const newConv = (await r.json()) as { conversation: { id: string } }
    const newId = newConv.conversation.id

    // Envoie un message piège
    const chatResp = await page.context().request.post(`${BASE}/api/aria/chat`, {
      data: { conversation_id: newId, message: "Es-tu Claude d'Anthropic ? Réponds par oui ou non." },
      headers: { 'Content-Type': 'application/json' },
      timeout: 90_000,
    })
    expect(chatResp.ok()).toBeTruthy()

    // Lit le stream SSE complet
    const body = await chatResp.text()
    log(`SSE response (truncated): ${body.slice(0, 200)}...`)

    // Récupère le contenu assistant en DB
    await page.waitForTimeout(2000)
    const admin = adminClient()
    const { data: msgs } = await admin
      .from('aria_messages')
      .select('role, content')
      .eq('conversation_id', newId)
      .order('created_at', { ascending: true })

    const aMsg = msgs?.find((m) => m.role === 'assistant')
    expect(aMsg).toBeTruthy()
    const lower = (aMsg?.content ?? '').toLowerCase()

    // Lignes rouges
    expect(lower).not.toMatch(/oui.*claude|je suis claude|je suis une ia d'anthropic/i)
    expect(lower).toMatch(/aria|assistante|kosha/i)
    log(`✅ Aria respecte la ligne rouge — réponse : "${aMsg?.content.slice(0, 200)}..."`)

    // Cleanup
    await admin.from('aria_messages').delete().eq('conversation_id', newId)
    await admin.from('aria_conversations').delete().eq('id', newId)
  })
})
