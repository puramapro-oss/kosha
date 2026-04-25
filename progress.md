# KOSHA — PROGRESS

**Last updated** : 2026-04-25 17:35
**Current phase** : P2 ✅ COMPLETED
**Next phase** : P3 — VIDA CAGNOTTE (~5h)
**Live URL** : https://kosha.purama.dev (HTTP 200)
**GitHub** : https://github.com/puramapro-oss/kosha (commit `d1f94bd`)
**Vercel** : puramapro-oss-projects/kosha
**Build** : 14 routes, 0 erreur TS strict, 1 warning cosmétique
**Latest deployment** : `kosha-aol4t7zig-puramapro-oss-projects.vercel.app`

---

## Defaults pris (questions non répondues)

1. **Treezor** = stub mode (Phase 1 BRIEF §6).
2. **Map** = MapLibre GL JS + MapTiler tiles (0€).
3. **i18n** = port YANA's 16 locales.
4. **RevenueCat** = stub en P11.
5. **Score d'Humanité initial** = 5.0/10 médian.
6. **Cap 12 mois ancienneté** = STRICT.
7. **App Store / Play Store** = artifacts only en P11.
8. **Context management** = /compact à 50%, restart à 60%.

---

## ✅ P1 — Setup & Auth (livré 2026-04-25 17:18)
Voir commit `605c9c7` + `a4b2734`. Routes : /, /login, /signup, /forgot-password, /dashboard, /api/status, /api/auth/signout, /auth/callback. Schema kosha + RLS + super admin Tissma seedé.

---

## ✅ P2 — VIDA CORE (livré 2026-04-25 17:35, ~1h10)

### Tables SQL ajoutées au schema kosha
- `fil_de_vie` : IMMUTABLE log d'actions positives (13 action_types, RLS DENY DELETE/UPDATE)
- `score_humanite_history` : snapshots quotidiens upsert via trigger
- `universe_personnel` : 4 axes radar (auto-create par trigger sur profiles)
- `onboarding_responses` : 3 questions
- 2 fonctions Postgres : `compute_score_humanite()` + `compute_score_components()`
- 2 triggers : `after_fil_de_vie_insert` (recompute score + snapshot + UPDATE profiles.fil_de_vie_count) + `after_profile_insert_universe`
- ALTER PUBLICATION `supabase_realtime` ADD TABLE pour push live

### Code livré
- `src/lib/fil-de-vie.ts` — `logFilDeVie`, `getRecentFilDeVie`, `getUserImpactTotals`, `ACTION_VISUALS` map (emoji + couleur + humanLabel)
- `src/lib/score.ts` — `getCurrentScore`, `recomputeScore` (RPC Postgres), `deriveAwakeningLevel`, `getScoreExplanation` (transparence BRIEF règle #3)
- `src/hooks/useFilDeVie.ts` — Supabase realtime channel sur `kosha.fil_de_vie` filtre user_id (push INSERT)
- `src/hooks/useScoreHumanite.ts` — Supabase realtime channel sur `kosha.score_humanite_history`
- `src/components/ScoreHumaniteJauge.tsx` — SVG radial gauge animé gradient violet→cyan + explanation
- `src/components/FilDeVieTimeline.tsx` — timeline verticale Framer Motion stagger + ImpactBadge par entry
- `src/components/UniversPersonnelRadar.tsx` — Recharts radar 4 axes
- `src/components/MomentWow.tsx` — 3 KPIs animés (gains potentiels mois + impact mondial live + action 30s)
- `src/components/DashboardClient.tsx` — assemblage realtime
- `src/app/(dashboard)/dashboard/page.tsx` — réel (replace placeholder), redirect /onboarding force si pas complété
- `src/app/(dashboard)/onboarding/page.tsx` — 3 questions glass swipe, progress dots, ~30s
- `src/app/(dashboard)/profile/page.tsx` — avatar gradient + score + univers radar + impact totals + Fil de Vie 50 entries + code parrainage
- `src/app/(dashboard)/actions/premiere/page.tsx` — action 30s one-clic + animation success
- `src/app/api/onboarding/route.ts` — Zod + insert onboarding_responses + log fil_de_vie
- `src/app/api/actions/premiere/route.ts` — anti-double + log fil_de_vie

### Live verification P2
- `https://kosha.purama.dev/onboarding` → 307 (auth required) ✓
- `https://kosha.purama.dev/dashboard` → 307 → `/login?next=/dashboard` ✓
- `https://kosha.purama.dev/profile` → 307 → `/login?next=/profile` ✓
- `https://kosha.purama.dev/actions/premiere` → 307 → `/login` ✓
- `https://kosha.purama.dev/api/status` → DB ok ✓

---

## What works
- P1 + P2 routes
- Realtime hooks (à tester E2E par Tissma)
- Schema immuable (RLS strict)
- Score d'Humanité algo Postgres (4 composantes pondérées)
- Onboarding < 30s

## What doesn't work / TODO P3+
- ❗ **UAT auth + onboarding** : Tissma doit signup en navigation privée, faire l'onboarding, voir score 5.0/10 + Fil de Vie 1 action ('onboarding_completed').
- TODO P3 : Treezor sandbox API key
- TODO P3 : MapTiler API key (peut utiliser OSM publics en attendant)
- TODO P3 : Stripe webhook secret (créer endpoint `/api/stripe/webhook` puis update env)
- TODO P3 : Tables cagnottes + contributions + splits + argent_memoire OpenTimestamps + fraud_signals + impact_global/user
- TODO P4 : VAPID Web Push keys
- ⚠️ /profile bundle = 337 kB (Recharts heavy) → P5 design polish : `dynamic() ssr:false` pour Recharts

---

## Next session priorities — P3 VIDA CAGNOTTE (~5h)

Cœur financier de KOSHA. 5 types de cagnottes avec IA Aria reformulation + Stripe checkout + Treezor split 70/15/5/10 + carte mondiale impact MapLibre.

1. Lire BRIEF §3 module 2 (Cagnotte) + §6 (Treezor) + §7 (multisensoriel) + §10 (juridique)
2. Tables SQL : cagnottes, cagnotte_contributions, cagnotte_splits, argent_memoire (OpenTimestamps Bitcoin), fraud_signals, impact_global/user
3. lib/treezor.ts (stub mode) + lib/opentimestamps.ts (stamp BTC)
4. Pages : `/cagnottes` (grid filtrable) + `/cagnottes/nouvelle` (wizard 4 steps avec Aria reformulation) + `/cagnottes/[id]` (détail + contribuer)
5. API : create + contribute + Stripe webhook + Treezor split + Aria fraud-check + signalement
6. `/impact-mondial` — MapLibre + tiles MapTiler/OSM + points lumineux temps réel
7. Build + deploy + UAT
