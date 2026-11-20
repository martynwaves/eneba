import { loadStripe, type Stripe } from '@stripe/stripe-js'

const stripeCache = new Map<string, Promise<Stripe | null>>()

/** Load Stripe.js once per publishable key. */
export const getStripe = (key: string) => {
  if (!stripeCache.has(key)) stripeCache.set(key, loadStripe(key))
  return stripeCache.get(key)!
}

/** Stripe's card field styled like Eneba's inputs (the card element takes `style`, not an Appearance theme). */
export const cardElementStyle = {
  base: { color: '#ffffff', fontSize: '16px', fontFamily: 'Metropolis, Arial, sans-serif', '::placeholder': { color: '#b3aac9' }, iconColor: '#ffffff' },
  invalid: { color: '#ff5c7a', iconColor: '#ff5c7a' },
}
