# KOSHA — PATTERNS (réutilisables)

## Vercel CLI (V7.2 §17 + §37 — JAMAIS dashboard manuel)
- Token : `VTOKEN=$(grep '^VERCEL_TOKEN=' .env.local | cut -d= -f2)`
- Scope : `puramapro-oss-projects` (PAS `puramapro-oss` qui est le perso)
- Link : `vercel link --token "$VTOKEN" --scope puramapro-oss-projects --yes --project kosha`
- Env add : `printf "valeur" | vercel env add NAME production --token "$VTOKEN" --scope puramapro-oss-projects --force`
- Deploy : `vercel deploy --prod --yes --token "$VTOKEN" --scope puramapro-oss-projects`
- Domain : `vercel domains add kosha.purama.dev --token "$VTOKEN" --scope puramapro-oss-projects` (single arg auto-link)

## GitHub via gh CLI (V7.2 — auth déjà loggé puramapro-oss)
- Status : `gh auth status` (puramapro-oss active)
- Repo create : `gh repo create puramapro-oss/REPO --public --source=. --remote=origin --push --description "..."`
- Si push bloqué par secret scanning → gitignore les fichiers fautifs, `git rm --cached`, `git commit --amend`, push

## VPS Supabase
- IP : 72.62.191.111
- SSH : `sshpass -p '+Awy3cwg;NoutOTH' ssh -o StrictHostKeyChecking=no root@72.62.191.111`
- Postgres : `docker exec -i supabase-db psql -U postgres -d postgres`
- Pipe SQL : `sshpass ... ssh root@72.62.191.111 "docker exec -i supabase-db psql -U postgres -d postgres" < schema.sql`
- Inspect GoTrue env : `docker inspect supabase-auth --format '{{range .Config.Env}}{{println .}}{{end}}'`
- Inspect PostgREST schemas : `docker inspect supabase-rest --format '{{range .Config.Env}}{{println .}}{{end}}' | grep PGRST_DB_SCHEMAS`
- `kosha` schema déjà dans `PGRST_DB_SCHEMAS` (Tissma a anticipé)

## Supabase clients (pattern YANA mature)
- `src/lib/supabase.ts` : `createClient` (browser, PKCE OAuth) + `createServiceClient` (server admin)
- `src/lib/supabase-server.ts` : `createClient` async avec cookies `next/headers`
- Schema toujours `db: { schema: APP_SCHEMA }` où `APP_SCHEMA='kosha'`
- Anon key + URL via `process.env.NEXT_PUBLIC_SUPABASE_*`

## Aria IA (KOSHA-spécifique — lib/claude.ts)
- Lazy init Anthropic SDK (Turbopack évalue modules avant env vars)
- Sélection auto modèle : `detectComplexity(msg)` → Haiku < 20 mots, Sonnet sinon, Opus si premium+complex
- System prompt avec 3 LIGNES ROUGES :
  1. Jamais "Claude/Anthropic"
  2. Transparence absolue (BRIEF règle #3)
  3. Aucune toxicité/comparaison (BRIEF règles #2 + #3)
- Helpers : `askAria`, `askAriaJSON`, `streamAria`

## i18n (porté de YANA)
- next-intl + 16 locales : ar, de, en, es, fr, hi, it, ja, ko, nl, pl, pt, ru, sv, tr, zh
- Default = `fr`
- Resolution : Cookie `locale` > Accept-Language header > defaultLocale
- RTL : `['ar']`
- Messages : `messages/{locale}.json`
- Config : `src/i18n/{request,config}.ts`
- Wired via `createNextIntlPlugin('./src/i18n/request.ts')` dans `next.config.ts`

## Auth (porté de YANA)
- @supabase/ssr (PKCE) + Google OAuth via auth.purama.dev
- Wildcard OAuth allow list `*.purama.dev/**` configuré côté VPS
- Middleware : `src/middleware.ts` avec `PUBLIC_PATHS` whitelist
- Pages auth dans `(auth)` route group avec layout cosmic background

## Design KOSHA (CLAUDE-2.md §9 + BRIEF §9)
- **JAMAIS** landing 13 sections — toujours app screen (logo + CTAs)
- **JAMAIS** Pollinations dans le design — icônes Lucide + gradients CSS
- Glass cards : `.glass` (bg white/3 + backdrop-blur-xl + border white/8)
- Gradient signature : `.gradient-text-kosha` (violet → bleu → cyan 135deg)
- Glow : `.glow-violet`, `.glow-cyan`
- Aberration chromatique : `.aberration` (text-shadow rouge + cyan)
- Cinématique : `.animate-scramble-in` (1.2s)
- Fonts : Sora display (h1-h4) + DM Sans body + JetBrains Mono code
- Couleurs : `#0A0A0F` bg, `#7C3AED` violet, `#06B6D4` cyan, `#3B82F6` bleu
- Respect `prefers-reduced-motion` partout

## Tracking files (Master Protocol §1 CLAUDE.md kosha)
- task_plan.md : P1 → P11 cases [ ] / [x]
- progress.md : état exact + URLs live + What works / blockers
- handoff.md : protocole reprise session + critical context + P2 preview
- ERRORS.md : `| DATE | BUG | CAUSE | FIX |`
- PATTERNS.md : ce fichier (réutilisables)

## Build Next.js 15 + Tailwind 4 + Turbopack
- Tailwind 4 = CSS-config seul (pas de tailwind.config.ts)
- `@theme inline { ... }` dans globals.css pour mapper variables
- Turbopack par défaut pour dev + build (`next dev/build --turbopack`)
- Build : 2.7s, 11 routes, 89.9 kB middleware
- Lib avec env vars → lazy init pattern (`let _client; function get() { if (!_client) _client = new ... }`) pour Turbopack qui évalue modules avant env vars
- Stripe SDK v22 : `apiVersion: '2025-09-30.clover' as never` (Stripe.LatestApiVersion supprimé)
- lucide-react v1.x : OK, exporte tous les icons (verified)
