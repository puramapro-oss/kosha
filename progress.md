# KOSHA — PROGRESS

**Last updated** : 2026-04-25 17:18
**Current phase** : P1 ✅ COMPLETED
**Next phase** : P2 — VIDA CORE (~3h)
**Live URL** : https://kosha.purama.dev (HTTP 200, /api/status OK)
**GitHub** : https://github.com/puramapro-oss/kosha
**Vercel project** : puramapro-oss-projects/kosha
**Build status** : 0 erreur, 0 warning, 11 routes générées (2.7s build local)
**TypeScript** : strict, 0 erreur

---

## Defaults pris (questions non répondues)

1. **Treezor** = stub mode (Phase 1 BRIEF §6, points + simulation). Vraie API binding différé jusqu'à SASU active.
2. **Map** = MapLibre GL JS + MapTiler tiles (0€, no API key required pour OSM tiles).
3. **i18n** = port YANA's 16 locales (ar, de, en, es, fr, hi, it, ja, ko, nl, pl, pt, ru, sv, tr, zh). BRIEF disait 29 = aspirational.
4. **RevenueCat** = stub en P11. Vraie init nécessite Apple Dev + Play Console (post-SASU).
5. **Score d'Humanité initial** = 5.0/10 médian (évite biais "anciens favorisés").
6. **Cap 12 mois ancienneté** = STRICT (no bonus beyond 12 mois) per BRIEF wording.
7. **App Store / Play Store** = artifacts only en P11, pas de soumission (post-SASU).
8. **Context management** = /compact à 50%, restart + handoff à 60%.

---

## P1 livraisons (~2h25 — légèrement au-dessus estimé 2h)

### Infrastructure
- ✅ Next.js 15.5.15 + React 19.1 + TypeScript strict + Tailwind 4 + Turbopack
- ✅ 357 dépendances production + dev (Anthropic SDK, Stripe, Supabase, Resend, Three.js, MapLibre, etc.)
- ✅ Schema Postgres `kosha` créé via SSH VPS (docker exec supabase-db psql)
- ✅ Schema exposé via PostgREST (`PGRST_DB_SCHEMAS` contient `kosha`)
- ✅ Tissma seedé super_admin UUID `bc865aa4-8059-43ef-a385-769dde2a3dbc` (auth.users existait déjà via prior apps)

### Code
- ✅ `src/lib/{constants,utils,supabase,supabase-server,claude,stripe,resend}.ts` — 7 lib files
- ✅ `src/types/index.ts` — Profile, FilDeVieEntry, ScoreHumaniteSnapshot, Cagnotte
- ✅ `src/middleware.ts` — auth gate avec PUBLIC_PATHS whitelist
- ✅ `src/i18n/{config,request}.ts` + `messages/*.json` × 16 (porté de YANA)
- ✅ `src/app/layout.tsx` (Sora display + DM Sans body + JetBrains Mono + Toaster + NextIntlProvider + RTL ar)
- ✅ `src/app/globals.css` (palette PURAMA, glass, gradient-text-kosha, gradient-bg-kosha, glow-violet, animations + prefers-reduced-motion fallback)
- ✅ `src/app/(auth)/{login,signup,forgot-password}/page.tsx` (Google OAuth + email/password + design glass)
- ✅ `src/app/(auth)/layout.tsx` (cosmic background)
- ✅ `src/app/auth/callback/route.ts` (PKCE OAuth exchange)
- ✅ `src/app/api/{status,auth/signout}/route.ts`
- ✅ `src/app/page.tsx` (home app-screen + manifeste + 2 CTAs — JAMAIS landing 13 sections)
- ✅ `src/components/CinematicIntro.tsx` (3s scramble effect + aberration chromatique + skip Escape + sessionStorage cache)
- ✅ `src/app/(dashboard)/dashboard/page.tsx` (placeholder KPIs Score/Fil de Vie/Awakening)
- ✅ `src/app/{error,not-found}.tsx`

### Aria (IA)
- ✅ System prompt complet avec :
  - Identité absolue (jamais "Claude", toujours "Aria")
  - 4 capacités (Comprendre / Proposer / Exécuter / Apprendre)
  - 7 règles sacrées intégrées
  - 3 lignes rouges non-négociables
  - IA SAGE (1 principe d'éveil par réponse, jamais prosélyte)
  - Reformulation cagnotte (JSON output)
  - Détection arnaque (score 0-100, > 70 = freeze)
- ✅ Sélection auto modèle Haiku/Sonnet/Opus selon complexité (V7.2 §71)
- ✅ Helpers `askAria`, `askAriaJSON`, `streamAria`

### Deploy
- ✅ git init + commit "P1: KOSHA scaffold"
- ✅ GitHub repo créé `puramapro-oss/kosha` (public)
- ✅ Push initial bloqué par GitHub secret scanning → fix : gitignore BRIEF.md, CLAUDE.md, CLAUDE-2.md, db/schema.sql (contiennent secrets)
- ✅ Vercel project `puramapro-oss-projects/kosha` créé et lié au repo
- ✅ 76 env vars pushed × 3 environments (production / preview / development) via `vercel env add` CLI (V7.2 §37 — JAMAIS dashboard manuel)
- ✅ `vercel deploy --prod` → READY (`dpl_J4oJC4ac3YCGTqdqyUXjWJ3t5c5d`)
- ✅ `vercel domains add kosha.purama.dev` → attaché au projet
- ✅ Live verification :
  - `https://kosha.purama.dev/` → 200 + cinématique + page accueil
  - `https://kosha.purama.dev/api/status` → 200 + `{"status":"ok","app":"KOSHA","db":{"ok":true}}`
  - `https://kosha.purama.dev/login` → 200 design glass
  - `https://kosha.purama.dev/signup` → 200
  - `https://kosha.purama.dev/forgot-password` → 200
  - `https://kosha.purama.dev/dashboard` (sans auth) → 307 redirect `/login?next=/dashboard` (middleware OK)

---

## What works
- Build local (Turbopack 2.7s, 0 err)
- TypeScript strict (0 err)
- Toutes routes P1 répondent 200 / redirect attendu
- Auth Supabase via auth.purama.dev (Google OAuth + email/password)
- Schema PostgREST exposé
- Cinématique 3s + skip Escape + prefers-reduced-motion fallback
- Design glass cosmic, palette PURAMA, fonts Sora/DM Sans

## What doesn't work / blockers / TODO P2+

- ❗ **Vrai test E2E auth** : Tissma doit tester en navigation privée signup email + Google OAuth. Le middleware redirige correctement, mais le flow complet user-→profile-trigger SQL doit être validé en P2 par UAT.
- TODO P3 : Treezor sandbox API key (actuellement stub `stub_phase_1_simulate_only`)
- TODO P3 : MapTiler API key (`NEXT_PUBLIC_MAPTILER_KEY` vide — peut utiliser tiles OSM publics en attendant)
- TODO P4 : Web Push VAPID keys à générer (`npx web-push generate-vapid-keys`)
- TODO Stripe Webhook : URL `https://kosha.purama.dev/api/stripe/webhook` à créer en P3 quand checkout sera codé. Le STRIPE_WEBHOOK_SECRET=whsec_TO_SET_AFTER_DEPLOY actuel = placeholder.

---

## Next session priorities — P2 VIDA CORE (~3h)

1. Read CLAUDE.md (kosha local — V7.2) + BRIEF.md + task_plan.md + progress.md + ERRORS.md + PATTERNS.md
2. Tables SQL : `fil_de_vie`, `score_humanite_history`, `universe_personnel`, `onboarding_responses`
3. Page `/dashboard` réelle avec moment WOW (3 KPIs animés temps réel via Supabase realtime)
4. Page `/profile` + Fil de Vie timeline immuable + ScoreHumaniteJauge composant
5. Page `/onboarding` (3 questions max, < 30s)
6. Hooks `useFilDeVie`, `useScoreHumanite`, `useAwakening`
7. Test : un user peut signup → onboarding → dashboard → voir score 5.0/10 + 0 actions Fil de Vie
8. Deploy P2 + handoff
