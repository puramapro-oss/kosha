import type { CapacitorConfig } from "@capacitor/cli";

/**
 * KOSHA — Capacitor 7 config (P9)
 *
 * Stratégie : web wrapping. L'app web Next.js sert de binaire iOS/Android
 * via WebView avec haptics natifs. Bundle id: dev.purama.kosha.
 */

const config: CapacitorConfig = {
  appId: "dev.purama.kosha",
  appName: "KOSHA",
  webDir: "public", // dummy — server.url prend le dessus (wrapping web live, pas de build statique)
  server: {
    url: "https://kosha.purama.dev",
    androidScheme: "https",
    iosScheme: "https",
    cleartext: false,
    allowNavigation: ["kosha.purama.dev", "auth.purama.dev", "*.stripe.com"],
  },
  ios: {
    contentInset: "automatic",
    backgroundColor: "#0A0A0F",
    preferredContentMode: "mobile",
    scheme: "KOSHA",
    limitsNavigationsToAppBoundDomains: false,
  },
  android: {
    backgroundColor: "#0A0A0F",
    captureInput: true,
    webContentsDebuggingEnabled: false,
    allowMixedContent: false,
    overrideUserAgent: undefined,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0A0A0F",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#0A0A0F",
      overlaysWebView: true,
    },
    Haptics: {},
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    Preferences: {
      group: "dev.purama.kosha.prefs",
    },
  },
};

export default config;
