import { loadStripe, type Appearance, type Stripe } from '@stripe/stripe-js'

const stripeCache = new Map<string, Promise<Stripe | null>>()

/** Load Stripe.js once per publishable key. */
export const getStripe = (key: string) => {
  if (!stripeCache.has(key)) stripeCache.set(key, loadStripe(key))
  return stripeCache.get(key)!
}

/** Payment Element themed to match Eneba: dark violet fields, yellow focus, square corners. */
export const stripeAppearance: Appearance = {
  theme: 'night',
  variables: {
    colorPrimary: '#fad318',
    colorBackground: '#2a0d6b',
    colorText: '#ffffff',
    colorTextSecondary: '#b3aac9',
    colorDanger: '#ff5c7a',
    fontFamily: 'Metropolis, Arial, sans-serif',
    borderRadius: '0px',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': { border: '1px solid rgba(255,255,255,0.25)', boxShadow: 'none' },
    '.Input:focus': { border: '1px solid #fad318', boxShadow: 'none' },
    '.Tab': { border: '1px solid rgba(255,255,255,0.25)' },
    '.Tab--selected': { borderColor: '#fad318' },
  },
}
