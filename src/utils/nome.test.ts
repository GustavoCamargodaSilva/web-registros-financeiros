import { describe, expect, it } from 'vitest'
import { primeiroNome } from './nome'

describe('primeiroNome', () => {
  it('retorna só o primeiro nome', () => {
    expect(primeiroNome('Gustavo Camargo')).toBe('Gustavo')
  })

  it('trata vazio', () => {
    expect(primeiroNome('')).toBe('—')
    expect(primeiroNome(null)).toBe('—')
  })
})
