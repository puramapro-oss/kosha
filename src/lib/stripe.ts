import Stripe from 'stripe'
import { PLANS } from './constants'

let _stripe: Stripe | null = null
export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-09-30.clover' as never,
    })
  }
  return _stripe
}

export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!

// Centimes helper
export const toCents = (eur: number): number => Math.round(eur * 100)
export const fromCents = (cents: number): number => cents / 100

// ──────────────────────────────────────────────────────────────────
// Création des produits Stripe — appelée au premier setup admin
// (CLAUDE-2.md §59 — auto-création via API, pas dashboard manuel)
// ──────────────────────────────────────────────────────────────────
export async function createKoshaStripeProducts(): Promise<{
  products: Array<{ plan: string; product_id: string; price_id: string }>
  coupons: { referral_50: string }
}> {
  const stripe = getStripe()
  const products: Array<{ plan: string; product_id: string; price_id: string }> = []

  // Mensuel 9.99€
  const monthlyProduct = await stripe.products.create({
    name: 'KOSHA — Mensuel',
    description: PLANS.monthly.description,
    metadata: { app: 'kosha', plan: 'monthly' },
  })
  const monthlyPrice = await stripe.prices.create({
    product: monthlyProduct.id,
    unit_amount: toCents(PLANS.monthly.price_monthly),
    currency: 'eur',
    recurring: { interval: 'month' },
    metadata: { app: 'kosha', plan: 'monthly' },
  })
  products.push({ plan: 'monthly', product_id: monthlyProduct.id, price_id: monthlyPrice.id })

  // Annuel 71.93€
  const annualProduct = await stripe.products.create({
    name: 'KOSHA — Annuel',
    description: PLANS.annual.description,
    metadata: { app: 'kosha', plan: 'annual' },
  })
  const annualPrice = await stripe.prices.create({
    product: annualProduct.id,
    unit_amount: toCents(PLANS.annual.price_yearly),
    currency: 'eur',
    recurring: { interval: 'year' },
    metadata: { app: 'kosha', plan: 'annual' },
  })
  products.push({ plan: 'annual', product_id: annualProduct.id, price_id: annualPrice.id })

  // À vie (anti-churn) 4.99€/mois
  const lifetimeProduct = await stripe.products.create({
    name: 'KOSHA — À vie',
    description: PLANS.lifetime.description,
    metadata: { app: 'kosha', plan: 'lifetime' },
  })
  const lifetimePrice = await stripe.prices.create({
    product: lifetimeProduct.id,
    unit_amount: toCents(PLANS.lifetime.price_monthly),
    currency: 'eur',
    recurring: { interval: 'month' },
    metadata: { app: 'kosha', plan: 'lifetime', anti_churn: 'true' },
  })
  products.push({ plan: 'lifetime', product_id: lifetimeProduct.id, price_id: lifetimePrice.id })

  // Coupon parrainage -50% premier mois (BRIEF §5)
  const referralCoupon = await stripe.coupons.create({
    percent_off: 50,
    duration: 'once',
    name: 'KOSHA — Parrainage -50% premier mois',
    metadata: { app: 'kosha', type: 'referral' },
  })

  return {
    products,
    coupons: { referral_50: referralCoupon.id },
  }
}
