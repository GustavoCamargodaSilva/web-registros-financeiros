import { describe, expect, it } from 'vitest'
import { buildAuthPath, getSafeReturnUrl } from './returnUrl'

describe('getSafeReturnUrl', () => {
  it('usa fallback quando vazio', () => {
    expect(getSafeReturnUrl(null)).toBe('/despesas')
    expect(getSafeReturnUrl(undefined)).toBe('/despesas')
    expect(getSafeReturnUrl('')).toBe('/despesas')
  })

  it('aceita path interno com query', () => {
    expect(getSafeReturnUrl('/convites/aceitar?token=abc')).toBe('/convites/aceitar?token=abc')
  })

  it('rejeita open redirect', () => {
    expect(getSafeReturnUrl('https://evil.com')).toBe('/despesas')
    expect(getSafeReturnUrl('//evil.com')).toBe('/despesas')
  })
})

describe('buildAuthPath', () => {
  it('monta login com returnUrl encoded', () => {
    expect(buildAuthPath('/login', '/convites/aceitar?token=x')).toBe(
      '/login?returnUrl=%2Fconvites%2Faceitar%3Ftoken%3Dx',
    )
  })
})
