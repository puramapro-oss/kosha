// KOSHA — Réseau social ultra-positif + Cagnotte révolutionnaire + IA Aria
// Sanskrit कोश = trésor / enveloppe de l'âme. Le KARMA de la générosité.

export const SUPER_ADMIN_EMAIL = 'matiss.frasne@gmail.com'

export const APP_NAME = 'KOSHA'
export const APP_SHORT_NAME = 'KOSHA'
export const APP_SLUG = 'kosha'
export const APP_DOMAIN = 'kosha.purama.dev'
export const APP_URL = 'https://kosha.purama.dev'
export const APP_SCHEMA = 'kosha'
export const AI_NAME = 'Aria'
export const BUNDLE_ID = 'dev.purama.kosha'

// Palette PURAMA standard (CLAUDE.md V7.2 §10 — couleurs cosmiques)
export const APP_COLOR = '#7C3AED'             // violet primaire — éveil, conscience
export const APP_COLOR_SECONDARY = '#06B6D4'   // cyan — clarté, eau, fluidité
export const APP_COLOR_TERTIARY = '#3B82F6'    // bleu — confiance, profondeur
export const APP_COLOR_AWAKENING = '#7C3AED'   // pulse éveil PURAMA
export const APP_BG = '#0A0A0F'                // fond cosmique

// Tagline & promesse (BRIEF §2 + §14)
export const APP_TAGLINE = "L'univers où agir = être payé"
export const APP_PROMISE = "En 60 secondes, je te montre comment ton existence quotidienne peut te rapporter de l'argent réel ET changer le monde."
export const APP_MANIFESTO = `Tu n'utilises pas une app.
Tu rejoins le seul endroit au monde où ton existence quotidienne te paie réellement,
où aider les autres te rapporte de l'argent, où ta vie laisse une trace mesurable.
Aucune pub. Aucune toxicité. Aucune comparaison.
Juste toi, et le monde, qui s'élèvent ensemble.`

// Société (CLAUDE.md V7.2 §17)
export const COMPANY_INFO = {
  name: 'SASU PURAMA',
  address: '8 Rue de la Chapelle, 25560 Frasne',
  country: 'France',
  taxNote: 'TVA non applicable, art. 293 B du CGI',
  dpo: 'matiss.frasne@gmail.com',
  association: 'Association PURAMA (loi 1901)',
  founder: 'Matiss Dornier',
  zoneFiscale: 'ZFRR — 0% IS pendant 5 ans',
}

// ──────────────────────────────────────────────────────────────────
// Plans BRIEF §4 — pricing KOSHA spécifique (différent du standard Purama)
// Mensuel 9.99€ (-10% M1 = 8.99€) | Annuel 71.93€ (-30% = 5.99€/mois équivalent)
// Anti-churn : abonnement à vie 4.99€/mois
// 2 semaines d'essai gratuit complet
// ──────────────────────────────────────────────────────────────────
export const PLANS = {
  free: {
    id: 'free' as const,
    label: 'Visiteur',
    price_monthly: 0,
    price_yearly: 0,
    description: 'Voir tout, agir nulle part',
    features: [
      'Voir toutes les cagnottes (lecture seule)',
      'Voir les profils et le Score d\'Humanité communautaire',
      'Voir l\'impact mondial en direct',
      'Aria : 3 messages/jour pour tester',
      'Aucune création possible',
      'Aucun gain possible',
    ],
  },
  trial: {
    id: 'trial' as const,
    label: 'Essai 2 semaines',
    price_monthly: 0,
    price_yearly: 0,
    days: 14,
    description: 'Tout débloqué pendant 14 jours',
    features: [
      'Toutes les fonctionnalités payantes',
      'Aria illimité',
      'Création de cagnottes illimitée',
      'Wallet activé (gains accumulés)',
      'Carte Bitcoin "argent à mémoire"',
    ],
  },
  monthly: {
    id: 'monthly' as const,
    label: 'Mensuel',
    price_monthly: 9.99,
    price_yearly: 9.99 * 12,
    first_month_discount: 0.10,        // -10% premier mois → 8.99€
    first_month_price: 8.99,
    description: 'Engagement souple',
    features: [
      'Tout débloqué',
      'Aria illimité (Sonnet 4.6)',
      'Cagnottes illimitées',
      'Redistribution mensuelle CA',
      'Wallet + retrait IBAN',
      'Carte d\'impact',
    ],
  },
  annual: {
    id: 'annual' as const,
    label: 'Annuel',
    price_monthly: 71.93 / 12,         // ≈ 5.99€/mois équivalent
    price_yearly: 71.93,
    discount_pct: 30,
    description: 'Le meilleur prix',
    badge: 'Économise 30%',
    features: [
      'Tout du Mensuel',
      '5.99€/mois équivalent',
      'Engagement annuel',
      'Carte Bitcoin gravée',
      'Score d\'Humanité boost +5%',
    ],
  },
  lifetime: {
    id: 'lifetime' as const,
    label: 'À vie (anti-churn)',
    price_monthly: 4.99,
    price_yearly: 0,                   // unique paiement, pas de yearly
    is_lifetime: true,
    description: 'Abonnement à vie 4.99€/mois — proposé après désabonnement',
    eligibility: 'Proposé automatiquement à un user qui se désabonne',
    features: [
      'Tout débloqué à vie',
      'Garde le Fil de Vie pour toujours',
      '4.99€/mois bloqué à vie (jamais d\'augmentation)',
    ],
  },
} as const

export type PlanId = keyof typeof PLANS

// ──────────────────────────────────────────────────────────────────
// Split CA mensuel (BRIEF §6 — Treezor SEPA, Phase 2 post-SASU)
// 50% users (selon Score d'Humanité, cap 12 mois ancienneté)
// 10% Asso PURAMA, 10% ADYA, 30% SASU PURAMA (0% IS ZFRR)
// ──────────────────────────────────────────────────────────────────
export const CA_SPLIT = {
  users: 0.50,
  asso: 0.10,
  adya: 0.10,
  sasu: 0.30,
} as const

// ──────────────────────────────────────────────────────────────────
// Split cagnotte (BRIEF §3 module 2)
// 70% projet, 15% contributeurs (récompenses missions), 5% sécurité, 10% fonds VIDA (dont 5% Asso)
// ──────────────────────────────────────────────────────────────────
export const CAGNOTTE_SPLIT = {
  projet: 0.70,
  contributeurs: 0.15,
  securite: 0.05,
  fonds_vida: 0.10,
} as const

// ──────────────────────────────────────────────────────────────────
// Parrainage (BRIEF §5 + V7.2 §35.2)
// Filleul : -50% premier mois | Parrain : 50% du 1er + 10% à vie tant que filleul actif
// ──────────────────────────────────────────────────────────────────
export const REFERRAL = {
  FILLEUL_FIRST_DISCOUNT_PCT: 0.50,
  PARRAIN_FIRST_PAYMENT_PCT: 0.50,
  PARRAIN_RECURRING_PCT: 0.10,
  INFLUENCER_CODE_VALIDITY_DAYS: 7,
} as const

// Wallet / retrait (BRIEF §5)
export const WALLET_MIN_WITHDRAWAL_EUR = 5.00

// Score d'Humanité initial (Default ANSWERS taken — progress.md)
export const SCORE_HUMANITE_INITIAL = 5.0

// Cap ancienneté abonnement (BRIEF §6 — 12 mois STRICT)
export const ABONNEMENT_ANCIENNETE_CAP_MONTHS = 12

// ──────────────────────────────────────────────────────────────────
// Modèles IA fallbacks (CLAUDE.md V7.2 §22)
// ──────────────────────────────────────────────────────────────────
export const AI_MODEL_FALLBACKS = {
  main: 'claude-sonnet-4-6',
  fast: 'claude-haiku-4-5-20251001',
  pro: 'claude-opus-4-7',
} as const

// ──────────────────────────────────────────────────────────────────
// Réactions multisensorielles autorisées (BRIEF §3 module 3)
// JAMAIS "haha" ni "colère" ni "triste"
// ──────────────────────────────────────────────────────────────────
export const REACTION_TYPES = ['energie', 'gratitude', 'soutien'] as const
export type ReactionType = (typeof REACTION_TYPES)[number]

// ──────────────────────────────────────────────────────────────────
// 6 rituels planétaires hebdomadaires (BRIEF §3 module 7 — cycle 6 semaines)
// ──────────────────────────────────────────────────────────────────
export const RITUELS = [
  { id: 1, theme: 'depollution', label: 'Dépolluer le monde', description: 'Mission collective de nettoyage' },
  { id: 2, theme: 'paix', label: 'Paix dans le monde', description: 'Apaiser un conflit autour de soi' },
  { id: 3, theme: 'amour', label: 'Amour partout, tout le temps', description: 'Une action d\'amour gratuit' },
  { id: 4, theme: 'pardon', label: 'Pardon universel', description: 'Pardonner ou se faire pardonner' },
  { id: 5, theme: 'gratitude', label: 'Gratitude', description: 'Exprimer 3 gratitudes' },
  { id: 6, theme: 'abondance', label: 'Abondance partagée', description: 'Donner ce qui manque ailleurs' },
] as const

// ──────────────────────────────────────────────────────────────────
// 7 règles sacrées BRIEF §1 — JAMAIS violées
// ──────────────────────────────────────────────────────────────────
export const REGLES_SACREES = [
  '1. Zéro pub externe — uniquement pub interne entre utilisateurs',
  '2. Zéro toxicité — pas de likes négatifs, pas de comparaison, pas de FOMO',
  '3. Zéro manipulation — l\'IA explique chaque suggestion',
  '4. 100% naturel — design pur, calme, espaces respirants',
  '5. Argent vivant — chaque euro a une trace, une mémoire, une conséquence',
  '6. Universalité radicale — sceptiques, démotivés, fatigués bienvenus',
  '7. Continuité de vie — le Fil de Vie ne s\'efface jamais',
] as const

export const isSuperAdmin = (email?: string | null): boolean => email === SUPER_ADMIN_EMAIL
