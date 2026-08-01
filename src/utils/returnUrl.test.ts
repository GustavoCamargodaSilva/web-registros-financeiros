import { describe, expect, it } from 'vitest'
import { buildAuthPath, getSafeReturnUrl } from './returnUrl'

describe('getSafeReturnUrl', () => {
  it('usa fallback quando vazio', () => {
    expect(getSafeReturnUrl(null)).toBe('/home')
    expect(getSafeReturnUrl(undefined)).toBe('/home')
    expect(getSafeReturnUrl('')).toBe('/home')
  })

  it('aceita path interno com query', () => {
    expect(getSafeReturnUrl('/convites/aceitar?token=abc')).toBe('/convites/aceitar?token=abc')
  })

  it('rejeita open redirect', () => {
    expect(getSafeReturnUrl('https://evil.com')).toBe('/home')
    expect(getSafeReturnUrl('//evil.com')).toBe('/home')
  })
})

describe('buildAuthPath', () => {
  it('monta login com returnUrl encoded', () => {
    expect(buildAuthPath('/login', '/convites/aceitar?token=x')).toBe(
      '/login?returnUrl=%2Fconvites%2Faceitar%3Ftoken%3Dx',
    )
  })
})
