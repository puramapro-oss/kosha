# KOSHA — Apple Developer + App Store Connect + RevenueCat IAP (post-SASU)

> Pas-à-pas spécifique KOSHA. **Différent de SHANTI/MUKTI** : KOSHA utilise Apple StoreKit IAP via RevenueCat. Lire intégralement avant action.

## ① D-U-N-S Number (5-15 jours)

> Pré-requis Apple : SASU France a besoin d'un D-U-N-S Number (gratuit, Dun & Bradstreet).

URL : https://developer.apple.com/enrollment/duns-lookup/

1. Lookup "PURAMA" + adresse `8 Rue de la Chapelle, 25560 Frasne`.
2. Si pas trouvé → "Request a D-U-N-S Number" → form D&B France + KBIS PDF.
3. Délai : 5-9 jours ouvrés.
4. Recevoir D-U-N-S 9 chiffres par email → noter dans `.env.secrets`.

> ⚠️ Si D-U-N-S déjà créé pour SHANTI/MUKTI/etc., **réutiliser** — un seul D-U-N-S par entité légale.

```env
APPLE_DUNS=999999999
```

## ② Apple Developer Program enrollment

URL : https://developer.apple.com/programs/enroll/

> Si déjà enrollé pour SHANTI/MUKTI → **passer directement à ③**. Le compte Apple Dev SASU couvre toutes les apps Purama.

| Champ | Valeur |
|---|---|
| Entity Type | **Organization** |
| Legal Entity Name | `PURAMA` (exact match KBIS) |
| D-U-N-S | (étape ①) |
| Address | `8 Rue de la Chapelle, 25560 Frasne, France` |
| Phone | ligne pro SASU |
| Website | `https://purama.dev` |
| Role | Tissma = "Senior Manager" |
| Payment | 99 €/an, carte SASU |

**Output** : Apple Team ID (10 chars).

```env
APPLE_TEAM_ID=ABC123XYZ4
```

## ③ Bundle ID + Capabilities

Apple Developer → **Identifiers** → **+** → App IDs → App.

| Champ | Valeur |
|---|---|
| Description | `KOSHA iOS` |
| Bundle ID | Explicit `dev.purama.kosha` |
| Capabilities | ☑ Push Notifications, ☑ Associated Domains, ☑ Sign in with Apple, ☑ **In-App Purchase** |

> ⚠️ **In-App Purchase capability obligatoire** pour KOSHA (≠ SHANTI/MUKTI).

## ④ Création de l'app dans App Store Connect

URL : https://appstoreconnect.apple.com/apps → **+** → **New App**

| Champ | Valeur |
|---|---|
| Platforms | iOS |
| Name | `Kosha — Réseau positif` (≤ 30 chars) |
| Primary Language | French |
| Bundle ID | `dev.purama.kosha` |
| SKU | `kosha-ios-2026` |

## ⑤ App Information

| Champ | Valeur |
|---|---|
| Subtitle (FR) | `Communauté · Cagnotte · IA Aria` (≤ 30 chars) |
| Privacy Policy URL | `https://kosha.purama.dev/legal/confidentialite` |
| Category Primary | **Lifestyle** |
| Category Secondary | **Social Networking** |
| Content Rights | ☑ Yes — original + UGC modéré |

> ⚠️ **PAS Health & Fitness** (≠ SHANTI/MUKTI). KOSHA est un réseau social avec composante financière, pas un app santé.

## ⑥ Pricing & Availability

| Champ | Valeur |
|---|---|
| Price | **Free** (l'app est gratuite, l'abonnement = IAP) |
| Availability | All countries (option : exclure Russia, Belarus) |
| App Distribution Methods | App Store + TestFlight |

## ⑦ In-App Purchases (configuration)

URL : App Store Connect → KOSHA → **In-App Purchases** → **+**

> 2 produits IAP à créer :

### IAP 1 — Abonnement standard
| Champ | Valeur |
|---|---|
| Type | **Auto-Renewable Subscription** |
| Reference Name | `KOSHA Standard Monthly` |
| Product ID | `dev.purama.kosha.standard.monthly` |
| Subscription Group | `kosha_main` (créer si absent) |
| Subscription Duration | 1 month |
| Price | **9,99 €** (Tier 10 ou équivalent EUR) |
| Free trial | **14 days** (configuré dans le subscription group) |
| Cleared for Sale | ☑ |
| Localizations | FR + EN min |

### IAP 2 — Abonnement winback (anti-churn)
| Champ | Valeur |
|---|---|
| Type | **Auto-Renewable Subscription** |
| Reference Name | `KOSHA Winback Lifetime` |
| Product ID | `dev.purama.kosha.winback.monthly` |
| Subscription Group | `kosha_main` (même groupe — switching autorisé) |
| Duration | 1 month |
| Price | **4,99 €** |
| Eligibility | Offer Code → uniquement servi via RevenueCat à users churned (cf §⑨) |

> Apple permet 2 IAP dans le même group. Switching automatique géré par RevenueCat.

## ⑧ App-Specific Password (pour CI fastlane)

URL : https://account.apple.com → Security → App-Specific Passwords → Generate.
Label : "fastlane KOSHA". Format `xxxx-xxxx-xxxx-xxxx`.

```env
APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

## ⑨ RevenueCat — IAP unifié cross-platform

> **Pourquoi RevenueCat** : un seul backend pour gérer Apple StoreKit + Google Play Billing + Stripe entitlements. Webhook unifié vers Supabase.

### Configuration

URL : https://app.revenuecat.com → **Create Project** → name `KOSHA`.

1. **Apps** → **Add App** → iOS :
   - Bundle ID : `dev.purama.kosha`
   - App Store Connect API Key : (créer si absent — § ⑩)
   - Shared Secret IAP (App Store Connect → KOSHA → App Information → App-Specific Shared Secret)
2. **Apps** → **Add App** → Android (cf `GOOGLE_PLAY_SETUP.md` § RevenueCat).
3. **Products** → ajouter :
   - `dev.purama.kosha.standard.monthly` → linked Apple + Google
   - `dev.purama.kosha.winback.monthly` → linked Apple + Google
4. **Entitlements** → créer :
   - `kosha_premium` → attaché aux deux products
5. **Offerings** → créer :
   - `default` → standard product
   - `winback` → winback product (servi uniquement à churned users)

### Webhook RevenueCat → Supabase

URL : RevenueCat → Project → **Integrations** → **Webhooks** → Add.

```
URL : https://kosha.purama.dev/api/revenuecat/webhook
Events : INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION,
         BILLING_ISSUE, PRODUCT_CHANGE, TRANSFER, NON_RENEWING_PURCHASE
Auth header : Bearer ${REVENUECAT_WEBHOOK_SECRET}
```

```env
REVENUECAT_API_KEY_PUBLIC_IOS=appl_...   # côté client iOS
REVENUECAT_API_KEY_PUBLIC_ANDROID=goog_... # côté client Android
REVENUECAT_API_KEY_SECRET=sk_...          # côté serveur (webhook validation)
REVENUECAT_WEBHOOK_SECRET=whsec_...
```

> Tous via Vercel CLI (cf §37 CLAUDE.md) :
> ```bash
> printf "appl_xxx\n" | vercel env add NEXT_PUBLIC_REVENUECAT_API_KEY_IOS production --token $VERCEL_TOKEN
> ```

## ⑩ App Store Connect API Key

URL : https://appstoreconnect.apple.com/access/api

1. **Generate API Key** → role **App Manager**.
2. Download `AuthKey_XXXXXX.p8` (UNE SEULE fois).
3. Noter Key ID + Issuer ID.
4. Lier dans RevenueCat (cf ⑨).

```env
APPLE_KEY_ID=XXXXXXXXXX
APPLE_ISSUER_ID=69a6de70-xxxx-xxxx-xxxx-xxxxxxxxxxxx
APPLE_PRIVATE_KEY_BASE64=$(base64 < AuthKey_XXXXXX.p8)
```

## ⑪ App Review Information — bloc Notes critique KOSHA

```
DEMO ACCOUNT
Email: demo@purama.dev
Password: KOSHA-demo-{YYYYMMDD}-{4lettres}
This account has full Premium subscription (via RevenueCat sandbox
entitlement) for review purposes.

WHAT IS KOSHA
KOSHA is an ULTRA-POSITIVE social network with a community
redistribution mechanism. Users:
1. Connect with friends, family, and community in private/public
   "Cercles de Vie" (life circles).
2. Share progress, gratitude, mutual aid posts (NEVER toxic content).
3. Earn rewards through positive actions, missions, and community
   contributions (Score d'Humanité — based on reliability, mutual
   aid, regularity, real impact — NOT money).
4. Optionally receive cash redistributions via SEPA (operated by
   Treezor, EME ACPR licensed under PSD2).
5. Interact with Aria, an AI agent that helps complete actions and
   adapts to the user's cognitive style.

KEY DIFFERENTIATORS (NO TOXIC PATTERNS)
- NO public likes
- NO public follower counts
- NO algorithmic engagement-maximization feed
- NO comparison/ranking that humiliates
- AI-moderated comments (Claude Haiku 4.5) in real-time
- "Mode Silence" — app intelligently knows when not to notify
- All UGC moderated against hate speech, harassment, harmful
  health advice, fake news, product placement

MONETIZATION (Apple-compliant)
- App is FREE on App Store.
- Premium subscription (9,99 €/month) sold via Apple StoreKit
  In-App Purchase, managed by RevenueCat for cross-platform
  entitlement consistency.
- 14-day free trial (full features).
- Anti-churn winback offer (4,99 €/month for 12 months) presented
  to users who cancel — NOT an external link, NOT a Stripe checkout
  on iOS. The winback is a separate IAP in the same subscription
  group, switching managed by Apple.
- Web subscriptions go through Stripe (only on the web, never
  exposed in iOS app UI).

REDISTRIBUTION MECHANISM (legally compliant via Treezor)
- 50% of monthly subscription revenue is redistributed to active
  users based on Score d'Humanité (positive actions, mutual aid).
- Redistribution is operated EXCLUSIVELY by Treezor, an EME
  (Établissement de Monnaie Électronique) licensed by Banque de
  France / SocGen under EU PSD2 directive.
- KOSHA / PURAMA SASU does NOT hold user funds — Treezor does,
  under official electronic money institution status.
- KYC mandatory for any cash withdrawal above 1000€ (Treezor
  enforced).
- AML/KYC policy: https://kosha.purama.dev/legal/aml-kyc

DATA PROTECTION
- Hosted in EU (Vercel Frankfurt + Supabase EU + Treezor France).
- GDPR-native: full export (art. 20) and deletion (art. 17) at
  /profile/privacy/{export,delete}.
- DPO: dpo@purama.dev (ITGS Conseil).
- We do NOT use IDFA, do NOT have advertising SDKs, do NOT sell
  or share data with third parties.

USER-GENERATED CONTENT MODERATION (cf MODERATION_STRATEGY.md)
- All posts moderated in real-time by Claude Haiku 4.5.
- Zero tolerance for: hate speech, harassment, harmful health
  advice, self-harm content, fake news, product placement, scam.
- Flag-and-block button on every post.
- 24h auto-block on accounts with 3+ flags.
- Human moderator (Tissma) reviews flagged content within 24h.
- "Anti-Arnaque natif" : payment routes flagged automatically by
  AI before any cash transaction is finalized.

SAFETY NET
- In case of distress: app surfaces 3114 (FR suicide prevention),
  15 (FR SAMU), 112 (EU emergencies). Permanent disclaimer banner.

CONTACT
Matiss Dornier (Founder)
Email: dev@purama.dev
Phone: (set after SASU)
Available: 9-19 Paris time, M-F.
```

## ⑫ Age Rating

| Question | Réponse |
|---|---|
| User-generated content | **Yes — moderated AI + human** |
| Unrestricted Web Access | **No** |
| Mature/Suggestive Themes | **None** |
| Profanity | **None** (modération zéro tolérance) |
| Drug Use References | **None** |
| Gambling | **None** (cagnotte ≠ gambling — pas de hasard, pas de loterie payante) |
| Real-money gambling | **None** |
| Health/Treatment Information | **None** |
| Personal Information collected | **Yes** |

**Résultat attendu** : `12+` à cause UGC. Acceptable.

## ⑬ App Privacy form

| Catégorie | Collected | Linked | Tracking |
|---|---|---|---|
| Email Address | ✅ | ✅ | ❌ |
| Name | ✅ (Optional dans profil) | ✅ | ❌ |
| Phone Number | ⚠️ Optional (si KYC Treezor au-delà 1000€) | ✅ | ❌ |
| Physical Address | ⚠️ Optional (si KYC Treezor) | ✅ | ❌ |
| Payment Info | ⚠️ Treezor side, KOSHA n'y touche pas | (côté Treezor) | ❌ |
| User ID | ✅ | ✅ | ❌ |
| Other Financial Info (cagnotte balance) | ✅ | ✅ | ❌ |
| Other User Content (posts) | ✅ | ✅ | ❌ |
| Customer Support | ✅ | ✅ | ❌ |
| Crash Logs | ✅ Sentry | ❌ | ❌ |
| Product Interaction | ✅ PostHog EU | ✅ | ❌ |

**Tracking : aucun** (pas d'IDFA, pas de cross-app tracking, pas d'ads SDK). Pas de dialogue ATT requis.

> Privacy Policy URL : `https://kosha.purama.dev/legal/confidentialite` — DOIT lister ces catégories au mot près.

## ⑭ Submission flow

1. Build .ipa via fastlane (cf `MOBILE_FRAMEWORK_DECISION.md` — Expo + EAS).
2. Upload TestFlight via `eas submit -p ios` ou `fastlane`.
3. Test interne avec compte démo : valider IAP sandbox via RevenueCat.
4. Submit Build → Version 1.0 → cocher build → **Submit for Review**.
5. Status : Waiting → In Review → Approved/Rejected.

## ⑮ Anti-rejet patterns KOSHA

### Guideline 4.0 (Minimum Functionality)
**Risque** : Apple peut refuser un "social network with monetization" si features minimales.
**Anticipation** : démontrer push notifications natives, haptics sur micro-interactions, partage iOS, etc.

### Guideline 1.1 (Objectionable Content / UGC)
**Risque KOSHA élevé** car UGC + redistribution cash = mix sensible.
**Anticipation** : mention explicite modération AI temps réel + flag/block + 24h block + human review. Démontrer que l'app a des **safeguards proactifs**, pas réactifs.

### Guideline 5.1.1 (Privacy / Data Collection)
**Risque** : si l'app collecte des données financières (KYC) sans consentement explicite.
**Anticipation** : popup consentement avant chaque KYC step + transparence totale + lien Privacy Policy.

### Guideline 3.1.1 (In-App Purchase)
**Anticipation** : montrer que tous les abonnements iOS passent par StoreKit IAP via RevenueCat. Web Stripe n'est JAMAIS exposé dans l'app iOS.

### Guideline 3.1.5 (Cryptocurrencies / Money)
**Risque KOSHA modéré** car cagnotte + redistribution.
**Anticipation** : mention Treezor EME ACPR explicite + KOSHA ne tient PAS les fonds + uniquement EUR (pas crypto). Treezor est licensed sous PSD2 EU.

### Guideline 5.6 (Code of Conduct)
**Anticipation** : moderation policy publique sur `kosha.purama.dev/legal/moderation` + community guidelines visibles dans l'app.

## ⑯ Universal Links

`public/.well-known/apple-app-site-association` :

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "ABC123XYZ4.dev.purama.kosha",
        "paths": ["/i/*", "/cercle/*", "/cagnotte/*", "/auth/callback", "/profile/*"]
      }
    ]
  }
}
```

## Checklist finale avant Submit

- [ ] Demo account testé : signup → connect → premium IAP via RevenueCat sandbox → 200.
- [ ] AML/KYC policy publiée sur `kosha.purama.dev/legal/aml-kyc`.
- [ ] Moderation policy publiée sur `kosha.purama.dev/legal/moderation`.
- [ ] Disclaimer 3114/112 visible.
- [ ] Bouton "S'abonner — 9,99€/mois" présent (OK car IAP natif).
- [ ] RevenueCat webhook fonctionnel (test purchase sandbox → row insert dans `subscriptions`).
- [ ] Sign in with Apple capability activée.
- [ ] Build TestFlight stable 30 min.
- [ ] App Privacy form rempli + matche Privacy Policy.
- [ ] Privacy Policy retourne 200 + RGPD-compliant.
- [ ] Universal Links validés (`curl -sI .well-known/apple-app-site-association`).

## Smoke post-approval

```bash
curl -sI "https://apps.apple.com/fr/app/kosha-reseau-positif/id<ID>" | head -1
# 200
```
