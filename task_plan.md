# KOSHA — TASK PLAN

**Slug** : kosha | **Domain** : kosha.purama.dev | **Schema** : kosha
**Bundle mobile** : dev.purama.kosha | **IA** : Aria
**Démarré** : 2026-04-25

---

## P1 — Setup & Auth (~2h) — ✅ COMPLETED 2026-04-25

- [x] P1.1 task_plan + progress + handoff init
- [x] P1.2 Next.js 15.5.15 + React 19.1 + TS strict + Tailwind 4 + Turbopack
- [x] P1.3 .env.local (29 vars) + src/lib (constants, utils, supabase, supabase-server, claude Aria, stripe, resend) + src/types
- [x] P1.4 SQL schema kosha via SSH VPS (profiles + RLS + triggers + super admin Tissma seedé UUID bc865aa4)
- [x] P1.5 Google OAuth VPS config — déjà actif via wildcard `*.purama.dev` (aucune modif requise)
- [x] P1.6 Auth pages (login, signup, forgot-password) + middleware @supabase/ssr + auth/callback + /api/auth/signout
- [x] P1.7 i18n port from YANA — 16 locales JSON copiés, next-intl plugin wired
- [x] P1.8 Layout root (Sora display + DM Sans body + JetBrains Mono + Toaster sonner) + globals.css palette PURAMA + glass + gradients + animations + prefers-reduced-motion
- [x] P1.9 Page accueil app-screen + CinematicIntro 3s scramble + aberration chromatique + skip Escape
- [x] P1.10 Build OK (0 err, 11 routes, 89.9 kB middleware) + git push GitHub puramapro-oss/kosha + Vercel project link + 76 env vars × 3 envs + deploy production READY + domain kosha.purama.dev attached

**GATE P1 ✅** :
- https://kosha.purama.dev → HTTP 200
- https://kosha.purama.dev/api/status → `{"status":"ok","app":"KOSHA","db":{"ok":true}}`
- /login, /signup, /forgot-password → 200 avec design KOSHA
- /dashboard sans auth → 307 redirect /login?next=/dashboard (middleware OK)
- DB Postgres `kosha` exposée via PostgREST (PGRST_DB_SCHEMAS contient `kosha`)
- Google OAuth + email/password fonctionnels (à tester end-to-end en P2)

---

## P2 — VIDA CORE (~3h) — PENDING

- [ ] P2.1 Tables SQL (fil_de_vie, score_humanite_history, universe_personnel, onboarding_responses)
- [ ] P2.2 Page /dashboard avec moment WOW (3 KPIs animés)
- [ ] P2.3 Page /profile + Fil de Vie timeline immuable
- [ ] P2.4 Onboarding 30s (3 questions max)
- [ ] P2.5 ScoreHumaniteJauge + UniversPersonelRadar composants
- [ ] P2.6 Hooks useFilDeVie + useScoreHumanite (Supabase realtime)

---

## P3 — VIDA CAGNOTTE (~5h) — PENDING

- [ ] P3.1 Tables (cagnottes 5 types + contributions + splits 70/15/5/10 + argent_memoire OpenTimestamps + fraud_signals + impact_global/user)
- [ ] P3.2 Pages /cagnottes (grid) + /cagnottes/nouvelle (wizard 4 steps) + /cagnottes/[id]
- [ ] P3.3 API create + contribute + Stripe webhook + Treezor split (stub)
- [ ] P3.4 Aria reformulation cagnotte (Sonnet)
- [ ] P3.5 Anti-fraude IA + signalement communautaire
- [ ] P3.6 /impact-mondial avec MapLibre + tiles MapTiler

---

## P4 — VIDA SOCIAL (~4h) — PENDING

- [ ] P4.1 Tables (posts, cercles, cercle_membres, reactions [energie|gratitude|soutien], story_rewards, silence_mode)
- [ ] P4.2 Page /feed (feed inversé positif filtré IA)
- [ ] P4.3 Pages /cercles + /cercles/[id]
- [ ] P4.4 Stories d'évolution (full screen swipe) + auto-rémunération
- [ ] P4.5 Réactions multisensorielles (haptique + sons subtils)
- [ ] P4.6 Mode Silence config (/silence)

---

## P5 — VIDA IA Aria (~3h) — PENDING

- [ ] P5.1 Tables (aria_conversations, aria_messages, aria_user_memory, aria_actions_log, aria_cache 24h)
- [ ] P5.2 Pages /aria + /aria/[id] (chat plein écran style ChatGPT mais design KOSHA)
- [ ] P5.3 API streaming SSE + sélection auto modèle (Haiku/Sonnet/Opus)
- [ ] P5.4 Empreinte cognitive persistante par user
- [ ] P5.5 Anticipation interface (adaptation contextuelle)
- [ ] P5.6 System prompt Aria (jamais "Claude", éveil subtil)

---

## P6 — VIDA MISSIONS (~4h) — PENDING

- [ ] P6.1 Tables (missions, completions, referral_codes, referrals, commissions, influencer_*, pub_interne, redistribution_ca, redistribution_payouts)
- [ ] P6.2 Pages /missions + /missions/[id]
- [ ] P6.3 Page /parrainage (code, lien /i/CODE, filleuls, commissions)
- [ ] P6.4 Page /influenceur (dashboard) + /influenceur/apply
- [ ] P6.5 Page /wallet (solde + retrait IBAN min 5€)
- [ ] P6.6 Page /redistribution (transparence Score d'Humanité)
- [ ] P6.7 Page /pub-interne
- [ ] P6.8 CRON redistribution mensuelle 1er du mois (Treezor batch stub)

---

## P7 — VIDA IMPACT (~2h) — PENDING

- [ ] P7.1 Tables (impact_actions, impact_miroir_monthly)
- [ ] P7.2 ImpactLive composant (animation 300ms par action)
- [ ] P7.3 MapImpactGlobal (MapLibre + Supabase realtime points)
- [ ] P7.4 MiroirPersonnel mensuel généré par Aria
- [ ] P7.5 MemoireImpactCross apps Purama

---

## P8 — VIDA RITUELS (~2h) — PENDING

- [ ] P8.1 Tables (rituels_calendar, rituel_participations, notifications_push)
- [ ] P8.2 Page /rituels + countdown + live bar
- [ ] P8.3 CRON weekly trigger (lundi 00:00 UTC)
- [ ] P8.4 CRON push notif (1h avant + au moment, respecte Mode Silence)
- [ ] P8.5 Aria variations cycliques

---

## P9 — VIDA NEWSLETTER (~1h) — PENDING

- [ ] P9.1 Tables (newsletter_subscribers, newsletter_emails, user_actions)
- [ ] P9.2 Template Resend HTML responsive (6 blocs)
- [ ] P9.3 CRON weekly (lundi 9h, Aria génère perso)
- [ ] P9.4 Tracking taux d'action (pas juste ouverture)
- [ ] P9.5 Désabonnement 1 clic

---

## P10 — VIDA ESPACE PILOTE (~3h) — PENDING

- [ ] P10.1 Tables (admin_dynamic_config, admin_logs, influencer_payouts_pending)
- [ ] P10.2 Triple vérification admin (JWT + email + role)
- [ ] P10.3 Pages /admin/* (KPI, users, cagnottes, redistribution, influencers, pricing, textes, features, aria, impact, dons)
- [ ] P10.4 Modif prix temps réel (write admin_dynamic_config)
- [ ] P10.5 Validation payouts influenceurs

---

## P11 — Tests + Mobile + Stores (~4h) — PENDING

- [ ] P11.1 Playwright 21 SIM + 0 fail
- [ ] P11.2 Lighthouse > 90
- [ ] P11.3 3 flows critiques (signup→cagnotte→wallet ; parrainage ; retrait)
- [ ] P11.4 Visual verification (screenshot test, 3-second test)
- [ ] P11.5 Expo 52 init mobile (kosha-mobile, dev.purama.kosha)
- [ ] P11.6 Auth mobile (SecureStore + Platform.OS adapter)
- [ ] P11.7 Icônes Pollinations + sharp + splash screens
- [ ] P11.8 RevenueCat stub + Apple Pay/Google Pay config
- [ ] P11.9 Boutons iOS texte neutre / Android texte complet
- [ ] P11.10 EAS build iOS + Android (artifacts only, soumission post-SASU)
- [ ] P11.11 Conformité légale finale (RGPD + DSA + DSP2 + 7 règles sacrées BRIEF)
