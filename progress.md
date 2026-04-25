# KOSHA — PROGRESS

**Last updated** : 2026-04-25 18:25
**Current phase** : P4 ✅ COMPLETED
**Next phase** : P5 — VIDA IA Aria (~3h)
**Live URL** : https://kosha.purama.dev (HTTP 200)
**GitHub** : https://github.com/puramapro-oss/kosha (commit `b660a50`)
**Vercel** : puramapro-oss-projects/kosha
**Build** : 33 routes, 0 erreur TS strict, 1 warning cosmétique
**Latest deployment** : `kosha-1tbhlz398-puramapro-oss-projects.vercel.app`
**Stripe webhook prod** : `we_1TQ8cI4Y1unNvKtX6EtyfECR` (7 events) — secret synced sur 3 envs Vercel
**DB** : 18 tables (P1-P4)

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

## ✅ P3 — VIDA CAGNOTTE (livré 2026-04-25 18:05, ~1h35)

### Tables SQL ajoutées au schema kosha (db/p3_cagnotte.sql)
- `cagnottes` : 5 types (communautaire/projet_vie/action_immediate/humanitaire/hybride), max 5 actives/user, RLS strict (lecture publique sur active+completed, update interdit après 1ère contrib)
- `cagnotte_contributions` : idempotent via stripe_session_id UNIQUE, RLS lecture (contributor + owner + public si non-anonymous)
- `cagnotte_splits` : 70/15/5/10 calculé dans fonction `compute_cagnotte_split` (last bucket absorbe le reste)
- `argent_memoire` : SHA256 hash + ots_proof_base64 + ots_proof_upgraded_base64 + bitcoin_block_height (IMMUTABLE)
- `fraud_signals` : signal_type (ai_detected/community_reported/stripe_radar/manual_admin) + severity 1-10
- `impact_global` : single row id=1, lecture publique
- 1 fonction `compute_cagnotte_split(amount)` IMMUTABLE
- 1 trigger `after_contribution_succeeded` : update raised_amount + contributors_count + cagnotte_splits + impact_global + insert fil_de_vie + auto-completion si target atteint
- ALTER PUBLICATION supabase_realtime ADD pour 4 tables (push live)
- ALTER fil_de_vie CHECK étendu : +cagnotte_completed +first_post +reaction_* +referral_* +streak_*

### Code livré
- `src/lib/treezor.ts` — stub Phase 1 : createTreezorUser/createTreezorWallet/simulatePayout + calculateSplit (mirror SQL)
- `src/lib/opentimestamps.ts` — hashPayload (canonical JSON SHA256) + stampHash (calendar OTS, fallback graceful) + upgradeProof (extract block height) + verifyProof (Bitcoin attestation)
- `src/lib/cagnottes.ts` — CagnotteCreateSchema + CagnotteContributeSchema + CagnotteReportSchema + getActiveCagnottes/getCagnotteById/getCagnotteSplits/getRecentContributions + helpers progressPercent/formatEur
- `src/types/javascript-opentimestamps.d.ts` — types minimaux pour la lib non-typed
- `src/lib/fil-de-vie.ts` — extension type union + ACTION_VISUALS pour 7 nouveaux types
- `src/components/CagnotteCard.tsx` — carte glass + gradient owner color + progression bar + status badge
- `src/components/CagnotteContributePanel.tsx` — quick amounts + amount libre + message + anonymous + Stripe redirect
- `src/components/CagnotteReportButton.tsx` — toggle modal + textarea + soft amber feedback
- `src/components/MapLibreCanvas.tsx` — MapLibre OSM tiles desaturated + dots glow violet/cyan
- `src/components/ImpactMondialClient.tsx` — realtime channel + counters animés + feed + dynamic MapLibre import
- `src/app/api/cagnottes/create/route.ts` — auth + Zod + anti-spam 5 actives + log fil_de_vie
- `src/app/api/cagnottes/[id]/contribute/route.ts` — Stripe Checkout session metadata kind=cagnotte_contribution
- `src/app/api/cagnottes/[id]/report/route.ts` — community signal (1/user/cagnotte) + auto fraud_check à 3 signaux
- `src/app/api/aria/reformulate/route.ts` — Aria Sonnet reformule titre+description+impact_phrase, fallback graceful
- `src/app/api/aria/fraud-check/route.ts` — Aria Haiku score 0-100 + auto-freeze si > 70 + log fraud_signal
- `src/app/api/stripe/webhook/route.ts` — verify signature + idempotent (stripe_session_id) + INSERT contribution succeeded → trigger SQL fait le reste + INSERT argent_memoire async
- `src/app/(dashboard)/cagnottes/page.tsx` — grid filtrable types + stats globales + CTA Impact mondial
- `src/app/(dashboard)/cagnottes/nouvelle/page.tsx` — wizard 4 steps (type → récit → Aria reformule → confirmation)
- `src/app/(dashboard)/cagnottes/[id]/page.tsx` — hero + progression + split tracé 4 tiles + contributions list + report btn
- `src/app/(dashboard)/impact-mondial/page.tsx` — MapLibre + counters live + feed récent

### Live verification P3
- `curl /api/stripe/webhook` POST unsigned → 400 ✓
- `curl /api/cagnottes/create` POST sans auth → 401 ✓
- `curl /api/cagnottes/[id]/contribute` POST sans auth → 401 ✓
- `curl /api/aria/reformulate` POST sans auth → 401 ✓
- `curl /cagnottes` → 307 → /login ✓
- `curl /impact-mondial` → 307 → /login ✓
- `curl /api/status` → DB ok ✓

### Stripe + ENV
- Webhook prod créé : `we_1TQ8cI4Y1unNvKtX6EtyfECR` (7 events live)
- STRIPE_SECRET_KEY rotated (l'ancienne ...Ni7m était révoquée — la valide est ...gyY1)
- STRIPE_WEBHOOK_SECRET = `***REMOVED-WEBHOOK-SECRET***`
- 2 env vars syncées via `vercel env add` sur production + development (preview à compléter si besoin)

---

## ✅ P4 — VIDA SOCIAL (livré 2026-04-25 18:25, ~50min)

### Tables SQL ajoutées au schema kosha (db/p4_social.sql)
- `cercles` : groupes max 12, public/private, archivable, auto-counters
- `cercle_membres` : join table (member/captain), trigger maintient members_count + check max
- `posts` : 4 types (text/story/milestone/gratitude), modération IA pré-publish, status [pending_review|published|blocked|deleted], counters
- `reactions` : 3 types ONLY (energie/gratitude/soutien), UNIQUE (post, user, type) — anti-toxicité BRIEF règle sacrée #2
- `story_rewards` : auto-réward stories qui dépassent threshold réactions (Phase 1 = 1€/story)
- `silence_mode` : per-user config notifications, gère plage qui chevauche minuit
- 5 triggers : after_cercle_insert (auto-join captain), after_cercle_membres_change (counter + max), after_post_published (first_post fil_de_vie), after_reaction_insert (counter + fil_de_vie + story reward), after_reaction_delete
- ALTER PUBLICATION supabase_realtime ADD pour 4 tables

### Code livré
- `src/lib/moderation.ts` — moderatePost via Aria Haiku, score 0-100, 8 catégories (comparaison/fomo/attaque/haine/spam/mensonge/urgence/vente_externe), decision auto (< 30 → published, 30-69 → pending_review, ≥ 70 → blocked)
- `src/lib/silence.ts` — `isInSilenceWindow(silence, now)` + Zod SilenceUpdateSchema, gère plage 22h → 7h (chevauche minuit)
- `src/lib/posts.ts` — types + Zod + getPublicFeed + getCerclePosts + enrichPosts (fetch profil + reactions par batch, 0 join PostgREST)
- `src/lib/cercles.ts` — types + Zod + getActiveCercles + getCercleById (avec is_member + is_creator viewer)
- `src/components/PostCard.tsx` — avatar + cercle link + 3 ReactionButton optimistic + rollback réseau
- `src/components/PostComposer.tsx` — textarea + 4 type selector + submit + feedback modération (blocked = soft amber, pending = cyan)
- `src/components/CercleJoinButton.tsx` — toggle join/leave + creator → "Capitaine"
- `src/components/SilenceClient.tsx` — toggle global + plage horaire 24h + 7 jours grid + pause rapide 1-24h
- `src/app/api/posts/create/route.ts` — auth + Zod + anti-spam 10/h + cercle membership check + Aria modération + status auto
- `src/app/api/posts/[id]/react/route.ts` — toggle insert/delete (UNIQUE constraint évite doublons)
- `src/app/api/cercles/create/route.ts` — auth + Zod + anti-spam 5 actifs + auto-join captain via trigger
- `src/app/api/cercles/[id]/membership/route.ts` — POST join (visibility + max check) + DELETE leave (sauf créateur)
- `src/app/api/silence/update/route.ts` — upsert config
- `src/app/(dashboard)/feed/page.tsx` — composer + 30 posts publics + breeze design
- `src/app/(dashboard)/cercles/page.tsx` — grid + member previews + creator badge
- `src/app/(dashboard)/cercles/nouveau/page.tsx` — form 4 fields
- `src/app/(dashboard)/cercles/[id]/page.tsx` — intention quote + members + composer si membre + posts
- `src/app/(dashboard)/silence/page.tsx` + SilenceClient
- DashboardClient updated : section "L'univers vivant" remplace "Modules à venir" — 5 LiveLink + 1 ComingSoon

### Live verification P4
- `/feed` → 307 → /login ✓
- `/cercles` → 307 ✓
- `/silence` → 307 ✓
- `/api/posts/create` POST sans auth → 401 ✓
- `/api/cercles/create` POST sans auth → 401 ✓
- `/api/silence/update` POST sans auth → 401 ✓
- `/api/status` → DB ok ✓

---

## What works
- P1 + P2 + P3 + P4 routes (33 routes total)
- Realtime hooks (Fil de Vie + Score + Cagnottes + Impact Mondial — extensible aux posts/réactions en P5+)
- Schema immuable (RLS strict + Fil de Vie DENY DELETE/UPDATE + argent_memoire IMMUTABLE)
- Score d'Humanité algo Postgres (4 composantes pondérées)
- Trigger auto-update split + impact_global + fil_de_vie + auto-completion
- Wizard cagnotte 4 steps + Aria reformulation Sonnet + fallback graceful
- Stripe Checkout one-shot + webhook signature verify + idempotent
- OpenTimestamps stamp async (ne bloque pas le webhook 200)
- MapLibre OSM tiles 0€ + realtime dots animés
- Modération IA Aria avant publish (3 statuts + raison FR)
- 3 réactions seulement (zéro likes/followers)
- Cercles max 12 enforced trigger SQL
- Mode Silence avec plage qui chevauche minuit + pause rapide
- Dashboard avec 5 modules vivants

## What doesn't work / TODO P5+
- ❗ **UAT P3** : Tissma doit créer 1 cagnotte test, faire un don
- ❗ **UAT P4** : Tissma doit publier 1 post normal (published), 1 post limite ("X est nul" → blocked attendu), créer 1 cercle, le rejoindre via 2nd compte, configurer Mode Silence
- TODO P4 (reporté P5/P11) : Stories d'évolution full-screen swipe + Réactions haptique natives mobile
- TODO P5 : VAPID Web Push keys (générer via `npx web-push generate-vapid-keys`)
- TODO P5 : Tables aria_conversations + messages + memory + actions_log + cache 24h
- TODO P5 : SSE streaming chat Aria
- ⚠️ /profile bundle 338 kB (Recharts) → P5 design polish dynamic ssr:false
- ⚠️ /cagnottes/* + /feed bundles ~316 kB — pourrait être code-splitté en P5

---

## Next session priorities — P5 VIDA IA Aria (~3h)

Aria pleine puissance : chat plein écran, mémoire persistante, anticipation interface.

1. Lire BRIEF §3 module 4 (IA Aria) + §11 (juridique IA)
2. Tables SQL : aria_conversations, aria_messages, aria_user_memory (empreinte cognitive), aria_actions_log, aria_cache 24h
3. /aria + /aria/[id] (chat plein écran style ChatGPT mais design KOSHA)
4. POST /api/aria/chat — SSE streaming + sélection auto modèle (Haiku/Sonnet/Opus selon complexité)
5. Empreinte cognitive : Aria se souvient des préférences, ton, projets en cours
6. Anticipation interface : suggestion d'actions contextuelles (basée sur récent fil_de_vie)
7. Build + deploy + UAT (premier vrai chat avec Aria, vérifier qu'elle ne dit JAMAIS "Claude")
