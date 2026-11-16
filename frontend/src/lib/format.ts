import { useSettings } from '../stores/settings'

const formatters = new Map<string, Intl.NumberFormat>()

function formatter(code: string): Intl.NumberFormat {
  if (!formatters.has(code)) {
    formatters.set(code, new Intl.NumberFormat('en-IE', { style: 'currency', currency: code, currencyDisplay: 'narrowSymbol' }))
  }
  return formatters.get(code)!
}

/**
 * Prices travel as integer EUR cents and are shown in the visitor's display currency.
 * Pass `charge: true` for amounts that are actually charged, which are always in EUR.
 */
export function formatPrice(cents: number | null | undefined, { charge = false }: { charge?: boolean } = {}): string {
  if (cents === null || cents === undefined) return '—'
  const currency = charge ? { code: 'EUR', rate: 1 } : useSettings.getState().currency
  return formatter(currency.code).format((cents / 100) * currency.rate)
}

export function formatDate(iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-GB', opts).format(new Date(iso))
}

export function formatCount(n: number): string {
  return new Intl.NumberFormat('en', { notation: n >= 10000 ? 'compact' : 'standard' }).format(n)
}

export const TYPE_LABELS: Record<string, string> = {
  game: 'Game',
  dlc: 'DLC',
  gift_card: 'Gaming eCards',
  egift_card: 'eGift Cards',
  e_money: 'E-money',
  subscription: 'Subscription',
  game_points: 'Game points',
  software: 'Software',
}

export function pluralize(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`
}
