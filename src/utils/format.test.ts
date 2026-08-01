import { describe, expect, it } from 'vitest'
import { formatCurrency, formatEixoCompacto } from './format'

describe('formatCurrency', () => {
  it('formata valores em reais', () => {
    expect(formatCurrency(1500)).toContain('1.500')
  })
})

describe('formatEixoCompacto', () => {
  it('formata valores abaixo de 1000 como inteiro localizado', () => {
    expect(formatEixoCompacto(400)).toBe('400')
    expect(formatEixoCompacto(800)).toBe('800')
    expect(formatEixoCompacto(999)).toBe('999')
  })

  it('formata milhares com sufixo mil', () => {
    expect(formatEixoCompacto(1000)).toBe('1 mil')
    expect(formatEixoCompacto(1200)).toBe('1,2 mil')
    expect(formatEixoCompacto(2000)).toBe('2 mil')
  })
})
