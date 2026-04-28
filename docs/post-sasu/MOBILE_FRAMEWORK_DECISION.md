# KOSHA — Mobile Framework Decision

> Décision **DÉJÀ ACTÉE par le BRIEF KOSHA** : **Expo (React Native natif) + EAS Build**.
>
> Document d'autorité : `BRIEF.md` ligne 6 — *"Stack : Next.js 15 App Router / React 19 / TypeScript / Tailwind / Supabase self-hosted / Stripe + Treezor (EME ACPR) / RevenueCat (iOS/Android) / Vercel / Expo"*.

## Pourquoi Expo (et pas Capacitor)

KOSHA a 4 raisons techniques de choisir Expo plutôt que Capacitor :

### 1. RevenueCat IAP nativif

`react-native-purchases` est le SDK officiel RevenueCat — pleinement compatible Expo via `expo install react-native-purchases`. Capacitor a un plugin community mais moins maintenu, moins de features (offerings dynamiques, customer info, deferred purchases, etc.).

### 2. LiveKit React Native SDK (Cercles audio)

`@livekit/react-native` est une lib natif React Native, perfs vidéo/audio supérieures à WebView. Cercles audio = use-case sensible où latence < 100ms importe.

### 3. UI native premium (BRIEF §9bis multisensoriel)

Le brief impose "WebGL textuel, shaders custom, particules volumétriques, glitch/scramble, aberration chromatique". Expo + `expo-gl` + `expo-three` + `react-native-skia` = perfs natif premium. WebView Capacitor a des limitations sur les shaders custom (notamment iOS).

### 4. Cohérence avec écosystème non-wellness Purama

Per CLAUDE.md §16 : default Purama = Expo. Capacitor est une **exception** SHANTI/MUKTI/NIDRA (apps wellness où live WebView fait sens pour MAJ continues). KOSHA = social + financial = use-case Expo natif standard.

## Trade-offs assumés

### Coûts vs Capacitor

| Aspect | Coût Expo natif |
|---|---|
| Code dédupliqué web ↔ mobile | ~60-70% réécrit (vs 5% en Capacitor live WebView) |
| Build CI | EAS Build = 30-45 min (vs 15-25 min Capacitor) |
| Coûts EAS | 99 $/mois (Production tier) ou pay-as-you-go |
| MAJ store | Re-soumission Apple (1-3j) + Google (1-2j) (vs MAJ instantanées Capacitor) |
| Onboarding dev | 2-3 semaines pour devenir productif (vs 1 semaine Capacitor) |

### Atouts vs Capacitor

| Aspect | Bénéfice Expo natif |
|---|---|
| Performance UI | 60fps stable même sur shaders custom |
| RevenueCat | SDK officiel, customer journey complet |
| LiveKit audio | Latence ~80ms vs ~150ms WebView |
| Permissions | Granularité native iOS (ATT, FamilyControls, etc.) |
| App Store review | Apple plus indulgent (≠ Capacitor "WebView wrapper" risque GL 4.0) |
| Apple Reviewer impression | "Real native app" — facilite reviews health/financial-related |

## Stack mobile complète KOSHA

```
Expo SDK 52
├── expo-router (navigation file-based)
├── nativewind (Tailwind CSS pour RN)
├── react-native-reanimated 3 (anim native fluide)
├── zustand (state management)
├── @supabase/supabase-js + react-native-url-polyfill/auto
├── expo-secure-store (JWT persistance)
├── react-native-purchases (RevenueCat IAP)
├── @livekit/react-native (Cercles audio/vidéo)
├── @livekit/react-native-webrtc
├── expo-camera (avatar)
├── expo-haptics (micro-interactions)
├── expo-linear-gradient
├── expo-blur (glass effects)
├── expo-gl + expo-three (BRIEF §9bis multisensoriel)
├── react-native-skia (animations 2D haute perf)
├── expo-notifications (push FCM + APNS)
└── @sentry/react-native
```

## Bundle ID et configuration

| Champ | Valeur |
|---|---|
| iOS bundle | `dev.purama.kosha` |
| Android package | `dev.purama.kosha` |
| App name | `Kosha` (display) |
| Scheme | `kosha://` |
| Universal Links | `https://kosha.purama.dev/...` |

## Auth Supabase mobile (CRITIQUE)

> Sans cette config = CRASH au login. Voir CLAUDE.md §16 mobile auth.

```ts
// src/lib/supabase.ts
import "react-native-url-polyfill/auto";
import * as SecureStore from "expo-secure-store";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const adapter = {
  getItem: async (k: string) =>
    Platform.OS === "web" ? localStorage.getItem(k) : await SecureStore.getItemAsync(k),
  setItem: async (k: string, v: string) => {
    Platform.OS === "web" ? localStorage.setItem(k, v) : await SecureStore.setItemAsync(k, v);
  },
  removeItem: async (k: string) => {
    Platform.OS === "web" ? localStorage.removeItem(k) : await SecureStore.deleteItemAsync(k);
  },
};

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: adapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === "web",
    },
  },
);
```

> ❌ NE JAMAIS utiliser `localStorage` / `window` / `document` directement → crash iOS.
> ✅ Toujours guard avec `Platform.OS === "web"`.

## Pipeline EAS Build

`eas.json` (à créer dans projet mobile) :

```json
{
  "cli": { "version": ">=12.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": true }
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview"
    },
    "production": {
      "channel": "production",
      "autoIncrement": true,
      "ios": {
        "bundleIdentifier": "dev.purama.kosha"
      },
      "android": {
        "applicationId": "dev.purama.kosha"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "matiss.frasne@gmail.com",
        "ascAppId": "<APPLE_NUMERIC_ID>",
        "appleTeamId": "<APPLE_TEAM_ID>"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

## Pipeline EAS

```bash
# 1. Initialize Expo project
cd /Users/matissdornier/purama/kosha
npx create-expo-app mobile --template blank-typescript
cd mobile

# 2. Install deps
npx expo install nativewind react-native-reanimated zustand \
  @supabase/supabase-js react-native-url-polyfill expo-secure-store \
  expo-haptics expo-linear-gradient expo-blur expo-gl expo-three \
  expo-camera expo-notifications react-native-purchases \
  @livekit/react-native @livekit/react-native-webrtc \
  @sentry/react-native @react-three/fiber @react-three/drei

# 3. Configure NativeWind
npx tailwindcss init

# 4. Configure expo-router
# (file-based routing, voir docs Expo Router)

# 5. EAS account
npx eas login   # use EXPO_TOKEN from .env.secrets
npx eas init

# 6. Build dev
npx eas build --platform ios --profile development
npx eas build --platform android --profile development

# 7. Build production
npx eas build --platform all --profile production

# 8. Submit
npx eas submit --platform ios --latest
npx eas submit --platform android --latest
```

## GitHub Actions workflow

`.github/workflows/mobile-release.yml` :

```yaml
name: KOSHA — Mobile release

on:
  workflow_dispatch:
    inputs:
      platform:
        type: choice
        options: [ios, android, all]
        default: all
      submit:
        type: boolean
        default: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install
        run: cd mobile && npm ci

      - name: Build
        run: cd mobile && eas build --platform ${{ inputs.platform }} --profile production --non-interactive

      - name: Submit
        if: ${{ inputs.submit }}
        run: cd mobile && eas submit --platform ${{ inputs.platform }} --latest --non-interactive
```

## Prochaines étapes

1. **Décision actée** : Expo (validé par BRIEF.md).
2. **Bootstrap projet mobile** : `cd /Users/matissdornier/purama/kosha && npx create-expo-app mobile`.
3. **Migration des écrans clés** : login → home → cercles → cagnotte → IA Aria → profil.
4. **Tests EAS dev → preview → production**.
5. **Submissions Apple + Google** via `eas submit`.

> Effort estimé : 4-6 semaines pour 1.0 mobile (comparé à 1-2 semaines Capacitor).

## Conditions de bascule retour Capacitor (ne devrait pas arriver)

Si Apple Reviewer rejette pour "WebView app pretending native" → impossible avec Expo, donc rejet improbable.
Si EAS Build coûts > 500 $/mois → migration Codemagic possible.
Si maintenance double codebase trop lourde → option "monorepo Turborepo" pour partager web ↔ mobile components React.
