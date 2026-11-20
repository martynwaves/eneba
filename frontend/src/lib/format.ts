import { useSettings } from '../stores/settings'
import type { CartLine, OperatingSystem } from './types'

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

/** Seller cashback on an amount, rounded down per line exactly like the backend credits it. */
export function cashbackCents(amountCents: number, percent: number | null | undefined): number {
  return Math.floor((amountCents * (percent ?? 0)) / 100)
}

/** Total cashback across cart lines. */
export function cartCashback(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + cashbackCents(l.line_total, l.cashback_percent), 0)
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

export const OS_LABELS: Record<OperatingSystem, string> = { windows: 'Windows', mac: 'Mac', linux: 'Linux' }

/** Steam's OS keys as names; console device labels ("PS5") pass through unchanged. */
export const osLabel = (os: string): string => OS_LABELS[os as OperatingSystem] ?? os
