# KOSHA — HANDOFF FINAL

**Date** : 2026-04-26
**Statut** : ✅ TERMINÉ WEB — P1 → P11.web livrées et déployées
**Live** : https://kosha.purama.dev (build `b353dd2` · status `ok` · DB `ok`)
**Tag git** : `v1.0-web`

---

## 1. État complet du projet

### 1.1 Phases livrées (11/11 web)

| Phase | Commit | Livrables |
|---|---|---|
| **P1** Structure + Auth + DB | `9d027d8` → `a4b2734` | Next.js 15 + React 19 + Tailwind 4 + Turbopack · email + Google OAuth (PKCE @supabase/ssr) · cinematic intro · i18n FR/EN base · 14 routes 200 |
| **P2** VIDA CORE — Fil de Vie + Score Humanité | `d1f94bd` + `2b69b81` | Onboarding 5 questions · Fil de Vie immuable (RLS DENY DELETE/UPDATE) · score_humanite_history · profile + universe_personnel |
| **P3** VIDA CAGNOTTE — Stripe + Splits | `d2b7f71` + `e24fff9` | 5 types cagnottes · Stripe Checkout · webhook HMAC · split atomique 70/15/5/10 · OpenTimestamps · carte mondiale · Aria copilote |
| **P4** VIDA SOCIAL — Feed inversé positif | `b660a50` + `779a8c4` | Posts + reactions positives · Cercles de Vie · Mode Silence · modération auto |
| **P5** VIDA IA Aria — Chat SSE | `f13c792` | SSE streaming Sonnet 4.6 · mémoire cognitive (aria_user_memory) · summary Haiku · ligne sacrée anti-jailbreak · RGPD oubli-moi · cache Aria |
| **P6** VIDA MISSIONS — Économie circulaire | `7eedf8e` | 8 missions seedées · validation Aria (confidence) · anti-fraude · Points crédités atomique · purama_point_transactions |
| **P7** VIDA IMPACT — Dashboard transparence + Rapport A4 | `cc35376` | /impact dashboard collectif + personnel · rapport annuel imprimable · impact_global compteurs |
| **P8** VIDA RITUELS — Rituel hebdo planétaire | `3e4fe3a` + `da4bc79` | rituels_calendar · 6 thèmes cycliques (paix/amour/pardon/gratitude/abondance/dépollution) · Aria variations Haiku · live counter Realtime · anti-double UNIQUE 409 |
| **P9** VIDA NEWSLETTER — Living Newsletter™ | `889c602` + `7d7414b` | Hebdo perso · 6 blocs Aria Sonnet 4.6 (où on en est / impact / idée qui élève / action / trace / fermeture) · template HTML responsive dark · RFC 8058 List-Unsubscribe One-Click · anti-doublon UNIQUE (user, week_iso) |
| **P10** VIDA ESPACE PILOTE — Back-office | `4beea36` | 4 pages admin (KPIs · users · config live · logs) · admin_dynamic_config JSONB · admin_logs immutable · triple-check (no_session / wrong_email / wrong_role) · NotAdminError typed · banner gold "Espace Pilote" |
| **P11.web** QA finale + Lighthouse + 3 flows | `b353dd2` | 43/43 tests UAT · Lighthouse > 90 (perf/a11y/BP/SEO) sur /, /login, /signup · 3 flows critiques regression guardian (F1 inscription / F2 cagnotte+webhook / F3 mission+impact) · tag `v1.0-web` |

### 1.2 Métriques finales

```
Backend       9 migrations app · 35+ tables · 14+ triggers SECURITY DEFINER · RLS toutes tables · schéma kosha
Web           66 routes Next 15 (pages + API) · 91 dossiers src/app · App Router + Turbopack
Auth          email + Google OAuth · @supabase/ssr cookies PKCE · session 30j · super_admin triple-check
Aria          Sonnet 4.6 (main) + Haiku 4.5 (fast) · SSE streaming · sacred line · cache · RGPD oubli
CI/CD         Vercel auto-deploy main · Stripe webhook live actif
Tests         43 UAT serial (uat + uat-stripe + uat-aria + uat-missions + uat-impact + uat-rituels + uat-newsletter + uat-admin + uat-final)
Lighthouse    perf 94-97 · a11y 95-96 · BP 96-100 · SEO 90 · LCP 2.4s · CLS 0.002
Quality       tsc 0 · build 0 warning · grep TODO/console/any/Lorem 0
```

### 1.3 Migrations DB (`db/`)

```
schema.sql              (P1 base : profiles, auth trigger, RLS profiles)
p2_vida_core.sql        (fil_de_vie, score_humanite_history, universe_personnel, onboarding_responses, CHECK action_type 21 valeurs)
p3_cagnotte.sql         (cagnottes, cagnotte_contributions, cagnotte_splits, argent_memoire, fraud_signals, impact_global, trigger after_contribution_succeeded)
p4_social.sql           (posts, reactions, cercles, cercle_membres, story_rewards, silence_mode)
p5_aria.sql             (aria_conversations, aria_messages, aria_user_memory, aria_actions_log, aria_cache)
p6_missions.sql         (missions, mission_completions, organizations, mission_funds, purama_point_transactions, trigger crédit Points)
p8_rituels.sql          (rituels_calendar, rituel_participations, ensure_rituels_calendar(N), realtime ALTER PUBLICATION, 8 rituels seedés)
p9_newsletter.sql       (newsletter_subscribers, newsletter_emails, trigger after_profile_insert backfill, UNIQUE user+week_iso)
p10_admin.sql           (admin_dynamic_config, admin_logs immutable, admin_kpis_global() RETURNS JSONB, 7 configs seedées)
```

### 1.4 Tests UAT (`e2e/`)

```
uat.spec.ts             P1+P2 — signup → onboarding → dashboard          11 tests
uat-stripe.spec.ts      P3   — webhook HMAC + split                       3 tests
uat-aria.spec.ts        P5   — chat SSE + sacred line                     4 tests
uat-missions.spec.ts    P6   — validation Aria + anti-fraude              5 tests
uat-impact.spec.ts      P7   — dashboard + rapport A4                     5 tests
uat-rituels.spec.ts     P8   — rituel hebdo + anti-double + Realtime      4 tests
uat-newsletter.spec.ts  P9   — 6 blocs + désabo 1 clic RFC 8058           4 tests
uat-admin.spec.ts       P10  — triple-check (3 reasons distinctes)        4 tests
uat-final.spec.ts       P11  — F1+F2+F3 regression guardian               3 tests
                                                                  TOTAL  43 tests · 0 fail
```

---

## 2. Actions Tissma post-SASU (TOUTES)

Ces actions requièrent physiquement Tissma (KBIS, CNI Onfido, comptes Apple/Google, signatures). Claude Code ne peut pas les faire seul.

### 2.1 Création SASU PURAMA + Asso PURAMA (BLOQUANT pour le reste)

| Action | Lien | Coût | Délai | Statut |
|---|---|---|---|---|
| Statuts SASU PURAMA — 8 Rue Chapelle 25560 Frasne (ZFRR) | Pappers/Legalstart/expert-comptable | 250-500 € | 7-14j | ⏳ |
| Dépôt capital social SASU (≥1 €) | Banque pro Qonto/Shine/Revolut Business | 0-15 €/mois | 24-72h | ⏳ |
| Immatriculation SASU au RCS Besançon | INPI guichet unique | 60 € | 5-10j | ⏳ |
| KBIS SASU | INPI | 0 € | inclus | ⏳ |
| SIRET + N° TVA intracommunautaire FR | INSEE auto post-RCS | 0 € | 7-15j | ⏳ |
| Statuts Association PURAMA (Solenne DORNIER président) | Service-public.fr déclaration | 0 € | 5-7j | ⏳ |
| RNA + JO publication | Service-public.fr | 44 € | 5j | ⏳ |
| Compte bancaire Asso (séparé SASU) | Crédit Mutuel/Crédit Agricole | 0-10 €/mois | 7j | ⏳ |
| Demande agrément ZFRR Frasne (0 % IS 5 ans) | DGFiP Doubs (formulaire 2065-SD) | 0 € | 30-60j | ⏳ |

### 2.2 Apple Developer Program (iOS App Store) — pré-requis P11.mobile

| Action | Coût | Délai | Note |
|---|---|---|---|
| Créer Apple ID Pro `dev@purama.dev` (à éviter `@gmail` perso pour pro) | 0 € | 10 min | Récup auth via TOTP |
| Apple Developer Program Enrollment SASU | 99 €/an | 24-48h | Requiert KBIS + DUNS Number SASU |
| Demander DUNS Number SASU (gratuit via Apple) | 0 € | 5-10j | Apple intègre la demande au formulaire |
| Récupérer **APPLE_TEAM_ID** (10 caractères) | 0 € | inclus | À reporter dans `mobile/eas.json` + .env |
| Créer App ID `dev.purama.kosha` dans Certificates portal | 0 € | 5 min | Capabilities : Push, Universal Links |
| Créer App Store Connect listing KOSHA | 0 € | 30 min | Title, screenshots 6.7"+5.5", description FR/EN, keywords |
| Récupérer **APP_STORE_CONNECT_KEY_ID** + **ISSUER_ID** + **.p8 file** | 0 € | 10 min | Pour EAS submit non-interactif |
| Créer compte démo App Review (`demo@purama.dev` + password) | 0 € | 5 min | Required par Apple Review |
| Privacy policy URL + Support URL | 0 € | déjà OK | `/privacy` + `/contact` live |

### 2.3 Google Play Console (Android) — pré-requis P11.mobile

| Action | Coût | Délai | Note |
|---|---|---|---|
| Créer compte Google Play Console SASU | 25 $ (one-shot) | 24-48h | Identité vérifiée |
| Créer Service Account GCP avec rôle `Service Account User` | 0 € | 10 min | Pour EAS submit non-interactif |
| Télécharger `google-service-account.json` | 0 € | 5 min | À placer dans `mobile/google-service-account.json` (gitignored) |
| Activer Google Play Android Developer API | 0 € | 5 min | Console GCP > APIs & Services |
| Inviter le service account dans Play Console (Release Manager) | 0 € | 5 min | Settings > API access > Grant access |
| Créer App listing KOSHA + Internal testing track | 0 € | 30 min | Screenshots phone+tablet, description, content rating |

### 2.4 Stripe — passage en mode SASU prod

| Action | Coût | Délai | Note |
|---|---|---|---|
| Renseigner SIRET + KBIS dans Stripe dashboard (compte existant déjà live) | 0 € | 15 min | Bascule du compte perso vers entité SASU |
| Confirmer adresse pro 8 Rue Chapelle 25560 Frasne | 0 € | inclus | KYB Stripe |
| Activer Stripe Tax (si CA > 10 K €) | 0,5 % du CA | 24h | Auto-calcul TVA pays UE |
| Activer Stripe Connect (Embedded) — déjà configuré côté code | 0,25 €/transfer | inclus | AccountSession serveur (pas de ca_…) |
| Activer Stripe Climate (1 % CA optionnel) | 1 % opt-in | inclus | Aligné mission Asso |

### 2.5 Treezor — sandbox post-KBIS (pré-Card)

| Action | Coût | Délai | Note |
|---|---|---|---|
| Demande compte sandbox Treezor (KBIS SASU + KYC dirigeant Tissma) | 0 € | 7-14j | Voir `.claude/docs/stripe-karma.md` §27 |
| Récupérer **TREEZOR_CLIENT_ID** + **TREEZOR_CLIENT_SECRET** sandbox | 0 € | inclus | À ajouter dans Vercel env (preview only) |
| Tests E2E KYC Onfido + onboarding Wallet Treezor | 0 € | 1-2j | Pas en prod tant que pas validé sandbox |
| Bascule prod Treezor (post-test sandbox + signature contrat) | 1500-3000 € setup | 30-45j | Frais EME ACPR |

### 2.6 DNS + Mail (Resend `noreply@purama.dev`)

| Action | Coût | Délai | Note |
|---|---|---|---|
| `kosha.purama.dev` CNAME Vercel — **DÉJÀ FAIT** ✅ | 0 € | — | Alias Vercel actif |
| Mail pro `contact@purama.dev` + `dev@purama.dev` (Resend domain verified) | 0 € | inclus | Domaine `purama.dev` à vérifier chez Resend |
| **DKIM** sur `purama.dev` (3 records CNAME `resend._domainkey...`) | 0 € | 1h propag | Hostinger DNS panel |
| **SPF** sur `purama.dev` (`v=spf1 include:amazonses.com ~all`) | 0 € | 1h propag | TXT record racine |
| **DMARC** sur `purama.dev` (`v=DMARC1; p=quarantine; rua=mailto:dmarc@purama.dev`) | 0 € | 1h propag | TXT `_dmarc.purama.dev` |
| `tissma@purama.dev` super-admin alias | 0 € | 5 min | DNS MX ou Resend forward |

### 2.7 CRONs (à activer post-deploy stable)

```
# Génération secret (1×)
openssl rand -hex 32 → CRON_SECRET
printf "$CRON_SECRET\n" | vercel env add CRON_SECRET production --token $VERCEL_TOKEN

# Crons n8n.srv1286148.hstgr.cloud
POST /api/cron/newsletter-weekly   lundi 09:00 Europe/Paris   Bearer $CRON_SECRET
POST /api/cron/rituels-tick        lundi 00:05 UTC            Bearer $CRON_SECRET
```

### 2.8 Monitoring + Backups

| Action | Coût | Délai | Note |
|---|---|---|---|
| Sentry projet `kosha` (org `purama` déjà en place) | 0 € (free tier) | 10 min | DSN à pousser dans Vercel env si Sentry SDK activé |
| BetterStack monitor `https://kosha.purama.dev/api/status` 30s | 0 € (free tier 5 monitors) | 10 min | Alert SMS + email Tissma |
| PostHog projet `kosha` EU cloud | 0 € (free 1M events/mois) | 10 min | NEXT_PUBLIC_POSTHOG_KEY déjà partagé Purama |
| Backup Postgres VPS — déjà configuré côté Hostinger | 0 € | — | docker exec supabase-db pg_dump cron |
| Cron backup S3 weekly (recommandé) | 1-3 €/mois | 1h setup | À ajouter via n8n |

### 2.9 RGPD + Légal (déjà en place)

| Action | Statut |
|---|---|
| `/mentions-legales` (SASU + Frasne + ZFRR) | ✅ live, à mettre à jour avec SIRET dès immat |
| `/politique-confidentialite` (DPO + RGPD) | ✅ live |
| `/cgv` + `/cgu` | ✅ live |
| Aria `/aria/forget-me` (RGPD oubli ciblé) | ✅ implémenté P5 |
| Newsletter unsubscribe `/u/[token]` 1-clic + RFC 8058 | ✅ implémenté P9 |
| Article 293 B (franchise TVA) sur factures | ✅ tant que CA SASU < 36 800 € HT |

---

## 3. Checklist deploy production réelle

### 3.1 Pré-deploy (avant chaque release prod)

- [ ] `npx tsc --noEmit` → 0 erreur (actuellement ✅)
- [ ] `npm run build` → 0 warning (actuellement ✅)
- [ ] `grep -rn "TODO\|FIXME\|console\.log\|placeholder\|Lorem\|: any" src/` → 0 (actuellement ✅)
- [ ] `npx playwright test e2e/uat.spec.ts` → 11/11 ✅
- [ ] `npx playwright test e2e/uat-stripe.spec.ts e2e/uat-aria.spec.ts e2e/uat-missions.spec.ts e2e/uat-impact.spec.ts` → 17/17 ✅
- [ ] `npx playwright test e2e/uat-rituels.spec.ts e2e/uat-newsletter.spec.ts e2e/uat-admin.spec.ts` → 12/12 ✅
- [ ] `npx playwright test e2e/uat-final.spec.ts` → 3/3 ✅ (REGRESSION GUARDIAN obligatoire)
- [ ] `git status` propre (pas de WIP non commit)
- [ ] `git pull origin main` à jour

### 3.2 Deploy Web (Vercel)

```bash
# Auto-deploy : git push origin main → Vercel build + alias kosha.purama.dev
git push origin main

# Manuel forcé :
vercel --prod --token $VERCEL_TOKEN --yes
vercel alias set <NEW_DEPLOY_URL> kosha.purama.dev --token $VERCEL_TOKEN
```

### 3.3 Smoke post-deploy (5 min)

```bash
# Statut
curl -s https://kosha.purama.dev/api/status | jq
# → {"status":"ok","app":"KOSHA","db":{"ok":true},...}

# Routes critiques
for route in / /login /signup /onboarding /dashboard /pricing /privacy /terms /rituels /aide; do
  echo -n "$route → "
  curl -s -o /dev/null -w "%{http_code}\n" https://kosha.purama.dev$route
done
# Attendu : 200 200 200 307→login 307→login 200 200 200 307→login 200

# API publique
curl -s https://kosha.purama.dev/api/missions | jq '.length'
# → 8

# Webhook Stripe (smoke uniquement, signature obligatoire)
curl -X POST https://kosha.purama.dev/api/stripe/webhook -d '{}' | jq
# → {"error":"missing_signature"} (400 attendu)
```

### 3.4 Vérifs cron

```bash
# Tester manuellement les 2 crons (avec CRON_SECRET)
curl -X POST https://kosha.purama.dev/api/cron/newsletter-weekly \
  -H "Authorization: Bearer $CRON_SECRET" | jq

curl -X POST https://kosha.purama.dev/api/cron/rituels-tick \
  -H "Authorization: Bearer $CRON_SECRET" | jq
```

### 3.5 Mobile (P11.mobile — quand Apple+Google OK)

```bash
# Init projet mobile (à faire post-Apple+Google)
cd ~/purama/kosha
mkdir mobile && cd mobile
npx create-expo-app@latest . --template blank-typescript
# Bundle dev.purama.kosha
# Stack : Expo 52 + expo-router + NativeWind + reanimated + Zustand + EAS
# Adapter Supabase SecureStore + Platform.OS === 'web'

# Login EAS (1× par machine)
eas login --token $EXPO_TOKEN

# Premier build iOS (sandbox interne)
eas build --platform ios --profile preview

# Build production iOS + soumission App Store
eas build --platform ios --profile production
eas submit --platform ios --latest

# Build + submit Android
eas build --platform android --profile production
eas submit --platform android --latest

# OTA update (sans review)
eas update --branch production --message "Hotfix X"
```

### 3.6 Rollback immédiat (si incident prod)

```bash
# Lister 10 derniers deploys
vercel ls kosha --token $VERCEL_TOKEN | head -15

# Rollback alias vers deploy stable précédent
vercel alias set <PREVIOUS_DEPLOY_URL> kosha.purama.dev --token $VERCEL_TOKEN

# Si bug DB : revert migration
sshpass -p "$VPS_SSH_PASSWORD" ssh root@72.62.191.111 \
  "docker exec -i supabase-db psql -U postgres -d postgres" < db/<rollback>.sql
```

### 3.7 Activation Treezor + Stripe Connect (post-SASU)

- [ ] KBIS SASU reçu
- [ ] Tissma KYC Onfido validé
- [ ] Treezor sandbox client_id + secret reçus
- [ ] Vercel env `TREEZOR_CLIENT_ID` + `TREEZOR_CLIENT_SECRET` ajoutés via CLI
- [ ] Test flow `/api/treezor/onboard` sandbox
- [ ] Tests E2E carte virtuelle sandbox
- [ ] Bascule prod Treezor signée
- [ ] `TREEZOR_ENV=production` dans Vercel
- [ ] First user activation Card

---

## 4. URLs + IDs (référence permanente)

### 4.1 Production live

| Ressource | URL / ID |
|---|---|
| App live | https://kosha.purama.dev |
| Status endpoint | https://kosha.purama.dev/api/status |
| GitHub repo | https://github.com/puramapro-oss/kosha |
| Vercel project | https://vercel.com/puramapro-oss-projects/kosha |
| Vercel project ID | `prj_OBFakdgJXbClTsFrz8cQOdNYyB06` |
| Vercel team ID | `team_dGuJ4PqnSU1uaAHa26kkmKKk` |
| Vercel team slug | `puramapro-oss-projects` |
| Build SHA actuel | `b353dd2` |
| Tag release web | `v1.0-web` |

### 4.2 Supabase self-hosted

| Ressource | URL / ID |
|---|---|
| Supabase URL (PostgREST + Auth + Realtime) | https://auth.purama.dev |
| Postgres host | `72.62.191.111` |
| Postgres port | `5432` |
| Postgres user | `postgres` |
| Postgres database | `postgres` |
| Schéma KOSHA | `kosha` |
| Auth callback OAuth | https://auth.purama.dev/auth/v1/callback |
| Allow list redirect | `https://*.purama.dev/**` (GOTRUE_URI_ALLOW_LIST) |
| VPS SSH | `root@72.62.191.111` (Hostinger VPS KVM 4) |

### 4.3 Stripe

| Ressource | Note |
|---|---|
| Mode | LIVE (compte personnel jusqu'à bascule SASU) |
| Webhook endpoint prod | https://kosha.purama.dev/api/stripe/webhook |
| Webhook ID | `we_1TQ8cI4Y1unNvKtX6EtyfECR` |
| Events activés | checkout.session.completed, customer.subscription.{created,updated,deleted}, invoice.payment_{succeeded,failed}, charge.refunded |
| Whsec | dans Vercel env `STRIPE_WEBHOOK_SECRET` (Encrypted) |
| Stripe Connect | Embedded Components (AccountSession serveur, **PAS** de `STRIPE_CONNECT_CLIENT_ID`) |

### 4.4 Treezor (à venir post-SASU)

| Ressource | URL / ID |
|---|---|
| Sandbox URL | https://sandbox.treezor.com (à confirmer) |
| Production URL | https://treezor.com/api |
| Client ID sandbox | À renseigner dans Vercel env (preview) |
| Client Secret sandbox | À renseigner dans Vercel env (preview) |
| KYC provider | Onfido (intégration Treezor native) |
| Documentation | https://docs.treezor.com |

### 4.5 Vercel env vars actives (24 production · Encrypted)

```
NEXT_PUBLIC_APP_NAME              KOSHA
NEXT_PUBLIC_APP_SLUG              kosha
NEXT_PUBLIC_APP_DOMAIN            kosha.purama.dev
NEXT_PUBLIC_SITE_URL              https://kosha.purama.dev
NEXT_PUBLIC_SUPABASE_URL          (auth.purama.dev)
NEXT_PUBLIC_SUPABASE_ANON_KEY     (anon JWT)
SUPABASE_SERVICE_ROLE_KEY         (service role JWT)
SUPABASE_AUTH_URL                 https://auth.purama.dev
POSTGRES_HOST                     72.62.191.111
POSTGRES_PORT                     5432
POSTGRES_PASSWORD                 (VPS Postgres)
ANTHROPIC_API_KEY                 (Claude)
ANTHROPIC_MODEL_MAIN              claude-sonnet-4-6
ANTHROPIC_MODEL_FAST              claude-haiku-4-5-20251001
ANTHROPIC_MODEL_PRO               claude-opus-4-7
OPENAI_API_KEY                    (fallback)
STRIPE_SECRET_KEY                 (sk_live_…)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (pk_live_…)
STRIPE_WEBHOOK_SECRET             (whsec_…)
RESEND_API_KEY                    (re_…) ← à ajouter si pas déjà
TAVILY_API_KEY                    (tvly-dev-…)
INSEE_API_KEY                     (Sirene API)
PAPPERS_API_KEY                   (agrégateur juridique)
SENTRY_AUTH_TOKEN                 (sntrys_…)
SENTRY_ORG                        purama
PINECONE_API_KEY                  (pcsk_…)
UPSTASH_MANAGEMENT_API_KEY        (Upstash)
BETTERSTACK_API_KEY               (uptime)
EXPO_TOKEN                        (Expo)
EXPO_PUBLIC_SUPABASE_URL          https://auth.purama.dev
EXPO_PUBLIC_SUPABASE_ANON_KEY     (anon JWT)
VPS_IP                            72.62.191.111
DOMAIN                            purama.dev
VERCEL_TOKEN                      (self-ref)
CRON_SECRET                       ⏳ à générer (openssl rand -hex 32)
```

### 4.6 Mobile bundle (P11.mobile à venir)

| Ressource | Valeur |
|---|---|
| Bundle iOS | `dev.purama.kosha` |
| Package Android | `dev.purama.kosha` |
| Universal Links domain | `kosha.purama.dev` |
| AppStore Connect ID | À remplir post-Apple Developer |
| Google Play package | `dev.purama.kosha` |
| EAS project | À créer via `eas init` post-EXPO_TOKEN config |

### 4.7 Monitoring + Analytics (à activer post-deploy stable)

| Service | URL | Statut |
|---|---|---|
| Sentry | https://purama.sentry.io/projects/kosha | ⏳ projet à créer |
| PostHog | https://eu.posthog.com (project KOSHA) | ⏳ project key déjà partagé Purama |
| BetterStack | https://uptime.betterstack.com | ⏳ monitor à créer sur /api/status |
| Vercel Analytics | https://vercel.com/puramapro-oss-projects/kosha/analytics | ✅ auto-actif |

### 4.8 Crons à câbler (n8n + CRON_SECRET)

```
POST /api/cron/newsletter-weekly   lundi 09:00 Europe/Paris   (génère + envoie newsletters hebdo)
POST /api/cron/rituels-tick        lundi 00:05 UTC            (avance le rituel actif + génère prochains)
```

### 4.9 Commits clés (P1 → P11.web)

```
b353dd2 feat(p11-web): QA finale + Lighthouse > 90 + 3 flows regression guardian
4beea36 feat(p10-admin): Espace Pilote — back-office Tissma triple-check
7d7414b docs(p9): handoff + task_plan → P9 ✅ COMPLETED, P10 next, 36/36 tests
889c602 feat(p9-newsletter): Living Newsletter™ hebdo + 6 blocs Aria + désabo 1 clic
da4bc79 docs(p8): handoff + task_plan + ERRORS + harmonize action_type 'rituel_participated'
3e4fe3a feat(p8-rituels): rituel hebdo planétaire + 6 thèmes cycliques + Aria variations
cc35376 feat(p7-impact): VIDA IMPACT — dashboard transparence + rapport annuel imprimable
7eedf8e feat(p6-missions): VIDA MISSIONS — 8 missions seed + validation Aria + Points
f13c792 feat(p5-aria): VIDA IA Aria — chat SSE streaming + memoire cognitive + RGPD
e48a5dd feat(p3): UAT Stripe webhook autonome (3 tests) + fix trigger fil_de_vie columns
b660a50 feat(p4-social): VIDA SOCIAL — Feed inversé positif + Cercles + Mode Silence
d2b7f71 feat(p3-cagnotte): VIDA CAGNOTTE — 5 types + Stripe + Treezor stub + Aria + OpenTimestamps
d1f94bd feat(p2-vida-core): VIDA CORE — Fil de Vie + Score Humanite + Onboarding + Profile
9d027d8 feat(p1): KOSHA scaffold — Next 15 + Supabase + auth + i18n + cinematic
```

---

## 5. Reste à faire (post-handoff)

### 5.1 P11.mobile (1 phase web restante → mobile)

Bloqué par §2.2 Apple Developer + §2.3 Google Play. Une fois ces 2 comptes ouverts :
- Init `mobile/` Expo 52 + expo-router + NativeWind + EAS
- Adapter Supabase storage SecureStore (mobile) + localStorage (web) via Platform.OS
- Implémenter `react-native-health` + `react-native-health-connect` si KOSHA devient wellness
- Maestro 10 flows YAML + screenshots EAS metadata 16 langues
- `eas build` + `eas submit` iOS + Android
- Universal Links `.well-known/apple-app-site-association` + `assetlinks.json`

### 5.2 Ops post-handoff (autonomes, pas bloquées par SASU)

- [ ] Générer `CRON_SECRET` + ajouter Vercel env (CLI)
- [ ] Câbler 2 crons n8n (newsletter-weekly + rituels-tick)
- [ ] Vérifier Resend `noreply@purama.dev` (DKIM/SPF/DMARC) sur Hostinger DNS
- [ ] (Optionnel) Sentry + BetterStack + PostHog
- [ ] (Optionnel) Payouts ambassadeurs : table `influencer_payouts_pending` + page admin (~30 min)

---

## 6. Reprendre le travail (1 commande)

```bash
cd ~/purama/kosha && claude --dangerously-skip-permissions
```

Au prochain démarrage Claude Code lit dans l'ordre :
1. `task_plan.md` (P1→P11.web ✅, P11.mobile ⏳)
2. `progress.md` (état exact)
3. `handoff.md` (rapport phases)
4. **`HANDOFF-FINAL.md` (ce fichier — la référence absolue)**
5. `ERRORS.md` + `PATTERNS.md` (apprentissages)
6. `e2e/RAPPORT_UAT.md` (43/43 tests + Lighthouse)

Aucune phase web restante — uniquement P11.mobile + actions Tissma listées en §2.

---

**🌱 KOSHA est née. Elle attend juste son immatriculation pour devenir adulte.**
