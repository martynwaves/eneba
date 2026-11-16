import { describe, expect, it } from 'vitest'
import { toQueryString } from '../lib/api'
import { formatPrice, pluralize } from '../lib/format'

describe('formatPrice', () => {
  it('formats integer cents as euros', () => {
    expect(formatPrice(2109)).toBe('€21.09')
    expect(formatPrice(0)).toBe('€0.00')
  })

  it('shows a dash for missing prices', () => {
    expect(formatPrice(null)).toBe('—')
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
