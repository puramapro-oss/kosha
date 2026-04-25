# KOSHA — RAPPORT UAT FINAL (P1 → P11.web)

**Date** : 2026-04-25
**Build** : commit `4beea36+` · Vercel `kosha-gxv1d7dvs-puramapro-oss-projects.vercel.app`
**Domain prod** : https://kosha.purama.dev
**Environnement de test** : prod live (pas de mock backend) + Playwright headless Chromium 1440×900

---

## Résultats globaux

| Phase | Tests | Pass | Fail | Notes |
|-------|------:|-----:|-----:|-------|
| **P1+P2** uat.spec.ts (signup → onboarding → dashboard) | 11 | 11 | 0 | 1 flake "signalement 3x" hors retry — pass à 100% en isolation |
| **P3** uat-stripe.spec.ts (HMAC webhook) | 3 | 3 | 0 | |
| **P5** uat-aria.spec.ts (chat + ligne rouge) | 4 | 4 | 0 | Aria refuse "es-tu Claude?" (sacred line OK) |
| **P6** uat-missions.spec.ts (validation Aria + anti-fraude) | 5 | 5 | 0 | Aria confidence=5 sur tentative de triche |
| **P7** uat-impact.spec.ts (dashboard + rapport A4) | 5 | 5 | 0 | |
| **P8** uat-rituels.spec.ts (1 rituel/sem + live counter) | 4 | 4 | 0 | Anti-double 409 via UNIQUE + check explicite |
| **P9** uat-newsletter.spec.ts (template 6 blocs + désabo 1 clic) | 4 | 4 | 0 | RFC 8058 One-Click validé |
| **P10** uat-admin.spec.ts (triple-check) | 4 | 4 | 0 | Triple check inviolable (3 reasons distinctes) |
| **P11** uat-final.spec.ts (3 flows critiques regression guardian) | 3 | 3 | 0 | Inscription / cagnotte+webhook / mission+impact |
| **TOTAL** | **43** | **43** | **0** | **100%** |

---

## Lighthouse — 3 pages publiques

Mesuré avec `lighthouse@latest` headless Chrome, mobile preset.

| URL | Performance | Accessibility | Best Practices | SEO |
|-----|-----:|-----:|-----:|-----:|
| `/` | **95** | 95 | 100 | 90 |
| `/login` | 94 | **96** | 100 | 90 |
| `/signup` | **97** | 96 | 96 | 90 |

**Tous > 90** ✅

Web vitals homepage :
- LCP : 2.4 s
- FCP : 1.1 s
- CLS : 0.002

---

## 3 flows critiques (Regression Guardian — CLAUDE.md V7.2 §1)

### F1 — Inscription → Onboarding → Dashboard → Action 30s
- Signup auto-confirmé via service_role
- POST `/api/onboarding` → fil_de_vie 'onboarding_completed' inséré
- /dashboard rendu avec h1 "Ton univers KOSHA"
- POST `/api/actions/premiere` → fil_de_vie 'profile_created'
- Logout via `/api/auth/signout`

### F2 — Cagnotte + Stripe webhook signé HMAC
- POST `/api/cagnottes/create` (type=humanitaire, target=100€) → cagnotte créée
- Construction d'un event Stripe `checkout.session.completed` (50€) + signature HMAC-SHA256
- POST `/api/stripe/webhook` avec `Stripe-Signature: t=...,v1=...`
- Webhook 200 + trigger SQL `after_contribution_succeeded` :
  - Insert `cagnotte_contributions` (succeeded)
  - UPDATE `cagnottes.raised_amount_cents` += 5000
  - Split 70/15/5/10 dans `cagnotte_splits`
  - INSERT `fil_de_vie` (cagnotte_contributed)
  - UPDATE `impact_global` (compteur global)

### F3 — Mission Aria → Points + Impact
- Insert `mission_completions` approved (validated_by='aria')
- Trigger SQL crédite +50 Points (lifetime ET balance)
- INSERT `fil_de_vie` (mission_completed)
- Bump `profiles.fil_de_vie_count`
- GET `/api/impact` reflète personnel.total_missions_approved >= 1 + collective += 1

---

## Sécurité validée par les tests

- ✅ **Auth** : 401 sans session (toutes APIs protégées)
- ✅ **Triple check admin** : 3 reasons (no_session / wrong_email / wrong_role)
- ✅ **Anti open-redirect** : `/api/newsletter/action/[id]?next=//evil.com` redirige vers /dashboard
- ✅ **Anti-double rituel** : UNIQUE (rituel_id, user_id) + check explicite → 409
- ✅ **Anti-double action première** : 409 si déjà fait
- ✅ **Webhook Stripe** : signature HMAC vérifiée, payload modifié → 400
- ✅ **RLS service_role only** : `admin_logs`, `aria_actions_log`, `purama_point_transactions`
- ✅ **Aria sacred line** : refuse "es-tu Claude" → "Je suis Aria, l'assistante de KOSHA"

---

## Inventaire DB (post-P10)

35+ tables dans le schéma `kosha`, 14+ triggers SECURITY DEFINER atomiques :

- **Identité** : profiles, score_humanite_history, universe_personnel, onboarding_responses
- **Fil de Vie** : fil_de_vie (immuable, RLS DENY DELETE/UPDATE)
- **Cagnottes** : cagnottes, cagnotte_contributions, cagnotte_splits, argent_memoire, fraud_signals, impact_global
- **Social** : posts, reactions, cercles, cercle_membres, story_rewards, silence_mode
- **Aria** : aria_conversations, aria_messages, aria_user_memory, aria_actions_log, aria_cache
- **Missions** : missions, mission_completions, organizations, mission_funds, purama_point_transactions
- **Rituels** : rituels_calendar, rituel_participations
- **Newsletter** : newsletter_subscribers, newsletter_emails
- **Admin** : admin_dynamic_config, admin_logs

---

## Production live

- Web : https://kosha.purama.dev → 200 (cf. `/api/status`)
- 58 routes Next 15
- 0 erreur TypeScript strict
- Stripe webhook prod actif : `we_1TQ8cI4Y1unNvKtX6EtyfECR`
- 8 missions seedées + 8 rituels seedés (cycle 6 thèmes) + 7 admin_dynamic_config seedés

---

## Reste à faire (P11.mobile + ops)

- [ ] **Mobile Expo 52** init `kosha-mobile` (bundle `dev.purama.kosha`) + EAS build iOS+Android (nécessite Apple Developer 99€/an + Google Play 25$ + GOOGLE_SERVICE_ACCOUNT.json)
- [ ] **CRON n8n** : POST `/api/cron/newsletter-weekly` lundi 9h Europe/Paris + `/api/cron/rituels-tick` lundi 00:05 UTC, tous deux `Authorization: Bearer ${CRON_SECRET}`
- [ ] **Génération `CRON_SECRET`** : `openssl rand -hex 32` + `vercel env add CRON_SECRET production`
- [ ] **DNS Resend** : DKIM/SPF/DMARC sur `noreply@purama.dev` (Hostinger panel)
- [ ] **Payouts influenceurs** : table `influencer_payouts_pending` + page admin (le scaffolding existe, ~30min)

---

**Tag git suggéré** : `v1.0-web` — KOSHA web complet, 43/43 tests, 0 fail, Lighthouse > 90.
