/** eneba.com pages the storefront links out to (terms, privacy, support...). */
export const ENEBA_URL = 'https://www.eneba.com'

export const LOGO_URL = 'https://static.eneba.games/branding/v2/logoFull.svg'

export const LOGO_SYMBOL_URL = 'https://static.eneba.games/branding/v2/logoSymbol.svg'

export const TRUSTPILOT_URL = 'https://www.trustpilot.com/review/eneba.com'

/** Eneba's payment method artwork, e.g. `paymentLogo('braintree_paypal')`. */
export const paymentLogo = (file: string) => `https://assets.eneba.games/payments/v1/color/${file}.svg`
