import { createClient } from '@supabase/supabase-js'
import type { Page } from '@playwright/test'
import * as fs from 'node:fs'
import * as path from 'node:path'

// Charge .env.local AVANT de lire les vars (Playwright ne le fait pas tout seul).
;(function loadEnvLocal() {
  const file = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
})()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://auth.purama.dev'
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const SCHEMA = 'kosha'

export function adminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: SCHEMA },
  })
}

export function rawAdminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/** Cree un user UAT confirmé avec mot de passe deterministique. */
export async function createUatUser(opts: { suffix?: string } = {}) {
  const suffix = opts.suffix ?? Date.now().toString(36)
  const email = `uat+${suffix}@kosha-test.purama.dev`
  const password = `Uat-Pwd-${suffix}-X`
  const raw = rawAdminClient()
  const { data, error } = await raw.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: `UAT ${suffix}` },
  })
  if (error || !data.user) throw new Error('UAT createUser failed: ' + (error?.message ?? 'unknown'))
  return { id: data.user.id, email, password }
}

export async function deleteUatUser(userId: string) {
  const raw = rawAdminClient()
  await raw.auth.admin.deleteUser(userId)
}

/** Sign in via /login form. Clear cookies AVANT pour éviter d'être redirigé /login → /dashboard. */
export async function loginAs(page: Page, email: string, password: string) {
  // Clear cookies pour rendre /login accessible (sinon middleware redirige les authed)
  await page.context().clearCookies()
  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  // type=submit pour eviter de matcher le bouton OAuth Google
  await page.locator('form button[type="submit"]').click()
  // Either dashboard or onboarding
  await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 20_000 })
  await page.waitForLoadState('networkidle')

  // Bug @supabase/ssr connu : le PREMIER hit serveur après login peut voir le user
  // comme anon et redirect /login → /dashboard (refresh dance des cookies).
  // Solution : safeGoto retry pour les routes sensibles (cf. ci-dessous).
}

/** Goto qui retry tant que middleware redirige (cookie refresh dance). */
export async function safeGoto(page: Page, path: string, opts: { maxAttempts?: number } = {}) {
  const max = opts.maxAttempts ?? 3
  for (let i = 1; i <= max; i++) {
    // 'load' au lieu de 'networkidle' car Recharts/MapLibre/Framer Motion
    // boucle requestAnimationFrame → networkidle ne fire jamais.
    await page.goto(path, { waitUntil: 'load', timeout: 30_000 })
    const url = new URL(page.url())
    if (url.pathname === path || url.pathname.startsWith(path)) return
    // Sinon : attente cookie + retry
    await page.waitForTimeout(800)
  }
  throw new Error(`safeGoto: impossible d'atteindre ${path} après ${max} tentatives. URL finale: ${page.url()}`)
}

const LOG_FILE = path.join(__dirname, 'logs', 'uat-run.log')
fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true })
fs.writeFileSync(LOG_FILE, `=== UAT KOSHA ${new Date().toISOString()} ===\n`)

export function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}\n`
  fs.appendFileSync(LOG_FILE, line)
  // also print so reporter shows it
  process.stdout.write(line)
}

export async function shot(page: Page, name: string) {
  const file = path.join(__dirname, 'screenshots', `${name}.png`)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  await page.screenshot({ path: file, fullPage: true })
  log(`📸 ${file}`)
  return file
}

/** Liste les screenshots existants. */
export function listScreenshots(): string[] {
  const dir = path.join(__dirname, 'screenshots')
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir).filter((f) => f.endsWith('.png'))
}
