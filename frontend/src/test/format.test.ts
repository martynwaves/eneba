import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, api, toQueryString } from '../lib/api'
import { cartCashback, cashbackCents, formatPrice, osLabel, pluralize } from '../lib/format'
import { simulatedOutcome } from '../lib/simulatedPayment'
import type { CartLine } from '../lib/types'

describe('formatPrice', () => {
  it('formats integer cents as euros', () => {
    expect(formatPrice(2109)).toBe('€21.09')
    expect(formatPrice(0)).toBe('€0.00')
  })

  it('shows a dash for missing prices', () => {
    expect(formatPrice(null)).toBe('—')
  })
})

describe('cashback', () => {
  it('rounds down per line, the way the backend credits it', () => {
    expect(cashbackCents(1999, 5)).toBe(99)
    expect(cashbackCents(1999, null)).toBe(0)
    const lines = [
      { line_total: 1999, cashback_percent: 5 },
      { line_total: 999, cashback_percent: 11 },
    ] as CartLine[]
    expect(cartCashback(lines)).toBe(99 + 109)
  })
})

describe('osLabel', () => {
  it('names Steam operating systems and passes console labels through', () => {
    expect(osLabel('mac')).toBe('Mac')
    expect(osLabel('PS5')).toBe('PS5')
  })
})

describe('simulatedOutcome', () => {
  it('maps Stripe test cards to an outcome and rejects anything else', () => {
    expect(simulatedOutcome({ number: '4242 4242 4242 4242', expiry: '12 / 34', cvc: '123' })).toEqual({ outcome: 'success' })
    expect(simulatedOutcome({ number: '4000 0000 0000 0002', expiry: '12/34', cvc: '123' })).toEqual({ outcome: 'decline' })
    expect(simulatedOutcome({ number: '1234 5678 9012 3456', expiry: '12/34', cvc: '123' })).toHaveProperty('error')
    expect(simulatedOutcome({ number: '4242424242424242', expiry: 'soon', cvc: '1' })).toHaveProperty('error')
  })

  it('accepts a card through its expiry month and rejects it after', () => {
    const card = { number: '4242 4242 4242 4242', expiry: '11 / 26', cvc: '123' }
    expect(simulatedOutcome(card, new Date(2026, 10, 30))).toEqual({ outcome: 'success' })
    expect(simulatedOutcome(card, new Date(2026, 11, 1))).toHaveProperty('error')
    expect(simulatedOutcome({ ...card, expiry: '13 / 30' })).toHaveProperty('error')
  })
})

describe('api', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('turns a non-JSON error page (an API still waking up) into a readable, retryable error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>Bad Gateway</html>', { status: 502 })))
    const error = await api('/products').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(502)
    expect((error as ApiError).message).toMatch(/try again/)
  })
})

describe('toQueryString', () => {
  it('drops empty values and joins lists', () => {
    expect(toQueryString({ q: 'witcher', platform: ['steam', 'gog'], region: '', page: undefined })).toBe('?q=witcher&platform=steam%2Cgog')
    expect(toQueryString({})).toBe('')
  })
})

describe('pluralize', () => {
  it('handles singular and plural', () => {
    expect(pluralize(1, 'item')).toBe('1 item')
    expect(pluralize(3, 'item')).toBe('3 items')
  })
})
