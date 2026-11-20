// Stripe's public test cards. Only the outcome ever leaves the browser - never the number.
const TEST_CARDS: Record<string, 'success' | 'decline'> = {
  '4242424242424242': 'success',
  '5555555555554444': 'success',
  '4000000000000002': 'decline',
  '4000000000009995': 'decline',
}

export interface SimulatedCard {
  number: string
  expiry: string
  cvc: string
}

export const DEFAULT_TEST_CARD: SimulatedCard = { number: '4242 4242 4242 4242', expiry: '12 / 34', cvc: '123' }

/** Validates the simulated card form like Stripe's test mode; returns the outcome or a message for the buyer. */
export function simulatedOutcome(card: SimulatedCard, today = new Date()): { outcome: 'success' | 'decline' } | { error: string } {
  const outcome = TEST_CARDS[card.number.replace(/\s/g, '')]
  if (!outcome) {
    return { error: 'This is a test environment. Use a test card such as 4242 4242 4242 4242 (success) or 4000 0000 0000 0002 (declined).' }
  }
  const expiry = /^(\d{2})\s?\/\s?(\d{2})$/.exec(card.expiry)
  const month = Number(expiry?.[1])
  // A card is valid through the last day of its expiry month.
  const expired = !expiry || month < 1 || month > 12 || new Date(2000 + Number(expiry[2]), month) <= today
  if (expired || !/^\d{3,4}$/.test(card.cvc)) {
    return { error: 'Enter any future expiry date (MM / YY) and any 3-digit CVC.' }
  }
  return { outcome }
}
