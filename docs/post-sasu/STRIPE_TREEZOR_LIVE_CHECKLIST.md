# KOSHA — Stripe Live + Treezor EME ACPR Onboarding (post-SASU)

> Document spécifique KOSHA. **Différent de SHANTI/MUKTI** : KOSHA combine Stripe (web subscriptions) ET Treezor (redistribution SEPA EME ACPR).

## Architecture financière KOSHA

```
┌─ Subscriptions ────────────────────────────────────────┐
│                                                          │
│  iOS  ──→ Apple StoreKit ──→ RevenueCat ──┐              │
│  Android ──→ Google Play Billing ──→ ─────┼─→ entitlements│
│  Web ──→ Stripe ──────────────────────────┘              │
│                                                          │
└──────────────────────────────────────────────────────────┘
                            │
                            │ webhook
                            ▼
              ┌─ KOSHA backend (Vercel) ─┐
              │  - update profiles.plan   │
              │  - increment SASU CA      │
              │  - 50% pool redistribution│
              └───────────────────────────┘
                            │
                            │ daily / monthly cron
                            ▼
              ┌─ Treezor (EME ACPR) ─────┐
              │  - SEPA instant payouts  │
              │  - KYC for >1000€        │
              │  - AML compliance        │
              │  - User wallet hold      │
              └───────────────────────────┘
                            │
                            │ SEPA instant
                            ▼
                       USER IBAN
```

## ÉTAPE A — STRIPE LIVE MODE (web subscriptions)

> Activation similaire à MUKTI/SHANTI. Si Stripe SASU déjà actif pour ces apps, **passer directement à ②**.

### A.① Compte Stripe SASU — KYC

URL : https://dashboard.stripe.com/account/onboarding

1. Toggle **live mode**.
2. KYC business — KBIS, RIB, CNI Tissma, SIREN, ZFRR statut.
3. Industry : "Social network with community rewards" (closest match).
4. Description : "Ultra-positive social network with redistribution mechanism operated by Treezor (EME ACPR licensed)."
5. Validation : 2-7 jours.

> Si Stripe pose des questions sur "financial features" → **réponse claire** : "KOSHA does NOT process financial transactions. All money flows are operated by Treezor SAS, an EME licensed by ACPR (Banque de France) under EU PSD2. KOSHA collects subscription fees only via Stripe (for web) or Apple/Google IAP (for mobile)."

### A.② Products + Prices Stripe (web only)

URL : https://dashboard.stripe.com/products → Create product.

> ⚠️ **iOS et Android utilisent RevenueCat / Apple StoreKit / Google Play Billing — PAS Stripe.** Stripe ne sert que pour les abonnements WEB.

| Product | Price | Lookup key |
|---|---|---|
| KOSHA Standard (web) | 9,99 €/mois | `kosha_standard_monthly_web` |
| KOSHA Winback (web) | 4,99 €/mois | `kosha_winback_monthly_web` |

```bash
VERCEL_TOKEN=$(grep VERCEL_TOKEN .env.secrets | cut -d= -f2)

printf "price_xxxx\n" | vercel env add STRIPE_PRICE_STANDARD_MONTHLY production --token $VERCEL_TOKEN
printf "price_xxxx\n" | vercel env add STRIPE_PRICE_WINBACK_MONTHLY production --token $VERCEL_TOKEN
```

### A.③ Webhook Stripe prod

URL : https://dashboard.stripe.com/webhooks → Add endpoint.

```
URL    : https://kosha.purama.dev/api/stripe/webhook
Events :
  checkout.session.completed
  checkout.session.expired
  customer.subscription.created
  customer.subscription.updated
  customer.subscription.deleted
  customer.subscription.trial_will_end
  invoice.payment_succeeded
  invoice.payment_failed
  charge.refunded
```

```bash
printf "whsec_xxxx\n" | vercel env add STRIPE_WEBHOOK_SECRET production --token $VERCEL_TOKEN
```

### A.④ Tax (TVA SASU)

- **Régime** : franchise art. 293B → Stripe Tax désactivé.
- **Si seuil 91 900 € HT/an dépassé** : activer Stripe Tax + ajouter VAT number SASU.

## ÉTAPE B — TREEZOR EME ACPR ONBOARDING

> **Ce qui prend du TEMPS** : Treezor onboarding peut durer **2-8 semaines** selon la complexité du dossier. Démarrer EN PARALLÈLE de Stripe (pas séquentiel).

### B.① Premier contact Treezor

URL : https://www.treezor.com/contact-commercial

1. Form contact : "PURAMA SASU, social network with community redistribution".
2. Use case : "Redistribute 50% of monthly SaaS subscription revenue to active users based on social score, via SEPA instant payouts."
3. Volume estimé : (à donner : 10K, 100K, 1M users projection).
4. Treezor répond sous 1-3j.

### B.② Sales call + scoping

1. Call commercial Treezor (1h).
2. Discussion technique : API, sandbox, prod.
3. Estimation pricing : Treezor charge ~0,30 € par SEPA payout + frais mensuels plateforme.
4. NDA signé.

### B.③ Onboarding documentation

Treezor demande :

| Document | Source |
|---|---|
| KBIS | INPI |
| Statuts SASU | Notaire |
| Pacte d'actionnaires | (si plusieurs actionnaires) |
| Identité actionnaires (CNI + justificatif domicile) | Tissma |
| Bilans 3 dernières années | (N/A si SASU < 3 ans, déclaration sur l'honneur) |
| Business plan | Rédiger 5-10 pages |
| AML/KYC policy | Rédiger (Treezor fournit template) |
| Conditions Générales d'Utilisation | Rédiger avec mention Treezor |
| GDPR DPO contact | dpo@purama.dev (ITGS Conseil) |

### B.④ Audit légal (2-4 semaines)

Treezor compliance team audite :
- Use case business : conforme PSD2 ?
- Flux d'argent : KOSHA ne touche pas les fonds ?
- AML/KYC policy : adéquate ?
- Tech stack : APIs sécurisées ?
- Cybersécurité : tests pénétration faits ?

### B.⑤ Approbation contractuelle

Si OK :
1. Contrat Treezor signé (DocuSign).
2. Frais d'onboarding : variable (5-25K€ à clarifier au call commercial).
3. Sandbox API access fourni.

```env
TREEZOR_API_KEY_SANDBOX=...
TREEZOR_API_URL_SANDBOX=https://sandbox.treezor.com/v1
```

### B.⑥ Intégration sandbox (1-2 semaines dev)

Test :
- Création user Treezor (`POST /users`).
- Création wallet (`POST /wallets`).
- Création virement SEPA test (`POST /payouts`).
- KYC user level 1 (basic) et level 2 (full above 1000€).
- Webhook Treezor → KOSHA backend.

### B.⑦ Validation prod + go-live

Après tests sandbox OK :
1. Treezor active mode prod.
2. Frais récurrents activés.
3. KYC officielle Tissma + SASU.

```bash
printf "live_xxxx\n" | vercel env add TREEZOR_API_KEY_PROD production --token $VERCEL_TOKEN
printf "https://m2.treezor.com/v1\n" | vercel env add TREEZOR_API_URL production --token $VERCEL_TOKEN
```

### B.⑧ Webhook Treezor prod

```
URL : https://kosha.purama.dev/api/treezor/webhook
Events : payout.created, payout.processed, payout.failed,
         user.kycReview, user.kycValidated, user.kycRefused,
         wallet.balance.updated
```

```bash
printf "whsec_xxxx\n" | vercel env add TREEZOR_WEBHOOK_SECRET production --token $VERCEL_TOKEN
```

## ÉTAPE C — INTÉGRATION REVENUECAT (cross-platform entitlements)

> Cf. `APPLE_DEVELOPER_SETUP.md` § ⑨ et `GOOGLE_PLAY_SETUP.md` § ⑩ pour le setup détaillé.

Récap env vars :

```env
# RevenueCat (côté client : iOS + Android)
NEXT_PUBLIC_REVENUECAT_API_KEY_IOS=appl_...
NEXT_PUBLIC_REVENUECAT_API_KEY_ANDROID=goog_...

# RevenueCat (côté serveur : webhook validation, customer fetch)
REVENUECAT_API_KEY_SECRET=sk_...
REVENUECAT_WEBHOOK_SECRET=whsec_...
```

```bash
# Tous via Vercel CLI (cf §37 CLAUDE.md)
printf "appl_xxx\n" | vercel env add NEXT_PUBLIC_REVENUECAT_API_KEY_IOS production --token $VERCEL_TOKEN
printf "goog_xxx\n" | vercel env add NEXT_PUBLIC_REVENUECAT_API_KEY_ANDROID production --token $VERCEL_TOKEN
printf "sk_xxx\n" | vercel env add REVENUECAT_API_KEY_SECRET production --token $VERCEL_TOKEN
printf "whsec_xxx\n" | vercel env add REVENUECAT_WEBHOOK_SECRET production --token $VERCEL_TOKEN
```

### Webhook RevenueCat → Supabase

```
URL    : https://kosha.purama.dev/api/revenuecat/webhook
Events : INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION,
         BILLING_ISSUE, PRODUCT_CHANGE, TRANSFER, NON_RENEWING_PURCHASE
```

## ÉTAPE D — REDISTRIBUTION CRON (50% CA mensuel)

> Logique métier KOSHA spécifique. Cron mensuel le 1er du mois à 03:00 UTC.

### D.① CRON Vercel

`vercel.json` (à ajouter si pas présent) :

```json
{
  "crons": [
    {
      "path": "/api/cron/redistribution-mensuelle",
      "schedule": "0 3 1 * *"
    }
  ]
}
```

### D.② Logique

```ts
// src/app/api/cron/redistribution-mensuelle/route.ts (concept)
export async function POST(req: Request) {
  // 1. Vérifier secret CRON
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) return new Response("403", { status: 403 });

  // 2. Calculer CA du mois précédent (Stripe + RevenueCat)
  const stripeRevenue = await calculateStripeRevenuePreviousMonth();
  const iapRevenue = await calculateRevenueCatRevenuePreviousMonth();
  const totalCA = stripeRevenue + iapRevenue;

  // 3. Pool redistribution (BRIEF VITAE §20.2)
  const poolRedistribution = totalCA * 0.5; // 50% users
  // const poolAsso = totalCA * 0.10;  // 10% asso (cf BRIEF)
  // const poolSASU = totalCA * 0.40;  // 40% SASU

  // 4. Récupérer users actifs avec Score d'Humanité
  const activeUsers = await getUsersWithScoreHumanite();
  const totalScore = activeUsers.reduce((sum, u) => sum + u.score_humanite, 0);

  // 5. Pour chaque user → redistribution Treezor SEPA instant
  for (const user of activeUsers) {
    const userShare = (user.score_humanite / totalScore) * poolRedistribution;

    if (userShare < 0.01) continue; // skip cents

    if (user.kyc_level >= 2 || userShare < 1000) {
      // SEPA instant via Treezor
      await treezorClient.payouts.create({
        userId: user.treezor_user_id,
        amount: Math.round(userShare * 100), // centimes
        currency: "EUR",
        instant: true,
      });
    } else {
      // accumuler dans wallet KOSHA jusqu'à KYC
      await accumulateInPendingWallet(user.id, userShare);
    }
  }

  return new Response("OK");
}
```

### D.③ Tests et alertes

- **Sentry** : alerter si redistribution échoue partiellement.
- **PostHog** : tracker volume distribué + nb d'users payés.
- **Email Tissma** : récap mensuel auto (volume distribué, top users, alertes KYC).

## ÉTAPE E — DOCUMENTS LÉGAUX À PUBLIER

> **Avant de submit** Apple/Google, ces pages DOIVENT exister sur `kosha.purama.dev` :

| URL | Contenu |
|---|---|
| `/legal/cgv` | CGV avec mention "Treezor opérateur EME ACPR" |
| `/legal/aml-kyc` | AML/KYC policy publique |
| `/legal/moderation` | Community guidelines + zero tolerance |
| `/legal/confidentialite` | RGPD Privacy Policy |
| `/legal/conditions-redistribution` | Algorithme Score d'Humanité expliqué |

## ÉTAPE F — SMOKE TESTS POST-LIVE

```bash
# Stripe live actif
curl -s -u "${STRIPE_SECRET_KEY}:" https://api.stripe.com/v1/account \
  | jq '{ livemode, country, charges_enabled, payouts_enabled }'

# Stripe webhook fonctionnel
curl -s -u "${STRIPE_SECRET_KEY}:" https://api.stripe.com/v1/webhook_endpoints \
  | jq '.data[] | select(.url | test("kosha")) | { url, status, livemode }'

# Treezor prod actif
curl -s -H "Authorization: Bearer ${TREEZOR_API_KEY_PROD}" \
  https://m2.treezor.com/v1/users | jq '.users | length'

# RevenueCat projet actif
curl -s -H "Authorization: Bearer ${REVENUECAT_API_KEY_SECRET}" \
  https://api.revenuecat.com/v2/projects | jq

# CRON redistribution simulé (avec un secret)
curl -X POST https://kosha.purama.dev/api/cron/redistribution-mensuelle \
  -H "Authorization: Bearer $CRON_SECRET" | jq
```

## ÉTAPE G — TIMELINE RÉALISTE POST-SASU

| Semaine | Action |
|---|---|
| S1-S2 | Apple Dev + Google Play setup (cf docs) |
| S1-S8 | Treezor onboarding (en parallèle, plus long) |
| S2-S3 | Stripe live mode KYC + Products + Webhook |
| S3-S4 | RevenueCat config + IAP test sandbox |
| S4-S5 | Build + soumissions Apple/Google internal testing |
| S6-S7 | Closed testing avec 20-50 ambassadeurs |
| S8 | Treezor prod activé (si onboarding done) |
| S9 | First redistribution cron simulée |
| S10-S12 | Open testing + production rollout staged |

> **Critique** : ne PAS lancer Apple/Google avant d'avoir Treezor sandbox au minimum, car les notes de review mentionnent Treezor — Apple/Google peuvent demander preuve.

## Backup si Treezor échoue

Si Treezor refuse l'onboarding (rare mais possible) :
- **Lemonway** : autre EME français, similar pricing.
- **Stripe Connect Custom** + Treezor compete : Stripe a des marketplace flows mais pas EME licensed pour redistribution massive.
- **Adyen for Platforms** : forte solution mais setup plus complexe.

> Pour KOSHA, **Treezor est le bon choix par défaut** (français, déjà utilisé par Lydia, Memo Bank, Aircall — solide track record).

## Cohérence avec BRIEF VITAE

Vérifier que le split est bien :
- **50% pool users** (BRIEF VITAE §20.2)
- **10% Association PURAMA**
- **40% SASU PURAMA**

Le BRIEF KOSHA précise par ailleurs :
- 70% projet (cagnotte) / 15% contributeurs / 5% sécurité / 10% fonds commun (dont 5% asso)

> ⚠️ **Conflit potentiel à arbitrer avec Tissma** : le split BRIEF VITAE (50/10/40) vs split BRIEF KOSHA (70/15/5/10). Demander confirmation avant prod.
