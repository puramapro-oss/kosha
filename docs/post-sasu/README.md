# KOSHA — Pack post-SASU (activation stores + Stripe live + Treezor + RevenueCat)

> Tout ce qu'il faut pour passer de "KOSHA prêt côté code" à "KOSHA live sur App Store + Google Play + redistribution SEPA Treezor + IAP RevenueCat", à exécuter dès que la SASU PURAMA est immatriculée et le contrat Treezor signé.

## Stack KOSHA — récap

| Couche | Tech |
|---|---|
| Web | Next.js 15 App Router, React 19, TS, Tailwind, Supabase self-hosted |
| Mobile | **Expo + EAS** (RN natif, pas Capacitor — voir `MOBILE_FRAMEWORK_DECISION.md`) |
| Paiement abo | **RevenueCat → Apple StoreKit + Google Play Billing** (IAP obligatoire) |
| Paiement web | Stripe (web-only abonnements) |
| Redistribution SEPA | **Treezor EME ACPR** (50% CA mensuel auto) |
| IA | **Aria** (Claude wrapper, jamais identifié comme Claude) |

## Stratégie IAP : DIFFÉRENT de SHANTI/MUKTI

> **IMPORTANT** : KOSHA utilise Apple StoreKit / Google Play Billing via RevenueCat. SHANTI et MUKTI font Stripe externe. **Ne pas confondre les playbooks.**

**Pourquoi** : KOSHA a besoin d'Apple Pay + Google Pay mandatory pour conformité Apple Guideline 3.1.1 (cf BRIEF KOSHA §8). Le BRIEF impose explicitement "Apple Pay + Google Pay mandatory pour abonnement (pas de bypass IAP)".

**Conséquences** :
- iOS : Apple prend 30% commission (15% si Small Business Program <1M$/an).
- Android : Google prend 15% commission (alt billing DMA EU possible mais on garde GPB pour cohérence).
- Web : Stripe direct (1.4% + 0.25 € EU).
- Côté code : RevenueCat unifie les 3 sources (`subscriptions.provider ∈ {apple, google, stripe}`).

## Ordre d'exécution post-SASU

1. **SASU immatriculée** → KBIS, RIB pro, art. 293B.
2. **Apple Developer Program** activé → cf. `APPLE_DEVELOPER_SETUP.md` (inclut RevenueCat IAP setup).
3. **Google Play Console** activée → cf. `GOOGLE_PLAY_SETUP.md` (inclut Google Play Billing setup).
4. **Stripe live mode** → cf. `STRIPE_TREEZOR_LIVE_CHECKLIST.md` (Stripe + Treezor onboarding combined).
5. **RevenueCat** : créer projet → cf. `APPLE_DEVELOPER_SETUP.md` § RevenueCat.
6. **Décision mobile framework** : Expo confirmé KOSHA-side (cf. `MOBILE_FRAMEWORK_DECISION.md`).
7. **Bootstrap mobile Expo** : voir progress.md de KOSHA pour le plan session mobile.

## Sommaire des fichiers

| Fichier | Contenu | Délai estimé |
|---|---|---|
| [`APPLE_DEVELOPER_SETUP.md`](./APPLE_DEVELOPER_SETUP.md) | Apple Dev + App Store Connect + IAP + RevenueCat | 1-2 sem (D-U-N-S) |
| [`GOOGLE_PLAY_SETUP.md`](./GOOGLE_PLAY_SETUP.md) | Play Console + Google Play Billing + Service Account | 24-48h |
| [`STRIPE_TREEZOR_LIVE_CHECKLIST.md`](./STRIPE_TREEZOR_LIVE_CHECKLIST.md) | Stripe live + Treezor EME ACPR onboarding | 2-8 semaines (Treezor lent) |
| [`MOBILE_FRAMEWORK_DECISION.md`](./MOBILE_FRAMEWORK_DECISION.md) | Pourquoi Expo natif (≠ Capacitor SHANTI/MUKTI) | Décidé déjà |
| [`MODERATION_STRATEGY.md`](./MODERATION_STRATEGY.md) | UGC anti-toxicité — critique pour approval Apple/Google | Avant submit |

## Identifiants KOSHA à connaître

| Champ | Valeur |
|---|---|
| Bundle ID iOS / Package Android | `dev.purama.kosha` (convention Purama) |
| Domain | `kosha.purama.dev` |
| App name | `Kosha — Réseau positif` |
| Category Apple | **Lifestyle** (primary) / **Social Networking** (secondary) |
| Category Google | **Lifestyle** |
| Default locale | French (France) |
| IA in-app name | **Aria** (jamais "Claude", jamais "Anthropic") |
| Demo account | À générer juste avant submit |
| Pricing | 9,99€/mois standard · 4,99€/mois à vie (anti-churn winback) |
| Trial | 14 jours full features |

## Différences clés KOSHA vs SHANTI/MUKTI

| Aspect | SHANTI/MUKTI | KOSHA |
|---|---|---|
| IAP | ❌ Stripe externe via Safari deep link | ✅ **Apple StoreKit + Google Play Billing** (mandatory) |
| Wrapper IAP | (n/a) | **RevenueCat** (cross-platform) |
| Redistribution SEPA | (n/a — pas de redistribution cash) | **Treezor EME ACPR** (50% CA mensuel auto) |
| Mobile framework | Capacitor 8 (live WebView) | **Expo** (natif RN, RevenueCat-friendly) |
| Bouton iOS texte | "Continuer" / "Activer" (neutre, anti GL 3.1.1) | "S'abonner — 9,99€/mois" (OK car IAP natif) |
| Catégorie | Health & Fitness | **Lifestyle / Social** |
| Apple Review nuance | "spiritual not medical" | "anti-toxic social network with redistribution" |
| KYC user retraits | (n/a) | **Treezor KYC obligatoire si retrait > 1000€** |

## Wording légal critique KOSHA

Pour les reviews Apple + Google, les notes doivent insister sur :

> *"KOSHA is an ultra-positive social network with a community redistribution mechanism. Users earn rewards (digital points + optional cash via SEPA) for positive actions, mutual aid, and community contribution. The redistribution flow is operated by Treezor (EME ACPR licensed by Banque de France/SocGen, regulated under EU PSD2). KOSHA itself does NOT hold user funds — Treezor does, under the official EU electronic money institution status. KYC is mandatory for any cash withdrawal above 1000€. Subscriptions are processed via Apple StoreKit (iOS) and Google Play Billing (Android), with RevenueCat as the unified entitlements layer. Web subscriptions go through Stripe."*

À reprendre quasi-mot-à-mot dans les notes Apple Review et Google Play Comments.

## Pré-requis documents avant Stripe + Treezor

| Document | Source | Usage |
|---|---|---|
| KBIS officiel | INPI | Apple, Google, Stripe, Treezor |
| RIB SASU | Banque pro | Stripe, Treezor |
| CNI Tissma | (officiel valide) | Stripe KYC, Treezor onboarding |
| Statuts SASU | (rédigés) | Treezor (audit légal) |
| AML/KYC policy doc | À rédiger en interne | Treezor onboarding |
| GCU/CGV avec mention "intermédiation financière via Treezor" | À ajouter sur kosha.purama.dev | Apple, Google review |

## Smoke post-go-live

```bash
# Apple
curl -sI "https://apps.apple.com/fr/app/kosha-reseau-positif/id<APPLE_ID>" | head -1

# Google
curl -sI "https://play.google.com/store/apps/details?id=dev.purama.kosha" | head -1

# Stripe live (compte actif)
curl -s -u "${STRIPE_SECRET_KEY}:" https://api.stripe.com/v1/account | grep '"livemode"'

# RevenueCat dashboard
curl -s -H "Authorization: Bearer $REVENUECAT_API_KEY" https://api.revenuecat.com/v2/projects | jq

# Treezor (sandbox vs prod)
curl -s -H "Authorization: Bearer $TREEZOR_API_KEY" https://m2.treezor.com/v1/users | jq '.users | length'
```
