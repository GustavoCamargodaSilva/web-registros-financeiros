import { describe, expect, it } from 'vitest'
import { formatCurrency } from './format'

describe('formatCurrency', () => {
  it('formata valores em reais', () => {
    expect(formatCurrency(1500)).toContain('1.500')
  })
})
