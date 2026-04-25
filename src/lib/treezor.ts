/**
 * KOSHA — Treezor adapter
 *
 * Phase 1 (actuelle, pré-SASU) : STUB. Aucune transaction réelle.
 *   Tous les appels sont loggés en console + objet retour mock cohérent.
 *   Ça permet à toute la chaîne (UI / webhook / split / payout) d'être
 *   testée end-to-end sans avoir besoin de la vraie clé Treezor sandbox.
 *
 * Phase 2 (post-SASU + KYC Tissma + KBIS) : on remplace les fonctions
 *   stubbées par les vrais appels Treezor REST.
 *
 * Tout passe par cet adapter. Aucun appel direct à fetch('treezor...') ailleurs.
 */
import { CAGNOTTE_SPLIT } from './constants'

const STUB_MODE = (process.env.TREEZOR_API_KEY ?? '').startsWith('stub_') || !process.env.TREEZOR_API_KEY

export interface TreezorUser {
  user_id: string
  status: 'pending' | 'validated'
  created_at: string
}

export interface TreezorWallet {
  wallet_id: string
  user_id: string
  iban: string | null
  balance_cents: number
  currency: 'EUR'
}

export interface TreezorPayoutSimulation {
  payout_id: string
  cagnotte_id: string
  total_cents: number
  splits: {
    projet_cents: number
    contributors_cents: number
    securite_cents: number
    fonds_vida_cents: number
  }
  status: 'simulated' | 'pending' | 'paid'
  simulated_at: string
}

/**
 * Create a Treezor user (KYC light).
 * Phase 1 : returns a deterministic stub.
 */
export async function createTreezorUser(opts: {
  email: string
  firstName: string
  lastName: string
  birthDate: string
}): Promise<TreezorUser> {
  if (STUB_MODE) {
    return {
      user_id: `stub_user_${hashString(opts.email)}`,
      status: 'pending',
      created_at: new Date().toISOString(),
    }
  }
  throw new Error('Treezor live mode not implemented yet — Phase 2 post-SASU')
}

/**
 * Create a Treezor wallet attached to a user.
 */
export async function createTreezorWallet(userId: string): Promise<TreezorWallet> {
  if (STUB_MODE) {
    return {
      wallet_id: `stub_wallet_${userId.slice(-8)}`,
      user_id: userId,
      iban: null,
      balance_cents: 0,
      currency: 'EUR',
    }
  }
  throw new Error('Treezor live mode not implemented yet — Phase 2 post-SASU')
}

/**
 * Calculate the canonical split 70/15/5/10 for a given total amount.
 * Used both by the trigger SQL and by the simulation here.
 * Last bucket (fonds_vida) absorbs rounding remainder so total === amount.
 */
export function calculateSplit(amountCents: number): {
  projet_cents: number
  contributors_cents: number
  securite_cents: number
  fonds_vida_cents: number
} {
  const projet = Math.floor(amountCents * CAGNOTTE_SPLIT.projet)
  const contributors = Math.floor(amountCents * CAGNOTTE_SPLIT.contributeurs)
  const securite = Math.floor(amountCents * CAGNOTTE_SPLIT.securite)
  const fonds_vida = amountCents - projet - contributors - securite
  return { projet_cents: projet, contributors_cents: contributors, securite_cents: securite, fonds_vida_cents: fonds_vida }
}

/**
 * Simulate the payout of a completed cagnotte split.
 * Returns a simulation object that the caller logs to DB (audit trail).
 */
export async function simulatePayout(opts: {
  cagnotteId: string
  totalCents: number
}): Promise<TreezorPayoutSimulation> {
  const splits = calculateSplit(opts.totalCents)
  const sim: TreezorPayoutSimulation = {
    payout_id: `stub_payout_${Date.now()}_${opts.cagnotteId.slice(0, 8)}`,
    cagnotte_id: opts.cagnotteId,
    total_cents: opts.totalCents,
    splits,
    status: 'simulated',
    simulated_at: new Date().toISOString(),
  }
  return sim
}

/**
 * Whether this runtime is using Treezor stub mode. Useful for UI banners.
 */
export function isTreezorStubMode(): boolean {
  return STUB_MODE
}

// -----------------------------------------------------------------------------
// internals
// -----------------------------------------------------------------------------
function hashString(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h).toString(36)
}
