# KOSHA — Google Play Console + Google Play Billing (post-SASU)

> Pas-à-pas spécifique KOSHA. **Différent de SHANTI/MUKTI** : KOSHA utilise Google Play Billing (via RevenueCat), pas Stripe externe.

## ① Google Play Console enrollment

URL : https://play.google.com/console/signup

> Si déjà enrollé pour SHANTI/MUKTI/etc. → **passer directement à ②**.

| Champ | Valeur |
|---|---|
| Account type | **Organization** |
| Organization name | `PURAMA` (exact match KBIS) |
| Address | `8 Rue de la Chapelle, 25560 Frasne, France` |
| D-U-N-S | (le même que pour Apple) |
| Phone | ligne pro SASU |
| Website | `https://purama.dev` |
| Email | `dev@purama.dev` |
| Payment | 25 $ une fois |

## ② Service Account (pour fastlane / RevenueCat)

URL : https://console.cloud.google.com → IAM & Admin → Service Accounts → Create.

1. Name : `kosha-fastlane`.
2. Role : `Service Account User`.
3. Create key → JSON → download `kosha-fastlane-key.json`.

URL : Google Play Console → Setup → API access → Link → choisir `kosha-fastlane`.

4. Permissions : `Release apps to testing tracks` + `Manage store presence` + **`Manage orders and subscriptions`** (critique pour RevenueCat).
5. Save.

> **Important** : `Manage orders and subscriptions` est requis pour que RevenueCat puisse valider les achats Google Play Billing en serveur.

```env
GOOGLE_PLAY_JSON_KEY_BASE64=$(base64 < kosha-fastlane-key.json)
```

## ③ Upload Keystore Android

```bash
keytool -genkey -v -keystore kosha-upload.keystore \
  -alias kosha-upload -keyalg RSA -keysize 2048 -validity 25000 \
  -dname "CN=PURAMA, O=PURAMA, L=Frasne, S=Doubs, C=FR"
```

Stocker base64 dans GitHub secrets + `~/Documents/Purama-secrets/`.

## ④ Création de l'app

URL : Google Play Console → **Create app**.

| Champ | Valeur |
|---|---|
| App name | `Kosha — Réseau positif` |
| Default language | French (France) |
| App or game | App |
| Free or paid | **Free** |

## ⑤ App content checklist

| Section | Réponse KOSHA |
|---|---|
| Privacy Policy URL | `https://kosha.purama.dev/legal/confidentialite` |
| App access | Yes, sign-in required → comments avec demo account |
| Ads | **No, my app does not contain ads** |
| Content rating | IARC questionnaire (cf §⑥) |
| Target audience | **18+** (cagnotte cash + KYC Treezor) |
| News app | No |
| COVID-19 | No |
| Data safety | cf §⑦ |
| Government apps | No |
| **Financial features** | **YES** — money management (cagnotte) → cf §⑧ |
| Health apps | No |

## ⑥ IARC Content Rating

| Question | Réponse KOSHA |
|---|---|
| Email IARC | `dev@purama.dev` |
| Category | **Reference, News, Educational** |
| Violence | None |
| Self-harm depicted | None (clinical references via 3114/112 protective only) |
| Sexual content | None |
| Profanity | None |
| Drugs/alcohol | None |
| Gambling | **None** (cagnotte ≠ gambling — pas de hasard) |
| Simulated gambling | None |
| User interaction | **Yes — moderated text + voice (Cercles)** |
| Voice/video chat | **Yes** (Cercles audio LiveKit) |
| Digital purchases | **Yes — via Google Play Billing** |
| Personal information | **Yes — collected, KYC Treezor for cash withdrawals > 1000€** |

**Résultat attendu** : `Teen` ESRB / `PEGI 12-16` (UGC + KYC).

## ⑦ Data Safety form

| Type | Collected | Shared | Purpose | Optional |
|---|---|---|---|---|
| Email | ✅ | ❌ | App functionality | Required |
| Name | ✅ | ❌ | App functionality | Optional |
| Phone | ⚠️ KYC Treezor si retrait > 1000€ | ❌ (Treezor processor) | Account | Conditional |
| Physical address | ⚠️ KYC Treezor | ❌ (Treezor processor) | Account | Conditional |
| User payment info | ❌ (Google Play Billing handle) | ❌ | — | — |
| Purchase history | ✅ (RevenueCat link) | ❌ | App functionality | Required |
| User IDs (Supabase UUID) | ✅ | ❌ | App functionality | Required |
| Other financial info (cagnotte balance) | ✅ | ❌ | App functionality | Required |
| Photos/Videos | ⚠️ avatar optionnel | ❌ | App functionality | Optional |
| Voice recordings | ❌ (Cercles live, not stored) | — | — | — |
| Other in-app messages (posts, comments) | ✅ | ❌ | App functionality | Optional |
| Device IDs (FCM token) | ✅ | ❌ | App functionality (push) | Optional |
| Crash logs | ✅ Sentry | ❌ | Diagnostics | Required |
| App interactions | ✅ PostHog EU | ❌ | Analytics | Optional (consent) |

**Sécurité** :
- ☑ Encrypted in transit (TLS 1.3 + HSTS)
- ☑ Data deletion (`/profile/privacy/delete`)
- ☑ Data export (`/profile/privacy/export`)
- ☐ Families Policy (audience 18+)
- ☑ Independently validated (Treezor EME ACPR PSD2)

## ⑧ Financial Features declarations

URL : **App content** → **Financial features**.

| Champ | Valeur |
|---|---|
| Does your app provide financial services? | **Yes** |
| Type | "Money management / community redistribution via licensed EME" |
| License | "Treezor SAS, EME licensed by ACPR (Banque de France) under EU PSD2" |
| License number | (à fournir — Treezor onboarding result) |
| Country | France |
| Operator name | "Treezor SAS" |
| KYC | "Yes — KYC mandatory above 1000€ withdrawal threshold, processed by Treezor" |

> **Critique** : Google scrute strictement les apps financial-related. La mention explicite "operated by Treezor (EME ACPR)" est ce qui débloque l'approval. KOSHA = service utilisateur, Treezor = opérateur financier régulé. Bien distinguer.

## ⑨ Google Play Billing — IAP setup

URL : Google Play Console → KOSHA → **Monetize** → **Products** → **Subscriptions**.

### Subscription 1 — Standard
| Champ | Valeur |
|---|---|
| Product ID | `dev.purama.kosha.standard.monthly` |
| Name | `Kosha Standard` |
| Description | Premium access — community, redistribution, AI Aria |
| Base plan ID | `monthly-auto` |
| Price | 9,99 €/month |
| Billing period | 1 month |
| Free trial | 14 days |
| Grace period | 7 days |
| Account hold | Yes |
| Auto-renew | Yes |

### Subscription 2 — Winback (anti-churn)
| Champ | Valeur |
|---|---|
| Product ID | `dev.purama.kosha.winback.monthly` |
| Name | `Kosha Winback` |
| Description | Lifetime 50% offer for returning members |
| Base plan ID | `monthly-winback` |
| Price | 4,99 €/month |
| Eligibility | Existing churned users (filtered via RevenueCat offer) |

> Google Play accepte 2 subscriptions séparées. RevenueCat gère l'éligibilité winback (offer code servi côté serveur).

## ⑩ RevenueCat Android setup

> Voir aussi `APPLE_DEVELOPER_SETUP.md` § ⑨ pour iOS.

URL : https://app.revenuecat.com/projects/<KOSHA>/apps → **Add Android App**.

1. Package name : `dev.purama.kosha`.
2. Service Account JSON : upload `kosha-fastlane-key.json` (étape ②).
3. Lier les 2 products Android créés à l'étape ⑨.
4. Vérifier que les products apparaissent dans RevenueCat Dashboard → Products.

**Webhook unifié** : déjà configuré côté `APPLE_DEVELOPER_SETUP.md` § ⑨ (un seul webhook RevenueCat → Supabase couvre iOS + Android + web).

## ⑪ Comments (notes pour reviewers Google)

> **À copier-coller dans Console → App content → App access → Comments**

```
DEMO ACCOUNT
Email: demo@purama.dev
Password: KOSHA-demo-{YYYYMMDD}-{4lettres}
Premium subscription active via RevenueCat sandbox entitlement.

ABOUT KOSHA
KOSHA is an ULTRA-POSITIVE social network with a community
redistribution mechanism. Users connect, share gratitude, mutual
aid, and earn rewards (Score d'Humanité — non-monetary social
score) AND optionally cash redistributions via SEPA (operated by
Treezor, an EME licensed by ACPR/Banque de France under EU PSD2).

KEY DIFFERENTIATORS (anti-toxic patterns)
- NO public likes / NO follower counts
- NO algorithmic engagement-maximization
- AI-moderated UGC in real-time (Claude Haiku 4.5)
- "Mode Silence" intelligent notification gate
- Zero tolerance for hate, harassment, scam, fake news, harmful
  health advice, product placement

ARCHITECTURE
- Native React Native via Expo + EAS Build.
- Supabase EU (auth, DB).
- Treezor France (EME ACPR) for cash flows — KOSHA / PURAMA SASU
  does NOT hold user funds. Treezor does, under EU electronic
  money institution license.
- RevenueCat for subscription entitlements (Apple + Google + Stripe
  unified).

MONETIZATION (Google-compliant)
- App is free.
- Premium subscription 9.99 €/month via Google Play Billing
  (mandatory for in-app digital subscriptions).
- 14-day free trial.
- Anti-churn winback offer 4.99 €/month for cancelled users
  (separate Play Billing product, served via RevenueCat).
- Web subscriptions handled separately via Stripe (never exposed
  in mobile app).

REDISTRIBUTION (legally compliant)
- 50% of monthly subscription revenue redistributed to active
  users based on Score d'Humanité.
- Operated by Treezor SAS — licensed EME (Établissement de Monnaie
  Électronique) by ACPR (French Prudential Regulation Authority,
  Banque de France) under EU PSD2 directive.
- KYC mandatory for any cash withdrawal > 1000€ (Treezor enforced).
- Anti-money-laundering policy: https://kosha.purama.dev/legal/aml-kyc

USER-GENERATED CONTENT MODERATION
- AI moderation real-time (Claude Haiku 4.5).
- Flag-and-block on every post.
- 24h auto-block on accounts with 3+ flags.
- Human review by Tissma within 24h.
- Anti-scam: AI flags suspicious payment routes before any cash
  transaction is finalized.

PERMISSIONS RATIONALE
- Push notifications: scheduled missions, mutual aid alerts,
  withdrawal status. User can disable any time.
- Camera: profile avatar (optional). No facial recognition.
- Microphone: live audio in Cercles de Vie (LiveKit, not stored,
  not transmitted outside the live session).
- (No background location, no contacts, no SMS access.)

CONTACT
Matiss Dornier (Founder)
dev@purama.dev
9-19 Paris time, M-F.
```

## ⑫ App Links (.well-known/assetlinks.json)

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "dev.purama.kosha",
      "sha256_cert_fingerprints": [
        "<SHA-256 upload key>",
        "<SHA-256 Google Play app signing key>"
      ]
    }
  }
]
```

## ⑬ Pricing & Distribution

| Champ | Valeur |
|---|---|
| Price | **Free** |
| Countries | All available (option : exclure Russia, Belarus) |
| Contains ads | **No** |
| In-app purchases | **YES — Google Play Billing** |
| Content guidelines | ☑ Compliant |

## ⑭ Stratégie testing tracks

```
Internal testing (Tissma + 2-3 amis)               [Day 1]
    ↓
Closed testing (20-50 ambassadeurs)                [Day 7]
    ↓
Open testing (PUBLIC opt-in)                       [Day 14]
    → Strategy KOSHA spécifique : open testing utile
      car Score d'Humanité requiert volume initial
      pour validation algo redistribution.
    ↓
Production (staged 20% → 50% → 100%)              [Day 28]
```

> KOSHA bénéficie d'une **Open testing phase** publique (≠ SHANTI/MUKTI). Permet de calibrer Score d'Humanité + flux redistribution Treezor avec un cohort de 100-1000 users avant production.

## ⑮ Pre-launch report

Google scanne automatiquement chaque .aab. **Critique pour KOSHA** :
- **Stability** : crashes natifs (RevenueCat SDK, LiveKit SDK).
- **Accessibility** : KOSHA cible "Universalité radicale" — Pre-launch report TalkBack doit être propre.
- **Security** : OWASP Mobile Top 10. **CRITIQUE pour app financial-related**.

## ⑯ Common rejections anticipated

### "Financial app without proper licensing"
**Risque KOSHA très élevé**.
**Anticipation** : preuve Treezor EME ACPR + lien dashboard public Treezor + AML/KYC policy. Insister "KOSHA = user-facing service, Treezor = licensed financial operator".

### "User-generated content not moderated"
**Anticipation** : démonstration vidéo modération AI temps réel + policy publique.

### "Subscription terms not clear"
**Anticipation** : 14-day trial clairement annoncé + auto-renew + cancel anytime + URL CGV vers `kosha.purama.dev/legal/cgv`.

### "Misleading claims about earnings"
**Risque KOSHA modéré** — l'app promet "gagner de l'argent en agissant".
**Anticipation** : disclaimer explicite "Earnings depend on Score d'Humanité, no guarantee. Score is calculated based on positive actions and community contribution. Cash redistribution is funded by 50% of subscription revenue, distributed proportionally."

## Checklist finale

- [ ] Internal testing : 7+ jours sans crash > 1%.
- [ ] Closed testing : 20+ testeurs actifs, 0 plainte modération non-traitée.
- [ ] Open testing (optional) : 100-1000 users, validation Score d'Humanité.
- [ ] Pre-launch report : 0 critique.
- [ ] Data Safety form complet + cohérent Privacy Policy.
- [ ] Financial features declared avec Treezor info.
- [ ] IARC self-rated, certificate received.
- [ ] Treezor EME ACPR onboarding actif (cf STRIPE_TREEZOR_LIVE_CHECKLIST).
- [ ] RevenueCat webhook fonctionnel.
- [ ] AML/KYC policy publiée.
- [ ] Moderation policy publiée.
- [ ] App Links validés.

## Smoke post-publication

```bash
curl -sI "https://play.google.com/store/apps/details?id=dev.purama.kosha" | head -1
# 200
```
