// KOSHA — Types globaux

export type UserRole = 'user' | 'influencer' | 'super_admin'

export type PlanId = 'free' | 'trial' | 'monthly' | 'annual' | 'lifetime'

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'

// Profile (matche schema kosha.profiles SQL)
export interface Profile {
  id: string                    // UUID = auth.users.id
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  plan: PlanId
  subscription_status: SubscriptionStatus | null
  trial_ends_at: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  treezor_user_id: string | null
  referral_code: string                       // unique, généré au signup
  referred_by: string | null                  // user_id du parrain
  wallet_balance_cents: number                // €
  // KOSHA-specific
  score_humanite: number                      // 0.0 → 10.0
  fil_de_vie_count: number
  awakening_level: number                     // 1 → 10
  silence_mode_active: boolean
  preferred_locale: string                    // 'fr' par défaut
  theme: 'dark' | 'light' | 'auto'
  onboarding_completed: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface FilDeVieEntry {
  id: string
  user_id: string
  action_type: string         // 'cagnotte_created' | 'mission_completed' | 'rituel_participated' | etc.
  action_label: string        // texte court
  impact_data: Record<string, unknown> // { kg_dechets?, arbres?, l_eau?, personnes? }
  created_at: string          // IMMUTABLE
}

export interface ScoreHumaniteSnapshot {
  user_id: string
  score: number               // 0.0 → 10.0
  components: {
    fiabilite: number
    entraide: number
    regularite: number
    impact: number
  }
  computed_at: string
}

// Cagnotte (P3)
export type CagnotteType =
  | 'communautaire'
  | 'projet_vie'
  | 'action_immediate'
  | 'humanitaire'
  | 'hybride'

export type CagnotteStatus = 'active' | 'completed' | 'frozen' | 'fraud_check' | 'cancelled'

export interface Cagnotte {
  id: string
  owner_id: string
  type: CagnotteType
  title: string
  description: string
  target_amount_cents: number
  raised_amount_cents: number
  status: CagnotteStatus
  ai_score_arnaque: number | null    // 0-100, > 70 = freeze
  ai_reformulation_done: boolean
  image_url: string | null
  geolocation_geohash: string | null
  created_at: string
  ends_at: string | null
}
